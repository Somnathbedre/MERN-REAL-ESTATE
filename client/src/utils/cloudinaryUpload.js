// src/utils/cloudinaryUpload.js

export async function uploadImageToCloudinary(imageFile) {
  if (!imageFile) {
    console.error("No file provided for upload");
    return null;
  }

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error("Cloudinary cloud name is missing in .env");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return data.secure_url;
    } else {
      console.error("Cloudinary upload failed:", data);
      return null;
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
}
