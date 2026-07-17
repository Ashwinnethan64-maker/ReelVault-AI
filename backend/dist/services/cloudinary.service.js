"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.uploadMedia = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
});
const uploadMedia = async (filePath) => {
    // Implementation layer for upload
    return await cloudinary_1.v2.uploader.upload(filePath);
};
exports.uploadMedia = uploadMedia;
const deleteMedia = async (publicId) => {
    // Implementation layer for delete
    return await cloudinary_1.v2.uploader.destroy(publicId);
};
exports.deleteMedia = deleteMedia;
