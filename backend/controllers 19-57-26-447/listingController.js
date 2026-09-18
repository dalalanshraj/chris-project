import dotenv from "dotenv";
import Listing from "../models/Listing.js";
import Deal from "../models/Deal.js";
import Inquiry from "../models/Inquiry.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
dotenv.config();

export const publishListing = async (req, res) => {
  try {
    const listing = await Listing.findById(id);

    listing.property = req.body;

    if (
      listing.property?.title &&
      listing.description &&
      listing.photos.length > 0 &&
      listing.location?.lat
    ) {
      listing.status = "published";
    }

    await listing.save();

    res.json(listing);

    res.json({
      message: "Listing published successfully",
      listing,
    });
  } catch (err) {
    res.status(500).json({ error: "Publish failed" });
  }
};

//  ADMIN – Create Listing

export const createListing = async (req, res) => {
  const listing = new Listing({
    property: req.body,
    status: "draft",
  });

  await listing.save();

  res.json(listing);
};

// UPDATE PROPERTY TAB
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // console.log("LISTING ID:", id);
    // console.log("PROPERTY DATA:", req.body);

    const listing = await Listing.findByIdAndUpdate(
      id,
      {
        $set: {
          property: req.body,
        },
      },
      { new: true },
    );

    res.json(listing);
  } catch (err) {
    // console.error("PROPERTY UPDATE ERROR FULL:", err);
    res.status(500).json({ error: "Property update failed" });
  }
};

// USER – Get all listings

export const getAllListings = async (req, res) => {
  try {

    const listings = await Listing.find()

      .select(`
        property
        status
        photos
        reviews
        createdAt
      `)

      .lean();

    // IDS
    const listingIds =
      listings.map((l) => l._id);

    // SINGLE QUERY
    const inquiryCounts =
      await Inquiry.aggregate([
        {
          $match: {
            property: {
              $in: listingIds,
            },
          },
        },
        {
          $group: {
            _id: "$property",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    // MAP
    const inquiryMap = {};

    inquiryCounts.forEach((item) => {
      inquiryMap[item._id.toString()] =
        item.count;
    });

    // FINAL
    const updatedListings =
      listings.map((listing) => ({
        ...listing,

        inquiryCount:
          inquiryMap[
            listing._id.toString()
          ] || 0,

        reviewCount:
          listing.reviews?.length || 0,
      }));

    res.json(updatedListings);

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};

//  USER – Get listing by ID

export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
};

// ADMIN – Delete listing

export const deleteListing = async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

export const updateDescription = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  listing.description = req.body.description;

  if (
    listing.property?.title &&
    listing.description &&
    listing.photos.length > 0 &&
    listing.location?.lat
  ) {
    listing.status = "published";
  }

  await listing.save();

  res.json({ success: true });
};
export const updateAmenities = async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.id, {
    amenities: req.body,
  });

  res.json({ success: true });
};

export const updateRates = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  listing.rates.push(req.body.rate);
  await listing.save();
  res.json(listing);
};
export const deleteRate = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  listing.rates.splice(req.body.index, 1);
  await listing.save();
  res.json(listing);
};

export const updateLocation = async (req, res) => {

  try {

    let {
      lat,
      lng,
      address,
    } = req.body;

    const listing =
      await Listing.findById(
        req.params.id
      );

    if (!listing) {

      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // ====================================
    // CASE 1: LAT / LNG PROVIDED
    // ====================================

    if (
      lat !== undefined &&
      lng !== undefined
    ) {

      // convert to numbers
      lat = parseFloat(lat);
      lng = parseFloat(lng);

      // =========================
      // VALIDATION
      // =========================

      if (
        isNaN(lat) ||
        isNaN(lng)
      ) {

        return res.status(400).json({
          message:
            "Invalid latitude or longitude",
        });
      }

      // latitude range
      if (
        lat > 90 ||
        lat < -90
      ) {

        return res.status(400).json({
          message:
            "Latitude must be between -90 and 90",
        });
      }

      // longitude range
      if (
        lng > 180 ||
        lng < -180
      ) {

        return res.status(400).json({
          message:
            "Longitude must be between -180 and 180",
        });
      }

      // ====================================
      // AUTO FIX USA LONGITUDE
      // ====================================

      // USA longitude should be negative
      if (
        lng > 0 &&
        lat > 20
      ) {

        lng = -Math.abs(lng);
      }

      // ====================================
      // SAVE CLEAN LOCATION
      // ====================================

      listing.location = {
        lat: Number(lat),
        lng: Number(lng),
        address: address || "",
      };

      await listing.save();

      return res.json({
        success: true,
        location: listing.location,
      });
    }

    // ====================================
    // CASE 2: ADDRESS PROVIDED
    // ====================================

    if (address) {

      const geoRes =
        await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address,
              key:
                process.env.GOOGLE_MAPS_KEY,
            },
          }
        );

      const result =
        geoRes.data.results[0];

      if (!result) {

        return res.status(400).json({
          message:
            "Invalid address",
        });
      }

      const location =
        result.geometry.location;

      listing.location = {
        lat: Number(location.lat),
        lng: Number(location.lng),
        address:
          result.formatted_address,
      };

      await listing.save();

      return res.json({
        success: true,
        location: listing.location,
      });
    }

    return res.status(400).json({
      message:
        "Provide lat/lng or address",
    });

  } catch (error) {

    console.log(
      "LOCATION ERROR:",
      error.message
    );

    res.status(500).json({
      message:
        "Location update failed",
    });
  }
};

