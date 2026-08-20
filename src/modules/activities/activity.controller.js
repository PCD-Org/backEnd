const activityService = require('./activity.service');
const cloudinaryService = require('../../shared/services/cloudinary.service');
const { successResponse } = require('../../shared/utils/response');

class ActivityController {
  async createActivity(req, res, next) {
    let uploadedImage = null;
    try {
      if (req.file) {
        uploadedImage = await cloudinaryService.uploadImage(req.file.buffer, 'pced/activities');
        req.body.coverImage = uploadedImage;
      } else {
        // Prevent client injection
        req.body.coverImage = null;
      }

      const activity = await activityService.createActivity(req.body);
      return successResponse(res, { activity }, null, 201);
    } catch (error) {
      if (uploadedImage) {
        await cloudinaryService.deleteImage(uploadedImage.publicId);
      }
      next(error);
    }
  }

  async getActivities(req, res, next) {
    try {
      const { activities, pagination } = await activityService.getActivities(req.query);
      return successResponse(res, { activities }, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req, res, next) {
    try {
      const activity = await activityService.getActivityById(req.params.id);
      return successResponse(res, { activity });
    } catch (error) {
      next(error);
    }
  }

  async updateActivity(req, res, next) {
    let newUploadedImage = null;
    try {
      const existingActivity = await activityService.getActivityById(req.params.id);

      if (req.file) {
        newUploadedImage = await cloudinaryService.uploadImage(req.file.buffer, 'pced/activities');
        req.body.coverImage = newUploadedImage;
      } else {
        // Prevent client injection of object, only allow explicit null for deletion
        if (req.body.coverImage !== null) {
          delete req.body.coverImage;
        }
      }

      const updatedActivity = await activityService.updateActivity(req.params.id, req.body);

      // If a new image was successfully uploaded, or coverImage was explicitly set to null, clean up the old image
      const shouldDeleteOldImage = (req.file || req.body.coverImage === null) && existingActivity.coverImage && existingActivity.coverImage.publicId;

      if (shouldDeleteOldImage) {
        await cloudinaryService.deleteImage(existingActivity.coverImage.publicId);
      }

      return successResponse(res, { activity: updatedActivity });
    } catch (error) {
      if (newUploadedImage) {
        await cloudinaryService.deleteImage(newUploadedImage.publicId);
      }
      next(error);
    }
  }

  async deleteActivity(req, res, next) {
    try {
      const existingActivity = await activityService.getActivityById(req.params.id);
      
      await activityService.deleteActivity(req.params.id);

      if (existingActivity.coverImage && existingActivity.coverImage.publicId) {
        await cloudinaryService.deleteImage(existingActivity.coverImage.publicId);
      }

      return successResponse(res, null, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();
