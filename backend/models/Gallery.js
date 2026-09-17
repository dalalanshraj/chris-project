import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    image: {
  type: String,
  required: true,
},

order: {
  type: Number,
  default: 0,
},

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);