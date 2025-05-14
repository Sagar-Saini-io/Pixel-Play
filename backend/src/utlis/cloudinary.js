import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      timeout: 60000, // Increase timeout to 60 seconds (adjust as needed)
      // timeout: 120000,
    });
    // file has been uploaded successfully
    console.log("file is uploaded on cloudinary", response.url);
    // console.log("cloudinary response", response);
    fs.unlinkSync(localFilePath);
    return response;
    //
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload  operation  got failed
    console.log(error);
    return null;
  }
};

// const deleteOnCloudinary = async (publicId) => {
//   try {
//     if (!publicId) return null;
//     //
//     const response = await cloudinary.uploader.destroy(`Home/${publicId}`);
//     console.log("File is deleted on Cloudinary ", response);

//     //
//   } catch (error) {
//     console.Console.log(error);
//   }
// };

async function deleteCloudinaryFile(url) {
  if (!url) {
    console.error("Error: URL cannot be empty.");
    return { success: false, error: "URL cannot be empty." };
  }

  try {
    const parts = url.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
    const publicId =
      lastDotIndex === -1
        ? publicIdWithExtension
        : publicIdWithExtension.substring(0, lastDotIndex);

    // const fullPublicIdToDelete = publicId;

    const result = await cloudinary.uploader.destroy(`${publicId}`);
    console.log(result);
    if (result.result === "ok") {
      console.log(`File with public ID "${publicId}" deleted successfully.`);
    } else if (result.result === "not found") {
      console.log(`File with public ID "${publicId}" not found.`);
    } else {
      console.error("Error deleting file:", result);
      return {
        success: false,
        error: `Cloudinary error: ${JSON.stringify(result)}`,
        result,
      };
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: error.message };
  }
}

async function deleteVideoOnCloudinary(url) {
  if (!url) {
    console.error("Error: URL cannot be empty.");
    return { success: false, error: "URL cannot be empty." };
  }

  try {
    const parts = url.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
    const publicId =
      lastDotIndex === -1
        ? publicIdWithExtension
        : publicIdWithExtension.substring(0, lastDotIndex);

    // const fullPublicIdToDelete = publicId;

    const result = await cloudinary.uploader.destroy(`${publicId}`, {
      resource_type: "video",
    });
    console.log(result);
    if (result.result === "ok") {
      console.log(`File with public ID "${publicId}" deleted successfully.`);
    } else if (result.result === "not found") {
      console.log(`File with public ID "${publicId}" not found.`);
    } else {
      console.error("Error deleting file:", result);
      return {
        success: false,
        error: `Cloudinary error: ${JSON.stringify(result)}`,
        result,
      };
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: error.message };
  }
}

export { uploadOnCloudinary, deleteCloudinaryFile, deleteVideoOnCloudinary };
