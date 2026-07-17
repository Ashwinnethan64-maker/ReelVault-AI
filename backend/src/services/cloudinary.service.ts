import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadMedia = async (filePath: string) => {
  // Implementation layer for upload
  return await cloudinary.uploader.upload(filePath);
};

export const deleteMedia = async (publicId: string) => {
  // Implementation layer for delete
  return await cloudinary.uploader.destroy(publicId);
};
