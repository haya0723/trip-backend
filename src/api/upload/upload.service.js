const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = new Storage(); // Assumes GOOGLE_APPLICATION_CREDENTIALS is set
const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
  console.error("GCS_BUCKET_NAME environment variable is not set.");
  throw new Error("GCS_BUCKET_NAME environment variable is not set."); 
}

/**
 * Uploads a file to Google Cloud Storage and returns its public URL.
 * @param {Express.Multer.File} fileObject - The file object from multer.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadFileToGCS(fileObject) {
  // bucketNameのチェックはモジュールロード時に行われるため、ここでは不要
  // if (!bucketName) { 
  //   throw new Error("GCS bucket name is not configured.");
  // }
  if (!fileObject) {
    throw new Error("No file provided for upload.");
  }

  const bucket = storage.bucket(bucketName);
  const uniqueFilename = `${uuidv4()}${path.extname(fileObject.originalname)}`;
  const blob = bucket.file(`media/${uniqueFilename}`); 

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: fileObject.mimetype,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      console.error('[upload.service] Error uploading to GCS:', err);
      reject(err);
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      console.log(`[upload.service] File ${blob.name} uploaded to ${bucketName}. Public URL: ${publicUrl}`);
      resolve(publicUrl);
    });

    blobStream.end(fileObject.buffer);
  });
}

module.exports = {
  uploadFileToGCS,
};
