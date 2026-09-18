import dotenv from "dotenv";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
// import Property from "../models/Property.js";
import Listing from "../models/Listing.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";

dotenv.config();

export const adminLogin = async (req, res) => {
   console.log(req.body);
  const { email, password } = req.body;
  

  const admin = await User.findOne({ email });
  if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
    return res.status(403).json({
      message: "Not an admin",
    });
  }
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: admin._id,
      role: admin.role,
      email: admin.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.json({
    token,
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
};
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};
export const dashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListing = await Listing.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({
      status: "pending",
    });

    let totalReviews = 0;
    let pendingReviews = 0;

    const listings = await Listing.find({}, { reviews: 1 });

    listings.forEach((listing) => {
      if (listing.reviews && listing.reviews.length > 0) {
        totalReviews += listing.reviews.length;

        listing.reviews.forEach((review) => {
          if (review.published === false) {
            pendingReviews++;
          }
        });
      }
    });

    res.json({
      totalUsers,
      totalListing,
      totalBookings,
      pendingBookings,
      totalReviews,
      pendingReviews,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ message: "Dashboard stats error" });
  }
};

export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const admin = new User({
    name,
    email,
    password: hashed,
    role: "admin",
  });

  await admin.save();

  res.json({ message: "Admin created successfully" });
};

export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashed,
    role: role || "user",
  });

  await user.save();

  res.json({ message: "User created" });
};

export const updateUser = async (req, res) => {
  try {

    // Only Superadmin
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only Super Admin Allowed",
      });
    }

    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Duplicate Email Check
    if (
      req.body.email &&
      req.body.email !== user.email
    ) {

      const exists = await User.findOne({
        email: req.body.email,
        _id: { $ne: id },
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
    user.role = req.body.role ?? user.role;

    await user.save();

    res.json(user);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToDelete = await User.findById(id);

    // ❌ user not found
    if (!userToDelete) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ❌ cannot delete superadmin
    if (userToDelete.role === "superadmin") {
      return res.status(400).json({
        message: "Cannot delete superadmin",
      });
    }

    // ❌ cannot delete own account
    if (req.user.email === userToDelete.email) {
      return res.status(400).json({
        message: "Cannot delete yourself",
      });
    }

    // ✅ delete
    await User.findByIdAndDelete(id);

    res.json({
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Delete error",
    });
  }
};
``;

export const changeUserPassword = async (req, res) => {

  try {

    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only Super Admin Allowed",
      });
    }

    const { id } = req.params;

    const {
      newPassword,
      confirmPassword,
    } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    user.lastPasswordChanged = new Date();

    await user.save();

    res.json({
      message: "Password Changed Successfully",
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};
export const resetUserPassword = async (req, res) => {
  try {
    // 🔥 ONLY SUPER ADMIN
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }

    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // TEMP PASSWORD
   const tempPassword =
  "Admin@" +
  Math.random().toString(36).slice(-6).toUpperCase();

    const hashed = await bcrypt.hash(tempPassword, 10);

    user.password = hashed;

    user.lastPasswordChanged = new Date();

    await user.save();

await sendEmail(
  user.email,
  "Password Reset",
  `
    <h2>Password Reset</h2>

    <p>Hello <strong>${user.name}</strong>,</p>

    <p>Your password has been reset by the administrator.</p>

    <p><strong>Temporary Password:</strong> ${tempPassword}</p>

    <p>Please login and change your password immediately.</p>
  `,
);

res.json({
  success: true,
  message: "Password reset successfully.",
});
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const uploadUserPhoto = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only Super Admin Allowed",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

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
    res.status(500).json({
      message: err.message,
    });
  }
};