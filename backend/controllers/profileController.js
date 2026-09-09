import User from "../models/User.js";
import { isAuth } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check duplicate email
    if (
      req.body.email &&
      req.body.email !== user.email
    ) {
      const exists = await User.findOne({
        email: req.body.email,
        _id: { $ne: user._id },
      });

      if (exists) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      user.email = req.body.email;
    }

    user.name = req.body.name ?? user.name;
    user.about = req.body.about ?? user.about;
    user.photo = req.body.photo ?? user.photo;

    await user.save();

    res.json(user);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
export const uploadProfilePhoto = async (req, res) => {
  try {
    console.log("FILE =>", req.file);
    console.log("BODY =>", req.body);

    const user = await User.findById(req.user.id);

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    user.photo = `/uploads/profile/${req.file.filename}`;

    await user.save();

    res.json(user);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    console.log("===== CHANGE PASSWORD START =====");

    const {
      currentPassword,
      confirmCurrentPassword,
      newPassword,
    } = req.body;

    console.log("Current Password:", currentPassword);

    const user = await User.findById(req.user.id);

    console.log("User Found:", user.email);

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    console.log("Password Saved");

   await sendEmail(
  "Contact@digifyamerica.com",
  "Admin Password Changed",
  `
    <h2>Password Changed</h2>

    <p>${user.name} changed their password.</p>

    <p>Email: ${user.email}</p>

    <p>Role: ${user.role}</p>

    <p>Time: ${new Date().toLocaleString()}</p>
  `
);

    console.log("Email Sent");

    return res.json({
      message: "Password updated successfully",
    });

  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name about photo email"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};