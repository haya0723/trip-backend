const multer = require('multer');
const uploadService = require('./upload.service');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit (adjust as needed)
}); 

/**
 * Handles file upload request.
 * Expects a single file under the field name 'mediaFile'.
 */
async function handleFileUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please use the "mediaFile" field.' });
    }

    const publicUrl = await uploadService.uploadFileToGCS(req.file);
    res.status(200).json({ message: 'File uploaded successfully.', fileUrl: publicUrl });

  } catch (error) {
    console.error('[upload.controller] Error handling file upload:', error);
    if (error.message === "GCS bucket name is not configured.") {
        return res.status(500).json({ error: 'File upload service is not configured correctly on the server.' });
    }
    if (error.message === "No file provided for upload.") { // Should be caught by req.file check, but as a safeguard
        return res.status(400).json({ error: error.message });
    }
    // For other errors, like GCS upload issues
    res.status(500).json({ error: 'Failed to upload file.' });
  }
}

module.exports = {
  handleFileUpload,
  uploadMiddleware: upload.single('mediaFile'), // Middleware to be used in routes
};
