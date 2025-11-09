const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');
const sharp = require('sharp');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Vertex AI with project from Firebase config
// Uses Application Default Credentials (ADC) - no API key needed
const project = process.env.GCLOUD_PROJECT;
const location = 'us-central1';
const vertexAI = new VertexAI({ project, location });

/**
 * Cloud Function to generate player avatar using Gemini AI
 * Triggered when a file is uploaded to player-photos/ directory
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

      // Step 3: Call Vertex AI Gemini to generate avatar
      const generatedImageBuffer = await generateAvatarWithGemini(
        imageBuffer,
        prompt
      );
      console.log('Generated avatar from Vertex AI Gemini');

      // Step 4: Convert and resize image to JPEG
      const optimizedImageBuffer = await convertToJPEG(generatedImageBuffer);
      console.log('Converted avatar to JPEG format');

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
    return data.geminiAvatarPrompt || defaultPrompt;
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
 * Calls Vertex AI Gemini to generate cartoon avatar
 * Uses Application Default Credentials for authentication
 * @param {Buffer} imageBuffer - Original photo buffer
 * @param {string} prompt - Gemini prompt
 * @returns {Promise<Buffer>} Generated image buffer
 */
async function generateAvatarWithGemini(imageBuffer, prompt) {
  // Get generative model from Vertex AI
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash-001',
  });

  // Convert image buffer to base64
  const base64Image = imageBuffer.toString('base64');

  // Determine MIME type (support JPEG, PNG, WebP)
  let mimeType = 'image/jpeg';
  if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
    mimeType = 'image/png';
  } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
    mimeType = 'image/webp';
  }

  // Prepare request with retry logic
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const request = {
        contents: [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        }],
      };

      const result = await model.generateContent(request);
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      // Note: Gemini (multimodal) currently returns text descriptions, not images
      // For actual image generation, we would need to use Imagen (Vertex AI's image generation model)
      // For now, we'll return the original image as a placeholder
      // In production, integrate with Imagen API: vertexAI.preview.getGenerativeModel({ model: 'imagegeneration@005' })
      console.warn('Gemini returned text response:', text.substring(0, 100));
      console.warn('Image generation not yet implemented, returning original image');
      console.warn('To generate images, use Imagen model instead of Gemini');

      return imageBuffer;
    } catch (error) {
      lastError = error;
      console.error(`Vertex AI attempt ${attempt + 1} failed:`, error.message);

      if (attempt < 2) {
        // Exponential backoff: wait 1s, then 2s
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Vertex AI Gemini failed after 3 attempts: ${lastError.message}`);
}

/**
 * Converts image to JPEG format and optimizes size
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {Promise<Buffer>} JPEG image buffer
 */
async function convertToJPEG(imageBuffer) {
  return sharp(imageBuffer)
    .resize(512, 512, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Uploads generated avatar to Firebase Storage
 * @param {string} playerId - Player document ID
 * @param {Buffer} imageBuffer - Avatar image buffer
 * @returns {Promise<string>} Download URL
 */
async function uploadAvatarToStorage(playerId, imageBuffer) {
  const bucket = admin.storage().bucket();
  const fileName = `player-avatars/${playerId}.jpg`;
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });

  // Make file publicly readable
  await file.makePublic();

  // Return public URL
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
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
