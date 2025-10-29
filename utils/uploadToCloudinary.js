const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config(); // ✅ ensures .env values are loaded

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "coach_certificates", // ✅ optional folder name
    });

    fs.unlinkSync(filePath); // delete file after upload
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error("Cloudinary upload failed");
  }
};

module.exports = uploadToCloudinary;
