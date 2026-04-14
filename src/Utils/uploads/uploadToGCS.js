import { bucket } from "../../core/config/bucket/gcs.js";


// store images in products folder
export const uploadToGCSProduct = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject("No file");

    // folder name -> jobcards
    const fileName = `products/${Date.now()}-${file.originalname}`;

    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => reject(err));

    blobStream.on("finish", async () => {
      // await blob.makePublic(); // make accessible

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      console.log("PubliUrl  --> ", publicUrl);
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};