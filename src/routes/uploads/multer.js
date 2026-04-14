import multer from "multer";

export const digiupload = multer({
    storage: multer.memoryStorage(),
});

