import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";
import Listing from "../models/Listing.js";
import mongoose from "mongoose";
import Deal from "../models/Deal.js";
import Booking from "../models/Booking.js";
import Inquiry from "../models/Inquiry.js";
import Coupon from "../models/Coupon.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ================================
// HELPERS
// ================================
const toValidDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const toDateKey = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // 👉 "2026-03-19"
};

const normalizeNoonDate = (value) => {
  if (!value) return null;

  // if already Date object
  if (value instanceof Date) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(12, 0, 0, 0);
    return d;
  }

  // if yyyy-mm-dd string
  if (typeof value === "string") {
    const d = new Date(`${value}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  d.setHours(12, 0, 0, 0);
  return d;
};

const dateOnly = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const normalizeCalendar = (calendar = []) => {
  if (!Array.isArray(calendar)) return [];

  return calendar
    .map((item) => {
      const d = toValidDate(item?.date);
      if (!d) return null;
      d.setHours(12, 0, 0, 0); //  MUST ADD

      return {
        date: d,
        status: ["A", "R", "H"].includes(item?.status) ? item.status : "A",
        source: ["internal", "booking", "admin", "ical"].includes(item?.source)
          ? item.source
          : "internal",
        price: item?.price,
      };
    })
    .filter(Boolean);
};
// ================================
// HELPERS
// ================================
const normalize = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const getRateForDate = (rates, date) => {
  return rates.find((r) => {
    const from = new Date(r.from);
    const to = new Date(r.to);
    return date >= from && date <= to;
  });
};
// ----------------------------------------------------------
// PREVIEW BOOKING
// ----------------------------------------------------------
export const previewBooking = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut } = req.body;

    const listing = await Listing.findById(propertyId);
    if (!listing) {
      return res.status(404).json({ error: "Property not found" });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) {
      return res.status(400).json({ error: "Invalid dates" });
    }

    // ============================
    // DEAL FETCH
    // ============================
    const today = new Date();

    const deal = await Deal.findOne({
      listingId: propertyId,
      displayFrom: { $lte: today },
      displayEnd: { $gte: today },
    });

    // ============================
    // RATE FINDER
    // ============================

    // ============================
    // PRICE CALCULATION
    // ============================
    const deals = await Deal.find({
      listingId: propertyId,
    });

    let subtotal = 0;
    let nights = 0;



    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const current = new Date(d);

      const rate = listing.rates.find((r) => {
        return (
          current >= new Date(r.from) &&
          current <= new Date(r.to)
        );
      });

      let price = rate?.nightly || 0;

      const activeDeal = deals.find((deal) => {
        const currentKey = toDateKey(current);
        const startKey = toDateKey(deal.dealStartDate);
        const endKey = toDateKey(deal.dealEndDate);

        return currentKey >= startKey && currentKey <= endKey;
      });
      // console.log("CURRENT DATE 👉", current);
      // console.log("DEAL START 👉", deals[0]?.dealStartDate);
      // console.log("DEAL END 👉", deals[0]?.dealEndDate);
      // console.log("ACTIVE DEAL 👉", activeDeal);
      if (activeDeal) {
        price = activeDeal.discountedRate;
      }

      subtotal += price;
      nights++;
    }

    // ============================
    // EXTRA FEES
    // ============================
    // ============================
    // EXTRA FEES ONLY
    // ============================
    let extraFeesTotal = 0;

    const calculatedFees = (listing.extraFees || []).map((fee) => {
      let amount = 0;

      if (fee.type === "$") {
        amount = Number(fee.value);
      }

      if (fee.type === "%") {
        amount = Math.round((subtotal * Number(fee.value)) / 100);
      }

      // ONLY mandatory auto add
      if (fee.option === "mandatory") {
        extraFeesTotal += amount;
      }

      return {
        name: fee.name,
        amount,
        type: fee.type,
        option: fee.option,
      };
    });

    const total = subtotal + extraFeesTotal;

    res.json({
      nights,
      subtotal,
      extraFees: calculatedFees, // ✅ ALL FEES
      total,
    });

  } catch (err) {
    console.error("❌ PREVIEW ERROR:", err.message);
    res.status(500).json({ error: "Preview failed" });
  }
};
// ----------------------------------------------------------
// CREATE BOOKING (Stripe Verification)
// ----------------------------------------------------------

export const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      checkIn,
      checkOut,
      guests,
      user,
      paymentIntentId,
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const listing = await Listing.findById(propertyId);

    if (!listing) {
      return res.status(404).json({ error: "Property not found" });
    }

    const start = normalizeNoonDate(checkIn);
    const end = normalizeNoonDate(checkOut);

    if (!start || !end || start >= end) {
      return res.status(400).json({ error: "Invalid booking dates" });
    }

    // ==============================
    // MIN NIGHTS VALIDATION
    // ==============================
    const getMinNightsForDate = (rates, checkIn) => {
      const selected = rates.find((r) => {
        const from = new Date(r.from);
        const to = new Date(r.to);
        return checkIn >= from && checkIn <= to;
      });

      return selected?.minNights || 1;
    };

    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const minNights = getMinNightsForDate(listing.rates, start);

    if (nights < minNights) {
      return res.status(400).json({
        error: `Minimum ${minNights} nights required`,
      });
    }

    // ==============================
    // GET ALL DEALS
    // ==============================
    const deals = await Deal.find({
      listingId: propertyId,
    });

    // ==============================
    // PRICE CALCULATION
    // ==============================
    let total = 0;
    let nightsCount = 0;

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const current = new Date(d);

      const rate = getRateForDate(listing.rates, current);

      let price = rate?.nightly || 0;

      const activeDeal = deals.find((deal) => {
        const currentKey = toDateKey(current);
        const startKey = toDateKey(deal.dealStartDate);
        const endKey = toDateKey(deal.dealEndDate);

        return currentKey >= startKey && currentKey <= endKey;
      });

      if (activeDeal) {
        price = activeDeal.discountedRate;
      }

      total += price;
      nightsCount++;
    }

    // ==============================
    // EXTRA FEES (FIXED CLEAN)
    // ==============================
    const basePrice = total;

    let extraFeesTotal = 0;

    const calculatedFees = (listing.extraFees || []).map((fee) => {
      let amount = 0;

      if (fee.type === "$") {
        amount = Number(fee.value);
      }

      if (fee.type === "%") {
        amount = Math.round((basePrice * Number(fee.value)) / 100);
      }

      if (fee.option === "mandatory") {
        extraFeesTotal += amount;
      }

      return {
        name: fee.name,
        amount,
        type: fee.type,
        option: fee.option,
      };
    });

    const finalTotal = basePrice + extraFeesTotal;

    // ==============================
    // CREATE BOOKING
    // ==============================
    const booking = new Booking({
      property: propertyId,
      checkIn: start,
      checkOut: end,
      guests,
      nights: nightsCount,
      user,
      pricing: {
        total: finalTotal,
        nights: nightsCount,
        extraFees: calculatedFees,
      },
      payment: {
        provider: "stripe",
        paid: true,
        paymentIntentId,
      },
      status: "confirmed",
    });

    await booking.save();

    // ==============================
    // UPDATE CALENDAR
    // ==============================
    for (
      let i = 0;
      i < (end - start) / (1000 * 60 * 60 * 24);
      i++
    ) {
      const current = new Date(start);
      current.setDate(current.getDate() + i);
      current.setHours(12, 0, 0, 0);

      const exists = listing.calendar.find(
        (c) =>
          new Date(c.date).toDateString() ===
          current.toDateString()
      );

      if (!exists) {
        listing.calendar.push({
          date: current,
          status: "R",
          source: "booking",
        });
      }
    }

    // ==============================
    // TURNOVER DAY
    // ==============================
    const turnoverDate = new Date(end);
    turnoverDate.setHours(12, 0, 0, 0);

    const turnoverExists = listing.calendar.find(
      (c) =>
        new Date(c.date).toDateString() ===
        turnoverDate.toDateString()
    );

    if (!turnoverExists) {
      listing.calendar.push({
        date: turnoverDate,
        status: "H",
        source: "booking",
      });
    }

    await listing.save();

    res.json({
      message: "Booking confirmed",
      bookingId: booking._id,
      totalPrice: finalTotal,
    });

  } catch (err) {
    console.error("❌ BOOKING ERROR:", err.message);
    res.status(500).json({ error: "Booking failed" });
  }
};
// ----------------------------------------------------------
// UPDATE BOOKING STATUS
// ----------------------------------------------------------
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking already cancelled" });
    }

    if (status === "confirmed") {
      const property = await Listing.findById(booking.property);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // FIX: booking.checkIn / booking.checkOut are already Date values
      const start = normalizeNoonDate(booking.checkIn);
      const end = normalizeNoonDate(booking.checkOut);

      if (!start || !end || start >= end) {
        return res.status(400).json({ error: "Invalid booking dates in record" });
      }

      property.calendar = normalizeCalendar(property.calendar);

      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const current = new Date(d);
        const exists = property.calendar.find(
          (c) => dateOnly(c.date) === dateOnly(current)
        );

        if (!exists) {
          property.calendar.push({
            date: current,
            status: "R",
            source: "booking",
          });
        }
      }

      // turnover / hold day
      const turnoverExists = property.calendar.find(
        (c) => dateOnly(c.date) === dateOnly(end)
      );

      if (!turnoverExists) {
        property.calendar.push({
          date: new Date(end),
          status: "H",
          source: "booking",
        });
      }

      property.calendar = normalizeCalendar(property.calendar);
      await property.save();

      booking.status = "confirmed";
    }

    if (status === "cancelled") {
      booking.status = "cancelled";
    }

    await booking.save();

    res.json({
      message: `Booking ${status}`,
      booking,
    });
  } catch (err) {
    // console.error("Update booking status error:", err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
};

// ----------------------------------------------------------
// GET ALL BOOKINGS (ADMIN)
// ----------------------------------------------------------
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("property")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    res.status(500).json({ error: "Payment failed" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);

      return {
        month: d.toLocaleString("default", { month: "short" }),
        monthNumber: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    }).reverse();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          bookings: { $sum: 1 },
        },
      },
    ]);

    const monthlyBookings = last6Months.map((m) => {
      const found = monthlyData.find(
        (d) =>
          d._id.month === m.monthNumber &&
          d._id.year === m.year
      );

      return {
        month: m.month,
        bookings: found ? found.bookings : 0,
      };
    });

    // ===== COUNTS =====
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalListing = await Listing.countDocuments();
    const totalInquiry = await Inquiry.countDocuments();

    // 👉 SAFE DEFAULTS (no error)
    const pendingBookings = 0;
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
      totalInquiry,
      totalReviews,
      pendingReviews,
      monthlyBookings,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ----------------------------------------------------------
// DELETE BOOKING
// ----------------------------------------------------------
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const listing = await Listing.findById(booking.property);
    if (!listing) {
      return res.status(404).json({ error: "Property not found" });
    }

    const toDateKey = (value) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;

      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid booking dates in record" });
    }

    // booking ki reserved stay dates nikaalo
    const stayDateKeys = new Set();
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = toDateKey(d);
      if (key) stayDateKeys.add(key);
    }

    // checkout / turnover day
    const turnoverKey = toDateKey(end);

    // console.log("DELETE BOOKING ID:", booking._id);
    // console.log("STAY DATE KEYS:", [...stayDateKeys]);
    // console.log("TURNOVER KEY:", turnoverKey);
    // console.log("CALENDAR BEFORE DELETE:", listing.calendar);

    listing.calendar = (listing.calendar || []).filter((item) => {
      const key = toDateKey(item.date);
      if (!key) return false;

      // remove all booking-created reserved dates
      if (item.status === "R" && stayDateKeys.has(key)) {
        return false;
      }
      // remove booking-created turnover day
      if (item.status === "H" && key === turnoverKey) {
        return false;
      }

      return true;
    });

    // console.log("CALENDAR AFTER DELETE:", listing.calendar);

    await listing.save();
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: "Booking deleted and calendar updated" });
  } catch (err) {
    // console.error("Delete booking error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
};

