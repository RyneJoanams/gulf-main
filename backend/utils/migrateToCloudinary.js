/**
 * Migration Script: Base64 Images to Cloudinary
 * 
 * This script migrates existing base64-encoded images in your database
 * to Cloudinary cloud storage.
 * 
 * Usage: node utils/migrateToCloudinary.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Patient = require('../models/Patient');
const Lab = require('../models/lab');
const Radiology = require('../models/radiology');
const Clinical = require('../models/clinical');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to check if string is base64
const isBase64 = (str) => {
  if (!str || typeof str !== 'string') return false;
  // Check if it starts with data: or is a long base64 string
  return str.startsWith('data:') || (str.length > 100 && !str.startsWith('http'));
};

// Helper function to upload base64 to Cloudinary
const uploadBase64ToCloudinary = async (base64String, folder, publicIdPrefix) => {
  try {
    // If it doesn't have the data URI prefix, add it
    let dataUri = base64String;
    if (!base64String.startsWith('data:')) {
      dataUri = `data:image/jpeg;base64,${base64String}`;
    }

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      public_id: `${publicIdPrefix}-${Date.now()}`,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message);
    return null;
  }
};

// Migrate Patient Photos
const migratePatientPhotos = async () => {
  console.log('\n📸 Starting Patient Photo Migration...');
  
  try {
    // Find all patients with base64 photos
    const patients = await Patient.find({
      photo: { $exists: true, $ne: '' }
    });

    console.log(`Found ${patients.length} patients with photos`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const patient of patients) {
      if (!isBase64(patient.photo)) {
        console.log(`⏭️  Skipping ${patient.name} - already has URL or invalid photo`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating photo for: ${patient.name} (${patient.passportNumber})`);

      const cloudinaryUrl = await uploadBase64ToCloudinary(
        patient.photo,
        'gulf-medical/patients',
        `patient-${patient._id}`
      );

      if (cloudinaryUrl) {
        patient.photo = cloudinaryUrl;
        await patient.save();
        console.log(`✅ Successfully migrated: ${patient.name}`);
        migrated++;
      } else {
        console.error(`❌ Failed to migrate: ${patient.name}`);
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Patient Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);

  } catch (error) {
    console.error('Error migrating patient photos:', error);
  }
};

// Migrate Lab Report Images
const migrateLabReportImages = async () => {
  console.log('\n🔬 Starting Lab Report Image Migration...');
  
  try {
    const labReports = await Lab.find({
      patientImage: { $exists: true, $ne: '' }
    });

    console.log(`Found ${labReports.length} lab reports with images`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const labReport of labReports) {
      if (!isBase64(labReport.patientImage)) {
        console.log(`⏭️  Skipping Lab #${labReport.labNumber} - already has URL`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating image for Lab #${labReport.labNumber}`);

      const cloudinaryUrl = await uploadBase64ToCloudinary(
        labReport.patientImage,
        'gulf-medical/lab-reports',
        `lab-${labReport._id}`
      );

      if (cloudinaryUrl) {
        labReport.patientImage = cloudinaryUrl;
        await labReport.save();
        console.log(`✅ Successfully migrated Lab #${labReport.labNumber}`);
        migrated++;
      } else {
        console.error(`❌ Failed to migrate Lab #${labReport.labNumber}`);
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Lab Report Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);

  } catch (error) {
    console.error('Error migrating lab report images:', error);
  }
};

// Migrate Radiology Images
const migrateRadiologyImages = async () => {
  console.log('\n🩻 Starting Radiology Image Migration...');
  
  try {
    const radiologyReports = await Radiology.find({
      patientImage: { $exists: true, $ne: '' }
    });

    console.log(`Found ${radiologyReports.length} radiology reports with images`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const radReport of radiologyReports) {
      if (!isBase64(radReport.patientImage)) {
        console.log(`⏭️  Skipping Radiology report - already has URL`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating radiology image for Patient: ${radReport.patientName}`);

      const cloudinaryUrl = await uploadBase64ToCloudinary(
        radReport.patientImage,
        'gulf-medical/radiology',
        `radiology-${radReport._id}`
      );

      if (cloudinaryUrl) {
        radReport.patientImage = cloudinaryUrl;
        await radReport.save();
        console.log(`✅ Successfully migrated radiology report`);
        migrated++;
      } else {
        console.error(`❌ Failed to migrate radiology report`);
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Radiology Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);

  } catch (error) {
    console.error('Error migrating radiology images:', error);
  }
};

// Migrate Clinical Images
const migrateClinicalImages = async () => {
  console.log('\n🏥 Starting Clinical Image Migration...');
  
  try {
    const clinicalReports = await Clinical.find({
      'selectedReport.patientPhoto': { $exists: true, $ne: '' }
    });

    console.log(`Found ${clinicalReports.length} clinical reports with images`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const clinReport of clinicalReports) {
      if (!clinReport.selectedReport.patientPhoto) continue;

      if (!isBase64(clinReport.selectedReport.patientPhoto)) {
        console.log(`⏭️  Skipping Clinical report - already has URL`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating clinical image for Patient: ${clinReport.selectedReport.patientName}`);

      const cloudinaryUrl = await uploadBase64ToCloudinary(
        clinReport.selectedReport.patientPhoto,
        'gulf-medical/clinical',
        `clinical-${clinReport._id}`
      );

      if (cloudinaryUrl) {
        clinReport.selectedReport.patientPhoto = cloudinaryUrl;
        await clinReport.save();
        console.log(`✅ Successfully migrated clinical report`);
        migrated++;
      } else {
        console.error(`❌ Failed to migrate clinical report`);
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Clinical Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);

  } catch (error) {
    console.error('Error migrating clinical images:', error);
  }
};

// Main migration function
const runMigration = async () => {
  console.log('=================================================');
  console.log('   Cloudinary Migration Script');
  console.log('   Converting Base64 images to Cloudinary URLs');
  console.log('=================================================');

  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO);
    console.log('✅ Connected to MongoDB');

    // Check Cloudinary configuration
    console.log('\n☁️  Checking Cloudinary configuration...');
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');

    // Run migrations
    await migratePatientPhotos();
    await migrateLabReportImages();
    await migrateRadiologyImages();
    await migrateClinicalImages();

    console.log('\n=================================================');
    console.log('   ✅ Migration Completed Successfully!');
    console.log('=================================================');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the migration
runMigration();
