import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// import axios from "axios";
// import Property from "./models/Property.js";


dotenv.config();

// Mongo connection string (merged)
const MONGO = process.env.MONGO_URI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom Routes
import searchRoutes from "./routes/searchRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import calendarRoutes from "./routes/listingCalendarRoutes.js";
import dealRoutes from    "./routes/dealRoutes.js"
import galleryRoutes from "./routes/galleryRoutes.js";
import icalcalendarRoutes from "./routes/icalRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();
const PORT = process.env.PORT || 4005;
const allowedOrigins = [
   "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:5175",
  "https://floridapanhandlebeachescape.com",
  "https://floridapanhandlebeachescape.com",
 
];

app.use(
  cors({
    origin: function (origin, callback) {

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

// Root Test
app.get("/", (req, res) => {
  res.send(" API Working");
});



app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", searchRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/listings", calendarRoutes);
app.use("/api/deals" , dealRoutes);
app.use("/api/inquiries" , inquiryRoutes);
app.use("/api/gallery", galleryRoutes);
app.use(
  "/gallery-uploads",
  express.static("gallery-uploads")
);

app.use(
  "/uploads",
  express.static("uploads")
);


app.use("/api", icalcalendarRoutes);
app.use("/api/profile", profileRoutes);






// -------------------------------------------------------
// CONNECT MONGO
// -------------------------------------------------------
mongoose
  .connect(MONGO, {
    serverSelectionTimeoutMS: 4001,
    tls: true,
    ssl: true,
    tlsAllowInvalidCertificates: true, // ⚠️ dev only
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Database Error:", err.message));

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

// console.log("Listing routes loaded");
  
// console.log("Loaded MONGO_URI =", process.env.MONGO_URI);
// console.log("bookingRoute
// s loaded");