export const updateActivities = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { activities: req.body },
      { new: true },
    );

    if (!listing) return res.status(404).json({ error: "Listing not found" });

    res.json({ message: "Activities saved", listing });
  } catch (err) {
    res.status(500).json({ error: "Failed to update activities" });
  }
};
export const updatePhotos =
  async (req, res) => {
    try {

      const listing =
        await Listing.findById(
          req.params.id
        );

      if (!listing) {
        return res.status(404).json({
          message:
            "Listing not found",
        });
      }

      const uploadedPhotos = [];

      for (const file of req.files) {

        const filename =
          Date.now() +
          "-" +
          Math.round(
            Math.random() * 1e9
          ) +
          ".webp";

        const outputPath =
          `uploads/${filename}`;

        await sharp(file.path)
          .resize({
            width: 1600,
            withoutEnlargement: true,
          })
          .webp({
            quality: 75,
          })
          .toFile(outputPath);

        // ✅ DELETE TEMP FILE
        fs.unlinkSync(file.path);

        uploadedPhotos.push({
          url:
            `/uploads/${filename}`,

          order:
            listing.photos.length,
        });
      }

      listing.photos.push(
        ...uploadedPhotos
      );

      await listing.save();

      res.json({
        success: true,
        photos: listing.photos,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: err.message,
      });
    }
  };

export const deletePhoto = async (req, res) => {
  try {
    console.log(
      "DELETE PARAM:",
      req.params.filename
    );

    const listing = await Listing.findById(
      req.params.id
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const filename = req.params.filename;

    // remove physical file
    const filePath = path.join(
      process.cwd(),
      "gallery-uploads",
      filename
    );

    console.log("FILE PATH:", filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      console.log("FILE DELETED");
    }

    // remove from mongo
    listing.photos = listing.photos.filter(
      (photo) => {
        return (
          photo.url &&
          !photo.url.includes(filename)
        );
      }
    );

    await listing.save();

    res.json({
      success: true,
      photos: listing.photos,
    });
  } catch (err) {
    console.log("DELETE ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

export const reorderPhotos = async (
  req,
  res
) => {
  try {
    const listing = await Listing.findById(
      req.params.id
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    listing.photos = req.body.photos;

    await listing.save();

    res.json({
      success: true,
      photos: listing.photos,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { video: req.body },
      { new: true },
    );

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json({
      message: "Video updated successfully",
      listing,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: "Failed to update video" });
  }
};

//! Add Review
export const addReview = async (req, res) => {
  const { id } = req.params;

  const review = {
    ...req.body,
    published: false,
  };

  const listing = await Listing.findByIdAndUpdate(
    id,
    { $push: { reviews: review } },
    { new: true },
  );

  res.json({
    message: "Review submitted",
    review,
  });
};

//! Publish Review
export const publishReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  const review = listing.reviews.id(req.params.reviewId);

  review.published = true;

  await listing.save();

  res.json({ success: true });
};

//! Admin Reply Review
export const replyReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  const review = listing.reviews.id(req.params.reviewId);

  review.reply = req.body.reply;

  await listing.save();

  res.json({ success: true });
};

//! if Admin not show Reviews
export const deleteReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  listing.reviews = listing.reviews.filter(
    (r) => r._id.toString() !== req.params.reviewId,
  );

  await listing.save();

  res.json({ success: true });
};

export const getAllReviews = async (req, res) => {

  const page = Number(req.query.page) || 1;

  const limit = 5;

  const propertyFilter = req.query.property;

  const listings = await Listing.find();

  let allReviews = [];

  listings.forEach((listing) => {

    listing.reviews.forEach((r) => {

      if (!r.published) return;

      if (
        propertyFilter &&
        propertyFilter !== "all" &&
        listing.property?.title !== propertyFilter
      ) {
        return;
      }

      allReviews.push({
        _id: r._id,

        review: r.message,

        rating: r.rating,

        user: r.name,

        stayDate: r.stayDate,

        listingId: listing._id,

        property: {
          title: listing.property?.title || "",

          image: listing.photos?.[0] || "",
        },
      });
    });
  });

  const start = (page - 1) * limit;

  const paginated = allReviews.slice(start, start + limit);

  res.json({
    reviews: paginated,

    total: allReviews.length,

    page,

    pages: Math.ceil(allReviews.length / limit),
  });
};

// ================= ADD EXTRA FEE =================
export const addExtraFee = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  listing.extraFees.push(req.body);
  await listing.save();

  res.json(listing.extraFees);
};

// ================= EDIT EXTRA FEE =================
export const editExtraFee = async (req, res) => {
  const { index, fee } = req.body;

  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  listing.extraFees[index] = fee;
  await listing.save();

  res.json(listing.extraFees);
};

// ================= DELETE EXTRA FEE =================
export const deleteExtraFee = async (req, res) => {
  const { index } = req.body;

  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  listing.extraFees.splice(index, 1);
  await listing.save();

  res.json(listing.extraFees);
};

export const editRate = async (req, res) => {
  const { id } = req.params;
  const { index, rate } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  listing.rates[index] = rate;

  await listing.save();

  res.json({ rates: listing.rates });
};

// LISTING PUBLISH AND UNPUBLISH
export const toggleListingStatus = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = listing.status === "published" ? "draft" : "published";

    await listing.save();

    res.json({
      message: "Status updated",
      status: listing.status,
      listingId: listing._id,
    });
  } catch (err) {
    // console.error("Toggle status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublishedListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: "published" });

    const today = new Date();

    const deals = await Deal.find({
      displayFrom: { $lte: today },
      displayEnd: { $gte: today },
    });

    const result = listings.map((l) => {
      const deal = deals.find(
        (d) => d.listingId.toString() === l._id.toString(),
      );

      return {
        ...l._doc,
        deal: deal || null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
