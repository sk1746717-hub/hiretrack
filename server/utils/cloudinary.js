import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configure Cloudinary only if variables are defined
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn("WARNING: Cloudinary environment variables are not fully configured. File uploads will fallback to local storage or mock URLs.");
}

/**
 * Upload a file buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<string>} - The secure URL of the uploaded asset
 */
export const uploadBufferToCloudinary = (buffer, fileName, folder = "hiretrack") => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("Cloudinary not configured. Writing file to local uploads folder...");
      try {
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Use clean original file name prefix
        const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
        const safeFileName = `${Date.now()}-${cleanName}`;
        const filePath = path.join(uploadsDir, safeFileName);
        
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved file locally to: ${filePath}`);
        
        const mockUrl = `/uploads/${safeFileName}`;
        return resolve(mockUrl);
      } catch (err) {
        console.error("Local file save error:", err);
        return reject(new Error("Failed to save upload file locally: " + err.message));
      }
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${cleanName}_${Date.now()}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload stream error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};
