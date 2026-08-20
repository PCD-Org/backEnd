const cloudinary = require('../../config/cloudinary');
const AppError = require('../errors/AppError');

class CloudinaryService {
  /**
   * Upload an image to Cloudinary using a buffer.
   * @param {Buffer} fileBuffer - The image buffer to upload.
   * @param {string} folder - The destination folder in Cloudinary.
   * @returns {Promise<{ url: string, publicId: string }>} - Resolves with image url and public ID.
   */
  uploadImage(fileBuffer, folder) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            return reject(new AppError('Failed to upload image to Cloudinary', 500));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Delete an image from Cloudinary by its public ID.
   * @param {string} publicId - The public ID of the image to delete.
   * @returns {Promise<void>}
   */
  async deleteImage(publicId) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Failed to delete Cloudinary image: ${publicId}`, error);
      // We don't necessarily throw an error here, since this is usually called during cleanup
      // and we don't want to break the main application flow if a deletion fails.
    }
  }
}

module.exports = new CloudinaryService();
