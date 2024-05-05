import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadFileOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File uploaded successfully");

        fs.unlinkSync(localFilePath); // deletes file from local after successfull upload
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFileFromCloudinary = async (url, isVideo) => {
    try {
        if (!url) {
            return;
        }
        const publicId = Url.split("/").pop().split(".")[0]; // public ID

        // Set the resource type based on the asset type
        const resourceType = isVideo ? "video" : "image";

        // Use Cloudinary's destroy method to delete the asset
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        console.log(`File ${url} deleted from Cloudinary`);
    } catch (error) {
        console.error(`Error deleting file from Cloudinary: ${error.message}`);
        throw error;
    }
};

export { uploadFileOnCloudinary, deleteFileFromCloudinary };
