import Deal from "../models/Deal.js";

// ================= CREATE DEAL =================

export const createDeal = async (req, res) => {
  try {
    console.log("BODY 👉", req.body);

    const {
      listingId,
      title,
      originalRate,
      discountedRate,
      displayFrom,
      displayEnd,
      dealStartDate,
      dealEndDate,
      description,
    } = req.body;

    // Required fields validation
    if (!listingId)
      return res.status(400).json({ message: "Listing ID is required" });

    if (!title)
      return res.status(400).json({ message: "Title is required" });

    if (originalRate === undefined)
      return res.status(400).json({ message: "Original Rate is required" });

    if (discountedRate === undefined)
      return res.status(400).json({ message: "Discounted Rate is required" });

    if (!displayFrom)
      return res.status(400).json({ message: "Display From is required" });

    if (!displayEnd)
      return res.status(400).json({ message: "Display End is required" });

    if (!dealStartDate)
      return res.status(400).json({ message: "Deal Start Date is required" });

    if (!dealEndDate)
      return res.status(400).json({ message: "Deal End Date is required" });

    // Only one deal per listing
    const exists = await Deal.findOne({ listingId });

    if (exists) {
      return res.status(400).json({
        message: "Deal already exists for this listing.",
      });
    }

    const deal = await Deal.create({
      listingId,
      title,
      originalRate,
      discountedRate,
      displayFrom,
      displayEnd,
      dealStartDate,
      dealEndDate,
      description,
      status: "active",
    });

    console.log("✅ DEAL CREATED", deal);

    res.status(201).json(deal);
  } catch (err) {
    console.error("CREATE DEAL ERROR", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= GET DEALS =================

export const getDeals = async (req, res) => {
  try {
    const { listingId } = req.params;

    const deals = await Deal.find({
      listingId,
    }).sort({ createdAt: -1 });

    res.json(deals);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= UPDATE =================

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Deal.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= DELETE =================

export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    await Deal.findByIdAndDelete(id);

    res.json({
      message: "Deal deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= ACTIVE DEALS =================

export const getActiveDeals = async (req, res) => {
  try {
    const today = new Date();

    const deals = await Deal.find({
      displayFrom: { $lte: today },
      displayEnd: { $gte: today },
      status: "active",
    }).populate("listingId");

    const listings = deals
      .filter((d) => d.listingId)
      .map((d) => ({
        ...d.listingId.toObject(),
        deal: d,
      }));

    console.log("FINAL DEAL LIST 👉", listings);

    res.json(listings);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};