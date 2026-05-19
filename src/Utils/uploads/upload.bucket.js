import { bucket } from "../../core/config/bucket/gcs.js";

export const uploadToGCSRepair = (file) => {
  return new Promise((resolve, reject) => {
    try {
      if (!file) {
        return reject(new Error("No file uploaded"));
      }

      const fileName = `repair/${Date.now()}-${file.originalname}`;

      const bucketFile = bucket.file(fileName);

      const blobStream = bucketFile.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      blobStream.on("error", (err) => {
        reject(err);
      });

      blobStream.on("finish", async () => {
        const publicUrl = encodeURI(
          `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`
        );

        console.log("PublicUrl --> ", publicUrl);

        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    } catch (error) {
      console.log("Error while uploading repair file:", error);
      reject(error);
    }
  });
};