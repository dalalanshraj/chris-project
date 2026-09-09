import express from "express";
import { isAuth } from "../middleware/authMiddleware.js";

import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  getPublicProfile,
} from "../controllers/profileController.js";
import upload from "../middleware/uploadProfile.js";

const router = express.Router();

router.get("/", isAuth, getProfile);

router.put("/", isAuth, updateProfile);
router.post(
  "/photo",
  isAuth,
  upload.single("photo"),
  uploadProfilePhoto
);
router.put(
  "/change-password",
  isAuth,
  changePassword
);
router.get("/public/:id", getPublicProfile);

export default router;