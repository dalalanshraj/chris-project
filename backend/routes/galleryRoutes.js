import express from "express";
import multer from "multer";

import {
  uploadImage,
  getAllImages,
  getPublishedImages,
  toggleStatus,
  deleteImage,
  reorderGallery,
} from "../controllers/galleryController.js";

const router = express.Router();

// ===========================
// MULTER STORAGE
// ===========================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ===========================
// UPLOAD
// ===========================

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,

    files: 60,
  },
});

// ===========================
// ROUTES
// ===========================

router.post("/", upload.array("images", 60), uploadImage);

router.get("/", getAllImages);

router.get("/published", getPublishedImages);

router.put("/:id/toggle", toggleStatus);

router.delete("/:id", deleteImage);

router.put("/reorder", reorderGallery);

export default router;
