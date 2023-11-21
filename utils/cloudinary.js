const cloudinary = require("cloudinary").v2;

const cloudinaryUpload = async (fileName, filePath) => {
  const { CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  try {
    // Configuration
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });

    // Upload
    const response = await cloudinary.uploader.upload(filePath, {
      folder: "Better Return/users",
      public_id: fileName,
    });

    // Generate
    const url = response?.url;

    // The output url
    return { url };
  } catch (err) {
    console.log(err);
  }
};

module.exports = cloudinaryUpload;