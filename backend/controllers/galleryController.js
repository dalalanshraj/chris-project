import Gallery from "../models/Gallery.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// UPLOAD
export const uploadImage = async (
  req,
  res
) => {
  try {
    const uploadedImages = [];

    const total =
      await Gallery.countDocuments();

    for (const [index, file] of req.files.entries()) {
      const filename =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        ".webp";

      const outputPath = path.join(
        process.cwd(),
        "gallery-uploads",
        filename
      );

    await sharp(file.path)
  .resize({
    width: 1600,
    withoutEnlargement: true,
  })
  .webp({
    quality: 75,
  })
  .toFile(outputPath);

// ✅ delete temp file
fs.unlinkSync(file.path);

     const created = await Gallery.create({
  image: `/gallery-uploads/${filename}`,
  sectionType: req.body.sectionType || "",
  order: total + index,
});

      uploadedImages.push(created);
    }

    res.json(uploadedImages);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Upload failed",
    });
  }
};

// GET ALL
export const getAllImages = async (
  req,
  res
) => {
  const data = await Gallery.find().sort({
    order: 1,
  });

  res.json(data);
};

// GET PUBLISHED (frontend use)
export const getPublishedImages =
  async (req, res) => {
    const data = await Gallery.find({
      status: "published",
    }).sort({
      order: 1,
    });

    res.json(data);
  };

// TOGGLE
export const toggleStatus = async (req, res) => {
  const item = await Gallery.findById(req.params.id);

  item.status =
    item.status === "published" ? "draft" : "published";

  await item.save();

  res.json(item);
};

// DELETE
export const deleteImage = async (
  req,
  res
) => {
  try {
    const item = await Gallery.findById(
      req.params.id
    );

    if (!item) {
      return res
        .status(404)
        .json({
          error: "Not found",
        });
    }

    const filename =
      item.image.split("/").pop();

    const filePath = path.join(
      process.cwd(),
      "gallery-uploads",
      filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Gallery.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Delete failed",
    });
  }
};

export const reorderGallery = async (
  req,
  res
) => {
  try {
    const updates = req.body.images;

    for (const item of updates) {
      await Gallery.findByIdAndUpdate(
        item._id,
        {
          order: item.order,
        }
      );
    }

    const updated =
      await Gallery.find().sort({
        order: 1,
      });

    res.json(updated);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Reorder failed",
    });
  }
};