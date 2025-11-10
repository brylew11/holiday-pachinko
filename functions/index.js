const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');
const sharp = require('sharp');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Vertex AI for Gemini 2.5 Flash Image
const project = process.env.GCLOUD_PROJECT;
const location = 'us-central1';

const vertex_ai = new VertexAI({ project: project, location: location });
const generativeModel = vertex_ai.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
});

/**
 * Cloud Function to generate player avatar using Gemini 2.5 Flash Image
 * Triggered when a file is uploaded to player-photos/ directory
 * Uses gemini-2.5-flash-image model for likeness-preserving stylization
 * Updated: 2025-11-09
 */
exports.generatePlayerAvatar = onObjectFinalized(
  {
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Only process files in player-photos/ directory
    if (!filePath.startsWith('player-photos/')) {
      console.log('File not in player-photos directory, skipping:', filePath);
      return null;
    }

    // Only process image files
    if (!contentType || !contentType.startsWith('image/')) {
      console.log('File is not an image, skipping:', filePath);
      return null;
    }

    // Extract player ID from filename
    const fileName = filePath.split('/').pop();
    const playerId = fileName.split('.')[0];

    console.log(`Starting avatar generation for player: ${playerId}`);

    try {
      // Step 1: Retrieve Gemini prompt from Firestore settings
      const prompt = await getAvatarPrompt();
      console.log('Using prompt:', prompt);

      // Step 2: Download player photo from Storage
      const imageBuffer = await downloadPlayerPhoto(filePath);
      console.log('Downloaded player photo, size:', imageBuffer.length, 'bytes');

      // Step 3: Call Vertex AI Imagen to generate avatar
      const generatedImageBuffer = await generateAvatarWithImagen(
        imageBuffer,
        prompt
      );
      console.log('Generated avatar from Vertex AI Imagen');

      // Step 4: Convert and resize image to PNG with transparency
      const optimizedImageBuffer = await convertToPNG(generatedImageBuffer);
      console.log('Converted avatar to PNG format with transparency');

      // Step 5: Upload generated avatar to Storage
      const avatarUrl = await uploadAvatarToStorage(playerId, optimizedImageBuffer);
      console.log('Uploaded avatar to Storage:', avatarUrl);

      // Step 6: Update player document with avatarUrl and status
      await updatePlayerDocument(playerId, avatarUrl, 'completed');
      console.log('Updated player document with avatar URL');

      return { success: true, playerId, avatarUrl };
    } catch (error) {
      console.error('Error generating avatar for player:', playerId, error);

      // Get placeholder avatar URL and update player document with failed status
      try {
        const placeholderUrl = await getPlaceholderAvatarUrl();
        await updatePlayerDocument(playerId, placeholderUrl, 'failed');
        console.log('Set placeholder avatar due to error');
      } catch (updateError) {
        console.error('Failed to update player document with error status:', updateError);
      }

      // Return error but don't throw to avoid function retry storms
      return { success: false, playerId, error: error.message };
    }
  }
);

/**
 * Retrieves the Gemini avatar prompt from Firestore settings
 * @returns {Promise<string>} The prompt text
 */
async function getAvatarPrompt() {
  const defaultPrompt = 'Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression';

  try {
    const db = admin.firestore();
    const settingsDoc = await db.collection('settings').doc('avatarGeneration').get();

    if (!settingsDoc.exists) {
      console.warn('Settings document not found, using default prompt');
      return defaultPrompt;
    }

    const data = settingsDoc.data();
    // Support both legacy geminiAvatarPrompt and new imagenAvatarPrompt field names
    return data.imagenAvatarPrompt || data.geminiAvatarPrompt || defaultPrompt;
  } catch (error) {
    console.warn('Error fetching prompt from Firestore, using default:', error);
    return defaultPrompt;
  }
}

/**
 * Downloads player photo from Firebase Storage
 * @param {string} filePath - Storage file path
 * @returns {Promise<Buffer>} Image buffer
 */
async function downloadPlayerPhoto(filePath) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  const [buffer] = await file.download();
  return buffer;
}

/**
 * Calls Vertex AI Gemini 2.5 Flash Image to generate cartoon avatar from player photo
 * Uses Application Default Credentials for authentication
 * Uses gemini-2.5-flash-image model for likeness-preserving stylization
 * @param {Buffer} imageBuffer - Original photo buffer
 * @param {string} prompt - Gemini prompt for style transformation
 * @returns {Promise<Buffer>} Generated image buffer
 */
async function generateAvatarWithImagen(imageBuffer, prompt) {
  // Convert image buffer to base64
  const base64Image = imageBuffer.toString('base64');

  // Prepare request with retry logic
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log('Calling Gemini 2.5 Flash Image for image generation...');

      // Define system instruction for likeness preservation
      const systemInstruction = {
        parts: [
          {
            text: 'You are an expert at transforming photos into stylized cartoon characters while preserving the subject\'s likeness and facial features.'
          }
        ]
      };

      // Define generation config
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Define safety settings to block harmful content
      const safetySettings = [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        },
      ];

      // Prepare the request with text prompt and reference image
      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        systemInstruction: systemInstruction,
        generationConfig: generationConfig,
        safetySettings: safetySettings,
      };

      // Call the API
      const response = await generativeModel.generateContent(request);

      // Extract the generated image
      if (!response.response || !response.response.candidates || response.response.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini');
      }

      const candidate = response.response.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('No content parts in Gemini response');
      }

      // Find the part with image data (may be after text parts)
      const imagePart = candidate.content.parts.find(part => part.inlineData && part.inlineData.data);

      if (!imagePart) {
        console.error('Response structure:', JSON.stringify(response.response, null, 2));
        throw new Error('No image data in Gemini response');
      }

      // Convert base64 back to buffer
      const generatedImageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      console.log('Successfully generated avatar with Gemini 2.5 Flash Image');

      return generatedImageBuffer;

    } catch (error) {
      lastError = error;
      console.error(`Gemini attempt ${attempt + 1} failed:`, error.message);

      // Log full error object for debugging
      console.error('Full error:', JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      }, null, 2));

      if (attempt < 2) {
        // Exponential backoff: wait 1s, then 2s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Vertex AI Gemini failed after 3 attempts: ${lastError.message}`);
}

