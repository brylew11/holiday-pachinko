const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Migration script to add avatarUrl and generationStatus fields to existing player documents
 * This script is idempotent and safe to run multiple times
 */
async function migratePlayerAvatarFields() {
  try {
    console.log('Starting player avatar fields migration...');

    // Query all documents in the 'players' collection
    const playersSnapshot = await db.collection('players').get();

    if (playersSnapshot.empty) {
      console.log('No player documents found. Migration complete.');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const batch = db.batch();

    // Iterate through each player document
    playersSnapshot.forEach(doc => {
      const data = doc.data();

      // Check if fields already exist
      const needsUpdate = !data.hasOwnProperty('avatarUrl') || !data.hasOwnProperty('generationStatus');

      if (needsUpdate) {
        const updateData = {};

        // Add avatarUrl field if missing
        if (!data.hasOwnProperty('avatarUrl')) {
          updateData.avatarUrl = null;
        }

        // Add generationStatus field if missing
        if (!data.hasOwnProperty('generationStatus')) {
          updateData.generationStatus = 'pending';
        }

        // Add to batch update
        batch.update(doc.ref, updateData);
        updatedCount++;

        console.log(`Queued update for player: ${doc.id} (${data.name})`);
      } else {
        skippedCount++;
        console.log(`Skipped player: ${doc.id} (${data.name}) - fields already exist`);
      }
    });

    // Commit batch update
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\nMigration complete!`);
      console.log(`- Updated: ${updatedCount} players`);
      console.log(`- Skipped: ${skippedCount} players (already had fields)`);
      console.log(`- Total: ${playersSnapshot.size} players`);
    } else {
      console.log(`\nNo updates needed. All ${playersSnapshot.size} players already have the required fields.`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run migration
migratePlayerAvatarFields()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
