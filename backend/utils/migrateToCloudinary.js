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

const getStringSizeBytes = (value) => {
  if (!value || typeof value !== 'string') return 0;
  return Buffer.byteLength(value, 'utf8');
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
      $or: [
        { 'selectedReport.patientImage': { $exists: true, $ne: '' } },
        { 'selectedReport.patientPhoto': { $exists: true, $ne: '' } }
      ]
    });

    console.log(`Found ${clinicalReports.length} clinical reports with images`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const clinReport of clinicalReports) {
      const imageSource = clinReport.selectedReport?.patientImage || clinReport.selectedReport?.patientPhoto;
      if (!imageSource) continue;

      if (!isBase64(imageSource)) {
        console.log(`⏭️  Skipping Clinical report - already has URL`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating clinical image for Patient: ${clinReport.selectedReport.patientName}`);

      const cloudinaryUrl = await uploadBase64ToCloudinary(
        imageSource,
        'gulf-medical/clinical',
        `clinical-${clinReport._id}`
      );

      if (cloudinaryUrl) {
        clinReport.selectedReport.patientImage = cloudinaryUrl;
        if (clinReport.selectedReport.patientPhoto) {
          delete clinReport.selectedReport.patientPhoto;
        }
        clinReport.markModified('selectedReport');
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

const collectMigrationStats = async (label) => {
  const patients = await Patient.find({ photo: { $exists: true, $ne: '' } }).select('photo').lean();
  const labs = await Lab.find({ patientImage: { $exists: true, $ne: '' } }).select('patientImage').lean();
  const radiology = await Radiology.find({ patientImage: { $exists: true, $ne: '' } }).select('patientImage').lean();
  const clinical = await Clinical.find({
    $or: [
      { 'selectedReport.patientImage': { $exists: true, $ne: '' } },
      { 'selectedReport.patientPhoto': { $exists: true, $ne: '' } }
    ]
  }).select('selectedReport.patientImage selectedReport.patientPhoto').lean();

  const counters = {
    patients: { base64: 0, urls: 0, bytes: 0 },
    lab: { base64: 0, urls: 0, bytes: 0 },
    radiology: { base64: 0, urls: 0, bytes: 0 },
    clinical: { base64: 0, urls: 0, bytes: 0 }
  };

  patients.forEach((doc) => {
    if (isBase64(doc.photo)) {
      counters.patients.base64++;
      counters.patients.bytes += getStringSizeBytes(doc.photo);
    } else {
      counters.patients.urls++;
    }
  });

  labs.forEach((doc) => {
    if (isBase64(doc.patientImage)) {
      counters.lab.base64++;
      counters.lab.bytes += getStringSizeBytes(doc.patientImage);
    } else {
      counters.lab.urls++;
    }
  });

  radiology.forEach((doc) => {
    if (isBase64(doc.patientImage)) {
      counters.radiology.base64++;
      counters.radiology.bytes += getStringSizeBytes(doc.patientImage);
    } else {
      counters.radiology.urls++;
    }
  });

  clinical.forEach((doc) => {
    const image = doc.selectedReport?.patientImage || doc.selectedReport?.patientPhoto;
    if (!image) return;
    if (isBase64(image)) {
      counters.clinical.base64++;
      counters.clinical.bytes += getStringSizeBytes(image);
    } else {
      counters.clinical.urls++;
    }
  });

  const totalBytes = counters.patients.bytes + counters.lab.bytes + counters.radiology.bytes + counters.clinical.bytes;

  console.log(`\n📦 ${label} migration stats:`);
  console.log(`   Patients   - base64: ${counters.patients.base64}, urls: ${counters.patients.urls}, est. base64 size: ${formatBytes(counters.patients.bytes)}`);
  console.log(`   Lab        - base64: ${counters.lab.base64}, urls: ${counters.lab.urls}, est. base64 size: ${formatBytes(counters.lab.bytes)}`);
  console.log(`   Radiology  - base64: ${counters.radiology.base64}, urls: ${counters.radiology.urls}, est. base64 size: ${formatBytes(counters.radiology.bytes)}`);
  console.log(`   Clinical   - base64: ${counters.clinical.base64}, urls: ${counters.clinical.urls}, est. base64 size: ${formatBytes(counters.clinical.bytes)}`);
  console.log(`   Total estimated base64 still in MongoDB: ${formatBytes(totalBytes)}`);

  return { counters, totalBytes };
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

    await collectMigrationStats('Before');

    // Run migrations
    await migratePatientPhotos();
    await migrateLabReportImages();
    await migrateRadiologyImages();
    await migrateClinicalImages();

    await collectMigrationStats('After');

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