/**
 * Converts image to PNG format with transparency
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {Promise<Buffer>} PNG image buffer with transparency
 */
async function convertToPNG(imageBuffer) {
  return sharp(imageBuffer)
    .resize(1024, 1024, {
      fit: 'cover',
      position: 'center',
    })
    .png({
      compressionLevel: 9, // Maximum compression
      palette: true, // Use palette for smaller file size
    })
    .toBuffer();
}

/**
 * Uploads generated avatar to Firebase Storage
 * @param {string} playerId - Player document ID
 * @param {Buffer} imageBuffer - Avatar image buffer (PNG with transparency)
 * @returns {Promise<string>} Download URL
 */
async function uploadAvatarToStorage(playerId, imageBuffer) {
  const bucket = admin.storage().bucket();
  const fileName = `player-avatars/${playerId}.png`;
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/png',
    },
  });

  // Generate a signed URL with long expiration (uniform bucket-level access requires this)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2099', // Long expiration for effectively public access
  });

  return signedUrl;
}

/**
 * Updates player document with avatar URL and generation status
 * @param {string} playerId - Player document ID
 * @param {string} avatarUrl - Avatar download URL
 * @param {string} status - Generation status ('completed' or 'failed')
 * @returns {Promise<void>}
 */
async function updatePlayerDocument(playerId, avatarUrl, status) {
  const db = admin.firestore();

  // Find player document by ID
  const playerRef = db.collection('players').doc(playerId);
  const playerDoc = await playerRef.get();

  if (!playerDoc.exists) {
    throw new Error(`Player document not found: ${playerId}`);
  }

  // Update document
  await playerRef.update({
    avatarUrl,
    generationStatus: status,
  });
}

/**
 * Retrieves placeholder avatar URL from settings
 * @returns {Promise<string>} Placeholder avatar URL
 */
async function getPlaceholderAvatarUrl() {
  const defaultPlaceholder = 'https://via.placeholder.com/512';

  try {
    const db = admin.firestore();
    const settingsDoc = await db.collection('settings').doc('avatarGeneration').get();

    if (!settingsDoc.exists) {
      return defaultPlaceholder;
    }

    const data = settingsDoc.data();
    return data.placeholderAvatarUrl || defaultPlaceholder;
  } catch (error) {
    console.warn('Error fetching placeholder URL, using default:', error);
    return defaultPlaceholder;
  }
}

/**
 * Firestore trigger to regenerate a player's avatar
 * Triggered when regenerateRequested field is set to true on a player document
 * Downloads the original photo and re-uploads it to trigger avatar generation
 * No CORS issues since this is a server-side trigger
 */
exports.regeneratePlayerAvatar = onDocumentUpdated(
  {
    document: 'players/{playerId}',
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const playerId = event.params.playerId;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only process if regenerateRequested changed from false/undefined to true
    if (!afterData.regenerateRequested || beforeData.regenerateRequested === afterData.regenerateRequested) {
      return null;
    }

    console.log(`Regenerating avatar for player: ${playerId}`);

    try {
      // Step 1: Update player document to set generationStatus to 'pending' and clear the flag
      const db = admin.firestore();
      const playerRef = db.collection('players').doc(playerId);
      await playerRef.update({
        generationStatus: 'pending',
        regenerateRequested: false
      });

      // Step 2: Download the original photo from Storage
      const bucket = admin.storage().bucket();
      const originalPhotoPath = `player-photos/${playerId}.jpg`;
      const file = bucket.file(originalPhotoPath);

      const [exists] = await file.exists();
      if (!exists) {
        console.error(`Original photo not found: ${originalPhotoPath}`);
        await playerRef.update({
          generationStatus: 'failed'
        });
        return null;
      }

      const [buffer] = await file.download();
      console.log(`Downloaded original photo, size: ${buffer.length} bytes`);

      // Step 3: Re-upload the photo to trigger the Storage event
      // We add a small timestamp to metadata to ensure it's treated as a new upload
      await file.save(buffer, {
        metadata: {
          contentType: 'image/jpeg',
          customMetadata: {
            regeneratedAt: new Date().toISOString()
          }
        }
      });

      console.log(`Re-uploaded photo to trigger avatar generation`);

      return { success: true, playerId };
    } catch (error) {
      console.error('Error regenerating avatar:', error);

      // Update player document with error status
      try {
        const db = admin.firestore();
        await db.collection('players').doc(playerId).update({
          generationStatus: 'failed',
          regenerateRequested: false
        });
      } catch (updateError) {
        console.error('Failed to update player document with error status:', updateError);
      }

      return { success: false, playerId, error: error.message };
    }
  }
);
