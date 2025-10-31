const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // Delete null coach documents
    const result = await db.collection('coachprofiles').deleteMany({ 
      $or: [{ coach: null }, { coachId: null }] 
    });
    console.log(`Deleted ${result.deletedCount} invalid profiles`);
    
    // Drop old index
    try {
      await db.collection('coachprofiles').dropIndex("coach_1");
      console.log('Dropped old coach index');
    } catch (e) {
      console.log('Old index already dropped');
    }
    
    // Create new index
    await db.collection('coachprofiles').createIndex({ coachId: 1 }, { unique: true });
    console.log('Created new coachId index');
    
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
}

cleanup();