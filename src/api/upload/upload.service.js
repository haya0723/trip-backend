const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = new Storage(); // Assumes GOOGLE_APPLICATION_CREDENTIALS is set
const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
  console.error("GCS_BUCKET_NAME environment variable is not set.");
  // throw new Error("GCS_BUCKET_NAME environment variable is not set."); 
  // アプリケーション起動時にエラーにするか、ログのみにするかは要件による
}

/**
 * Uploads a file to Google Cloud Storage and returns its public URL.
 * @param {Express.Multer.File} fileObject - The file object from multer.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadFileToGCS(fileObject) {
  if (!bucketName) {
    throw new Error("GCS bucket name is not configured.");
  }
  if (!fileObject) {
    throw new Error("No file provided for upload.");
  }

  const bucket = storage.bucket(bucketName);
  // Generate a unique filename using UUID and original extension
  const uniqueFilename = `${uuidv4()}${path.extname(fileObject.originalname)}`;
  const blob = bucket.file(`media/${uniqueFilename}`); // Store in a 'media' folder

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
      // The file upload is complete.
      // Make the file public (optional, depends on your GCS bucket/object ACL settings)
      // For simplicity, we assume objects are publicly readable or use signed URLs in a real app.
      // Here, we construct the public URL directly.
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
