const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

async function createSettings() {
  try {
    await db.collection('settings').doc('avatarGeneration').set({
      geminiAvatarPrompt: 'Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression',
      placeholderAvatarUrl: 'https://via.placeholder.com/512',
      enabled: true
    });
    console.log('✅ Settings document created successfully');
  } catch (error) {
    console.error('❌ Error creating settings:', error);
  }
  process.exit(0);
}

createSettings();
