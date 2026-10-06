import Listing from "../models/Listing.js";

import fetch from "node-fetch";
import ical from "ical";
import mongoose from "mongoose";
import {
  syncListingCalendars,
  buildCalendarEntries,
} from "../helpers/icalHelper.js";

import { generateICal } from "../helpers/icalExportHelper.js";

const toValidDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const dateOnly = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  // ✅ local date (NO timezone shift)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const normalizeCalendar = (calendar = []) => {
  if (!Array.isArray(calendar)) return [];

  return calendar
    .map((item) => {
      const d = toValidDate(item?.date);

      if (!d) return null;

      d.setHours(12, 0, 0, 0);

      return {
        bookingId: item?.bookingId || null,

        date: d,

        status: ["A", "R", "H", "CIN", "COUT"].includes(item?.status)
          ? item.status
          : "A",

        source: ["internal", "booking", "admin", "ical"].includes(
          item?.source
        )
          ? item.source
          : "internal",

        price: item?.price,
      };
    })
    .filter(Boolean);
};

export const addCalendarDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status = "R", source = "admin", price } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date required" });
    }

    const validDate = toValidDate(date);
    if (!validDate) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    listing.calendar = normalizeCalendar(listing.calendar);

    const target = dateOnly(validDate);

    listing.calendar = listing.calendar.filter(
      (c) => dateOnly(c.date) !== target,
    );

    listing.calendar.push({
      date: validDate,
      status,
      source,
      price,
    });

    listing.calendar = normalizeCalendar(listing.calendar);

    await listing.save();

    res.json({
      message: "Calendar updated successfully",
      calendar: listing.calendar,
    });
  } catch (err) {
    
    res.status(500).json({ error: "Calendar update failed" });
  }
};

export const removeCalendarDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date required" });
    }

    const validDate = toValidDate(date);
    if (!validDate) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    listing.calendar = normalizeCalendar(listing.calendar);

    const target = dateOnly(validDate);

    listing.calendar = listing.calendar.filter(
      (c) => dateOnly(c.date) !== target,
    );

    await listing.save();

    res.json({
      message: "Date removed successfully",
      calendar: listing.calendar,
    });
  } catch (err) {
    console.error("removeCalendarDate error:", err);
    res.status(500).json({ error: "Failed to remove date" });
  }
};

export const getCalendar = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid listing ID",
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    console.log(
      "MANUAL BOOKINGS FROM DB:",
      listing.manualBookings
    );

    res.json({
      calendar: normalizeCalendar(listing.calendar || []),

      manualBookings: listing.manualBookings || [],

      icalUrl: listing.icalUrl || "",

      icalSources: listing.icalSources || [],
    });
  } catch (err) {
    console.error("getCalendar error:", err);

    res.status(500).json({
      error: "Calendar fetch failed",
    });
  }
};
export const createManualBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      startDate,
      endDate,
      guests = 0,
      comment = "",
    } = req.body;

    // ---------------------------------------
    // VALIDATION
    // ---------------------------------------

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start Date and End Date required",
      });
    }

    const startKey = dateOnly(startDate);
    const endKey = dateOnly(endDate);

    if (!startKey || !endKey) {
      return res.status(400).json({
        error: "Invalid startDate or endDate",
      });
    }

    if (startKey >= endKey) {
      return res.status(400).json({
        error: "Check-out must be after check-in",
      });
    }

    // ---------------------------------------
    // FIND LISTING
    // ---------------------------------------

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    // ---------------------------------------
    // CREATE LOCAL DATE
    // ---------------------------------------

    const createDate = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);

      return new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0,
        0
      );
    };

    const start = createDate(startKey);
    const end = createDate(endKey);

    // ---------------------------------------
    // CALCULATE NIGHTS
    // ---------------------------------------

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const nights = Math.round(
      (end.getTime() - start.getTime()) / MS_PER_DAY
    );

    if (nights <= 0) {
      return res.status(400).json({
        error: "Invalid booking dates",
      });
    }

    // ---------------------------------------
    // CHECK EXISTING CALENDAR
    // ---------------------------------------

    const existingCalendar = normalizeCalendar(
      listing.calendar || []
    );

    const conflict = existingCalendar.some((item) => {
      if (!item?.date) return false;

      const key = dateOnly(item.date);

      // iCal ko abhi manual booking
      // conflict mein include nahi kar rahe
      if (item.source === "ical") {
        return false;
      }

      // Available dates conflict nahi hain
      if (item.status === "A") {
        return false;
      }

      // Checkout date par new booking
      // start ho sakti hai
      if (key === endKey && item.status === "COUT") {
        return false;
      }

      return key >= startKey && key < endKey;
    });

    if (conflict) {
      return res.status(409).json({
        error: "Selected dates are already booked or blocked",
      });
    }

    // ---------------------------------------
    // CREATE MANUAL BOOKING
    // ---------------------------------------

    listing.manualBookings = listing.manualBookings || [];

    listing.manualBookings.push({
      customerName,
      customerEmail,
      customerPhone,

      checkIn: start,
      checkOut: end,

      guests: Number(guests) || 0,

      nights,

      comment,

      status: "confirmed",

      bookedAt: new Date(),
    });

    // ---------------------------------------
    // GET NEW BOOKING ID
    // ---------------------------------------

    const manualBooking =
      listing.manualBookings[
        listing.manualBookings.length - 1
      ];

    const bookingId = manualBooking._id;

    // ---------------------------------------
    // CREATE CALENDAR ENTRIES
    // ---------------------------------------

    const calendarEntries = [];

    let current = new Date(start);

    while (current < end) {
      const currentDate = new Date(current);

      const currentKey = dateOnly(currentDate);

      let status = "R";

      if (currentKey === startKey) {
        status = "CIN";
      }

      calendarEntries.push({
        bookingId,

        date: currentDate,

        status,

        source: "admin",
      });

      current.setDate(current.getDate() + 1);
    }

    // ---------------------------------------
    // CHECKOUT DATE
    // ---------------------------------------

    calendarEntries.push({
      bookingId,

      date: new Date(end),

      status: "COUT",

      source: "admin",
    });

    // ---------------------------------------
    // ADD TO CALENDAR
    // ---------------------------------------

    listing.calendar = normalizeCalendar([
      ...(listing.calendar || []),
      ...calendarEntries,
    ]);

    // ---------------------------------------
    // SORT
    // ---------------------------------------

    listing.calendar.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    // ---------------------------------------
    // SAVE
    // ---------------------------------------

    await listing.save();

    console.log("=================================");
    console.log("MANUAL BOOKING CREATED");
    console.log("LISTING:", listing._id);
    console.log("BOOKING:", bookingId);
    console.log("CUSTOMER:", customerName);
    console.log("START:", startKey);
    console.log("END:", endKey);
    console.log("NIGHTS:", nights);
    console.log("=================================");

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return res.status(201).json({
      success: true,

      message: "Manual booking created successfully",

      booking: manualBooking,

      calendar: listing.calendar,
    });
  } catch (err) {
    console.error("CREATE MANUAL BOOKING ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to create manual booking",
    });
  }
};
export const updateManualBooking = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    const {
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      startDate,
      endDate,
      guests = 0,
      comment = "",
      status = "confirmed",
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start Date and End Date required",
      });
    }

    const startKey = dateOnly(startDate);
    const endKey = dateOnly(endDate);

    if (!startKey || !endKey) {
      return res.status(400).json({
        error: "Invalid startDate or endDate",
      });
    }

    if (startKey >= endKey) {
      return res.status(400).json({
        error: "Check-out must be after check-in",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    const manualBooking = listing.manualBookings.id(bookingId);

    if (!manualBooking) {
      return res.status(404).json({
        error: "Manual booking not found",
      });
    }

    // ---------------------------------------
    // DATE HELPER
    // ---------------------------------------

    const createDate = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);

      return new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0,
        0
      );
    };

    const start = createDate(startKey);
    const end = createDate(endKey);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const nights = Math.round(
      (end.getTime() - start.getTime()) / MS_PER_DAY
    );

    // ---------------------------------------
    // CHECK CONFLICT
    // Ignore this booking's own calendar dates
    // ---------------------------------------

    const existingCalendar = normalizeCalendar(
      listing.calendar || []
    );

    const conflict = existingCalendar.some((item) => {
      if (!item?.date) return false;

      if (item.source === "ical") {
        return false;
      }

      if (
        item.bookingId &&
        String(item.bookingId) === String(bookingId)
      ) {
        return false;
      }

      if (item.status === "A") {
        return false;
      }

      const key = dateOnly(item.date);

      if (key === endKey && item.status === "COUT") {
        return false;
      }

      return key >= startKey && key < endKey;
    });

    if (conflict) {
      return res.status(409).json({
        error: "Selected dates are already booked or blocked",
      });
    }

    // ---------------------------------------
    // UPDATE BOOKING
    // ---------------------------------------

    manualBooking.customerName = customerName;
    manualBooking.customerEmail = customerEmail;
    manualBooking.customerPhone = customerPhone;

    manualBooking.checkIn = start;
    manualBooking.checkOut = end;

    manualBooking.guests = Number(guests) || 0;
    manualBooking.nights = nights;

    manualBooking.comment = comment;
    manualBooking.status = status;

    // ---------------------------------------
    // REMOVE OLD CALENDAR ENTRIES
    // ONLY THIS BOOKING
    // ---------------------------------------

    listing.calendar = normalizeCalendar(
      listing.calendar || []
    ).filter((item) => {
      if (!item.bookingId) return true;

      return (
        String(item.bookingId) !== String(bookingId)
      );
    });

    // ---------------------------------------
    // CREATE NEW CALENDAR ENTRIES
    // ---------------------------------------

    const calendarEntries = [];

    let current = new Date(start);

    while (current < end) {
      const currentDate = new Date(current);

      calendarEntries.push({
        bookingId: manualBooking._id,
        date: currentDate,
        status:
          dateOnly(currentDate) === startKey
            ? "CIN"
            : "R",
        source: "admin",
      });

      current.setDate(current.getDate() + 1);
    }

    // CHECKOUT
    calendarEntries.push({
      bookingId: manualBooking._id,
      date: new Date(end),
      status: "COUT",
      source: "admin",
    });

    listing.calendar.push(...calendarEntries);

    listing.calendar.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    await listing.save();

    return res.json({
      success: true,
      message: "Manual booking updated successfully",
      booking: manualBooking,
      calendar: listing.calendar,
      manualBookings: listing.manualBookings,
    });
  } catch (err) {
    console.error("UPDATE MANUAL BOOKING ERROR:", err);

    return res.status(500).json({
      error:
        err.message || "Failed to update manual booking",
    });
  }
};

export const deleteManualBooking = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    const manualBooking = listing.manualBookings.id(
      bookingId
    );

    if (!manualBooking) {
      return res.status(404).json({
        error: "Manual booking not found",
      });
    }

    // ---------------------------------------
    // REMOVE BOOKING
    // ---------------------------------------

    manualBooking.deleteOne();

    // ---------------------------------------
    // REMOVE ONLY THIS BOOKING'S CALENDAR
    // ---------------------------------------

    listing.calendar = normalizeCalendar(
      listing.calendar || []
    ).filter((item) => {
      if (!item.bookingId) return true;

      return (
        String(item.bookingId) !== String(bookingId)
      );
    });

    await listing.save();

    return res.json({
      success: true,
      message: "Manual booking deleted successfully",

      calendar: listing.calendar,

      manualBookings: listing.manualBookings,
    });
  } catch (err) {
    console.error("DELETE MANUAL BOOKING ERROR:", err);

    return res.status(500).json({
      error:
        err.message || "Failed to delete manual booking",
    });
  }
};

export const blockDates = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      comment = "",
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start Date and End Date required",
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    // ---------------------------------------
    // DATE ONLY — timezone safe
    // ---------------------------------------

    const startKey = dateOnly(startDate);
    const endKey = dateOnly(endDate);

    if (!startKey || !endKey) {
      return res.status(400).json({
        error: "Invalid startDate or endDate",
      });
    }

    if (startKey > endKey) {
      return res.status(400).json({
        error: "Start date cannot be after end date",
      });
    }

    // ---------------------------------------
    // Convert YYYY-MM-DD to local Date
    // ---------------------------------------

    const createDate = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);

      return new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0,
        0
      );
    };

    // ---------------------------------------
    // REMOVE EXISTING ADMIN/ICAL ENTRIES
    // FOR SAME DATES
    // ---------------------------------------

    const existingCalendar = normalizeCalendar(
      listing.calendar || []
    );

    const newCalendar = existingCalendar.filter((item) => {
      const key = dateOnly(item.date);

      // Never remove booking data
      if (item.source === "booking") {
        return true;
      }

      // Remove old admin/ical data for selected range
      if (key >= startKey && key <= endKey) {
        return false;
      }

      return true;
    });

    // ---------------------------------------
    // ADD DATES
    // ---------------------------------------

    let current = createDate(startKey);
    const end = createDate(endKey);

    while (current <= end) {
      const currentKey = dateOnly(current);

      let status = "R";

      if (currentKey === startKey) {
        status = "CIN";
      } else if (currentKey === endKey) {
        status = "COUT";
      }

      newCalendar.push({
        date: new Date(current),
        status,
        source: "admin",
        customerName,
        customerEmail,
        customerPhone,
        comment,
      });

      current.setDate(current.getDate() + 1);
    }

    // ---------------------------------------
    // NORMALIZE + SORT
    // ---------------------------------------

    listing.calendar = normalizeCalendar(newCalendar);

    listing.calendar.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    await listing.save();

    console.log("=================================");
    console.log("CALENDAR BLOCKED");
    console.log("LISTING:", listing._id);
    console.log("START:", startKey);
    console.log("END:", endKey);
    console.log("TOTAL CALENDAR:", listing.calendar.length);
    console.log("=================================");

    return res.json({
      success: true,
      message: "Dates blocked successfully",
      calendar: listing.calendar,
    });

  } catch (err) {
    console.error("BLOCK DATES ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to block dates",
    });
  }
};

export const unblockDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date required" });
    }

    const start = toValidDate(startDate);
    const end = toValidDate(endDate);

    if (!start || !end) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    if (start > end) {
      return res
        .status(400)
        .json({ error: "Start date cannot be after end date" });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    listing.calendar = normalizeCalendar(listing.calendar);

    const startKey = dateOnly(start);
    const endKey = dateOnly(end);

    listing.calendar = listing.calendar.filter((c) => {
      const key = dateOnly(c.date);

      //  booking dates protect karo
      if (c.source === "booking") return true;

      //  range ke andar wale remove karo
      return key < startKey || key > endKey;
    });

    await listing.save();

    res.json({
      message: "Dates unblocked successfully",
      calendar: listing.calendar,
    });
  } catch (err) {
    console.error("unblockDates error:", err);
    res.status(500).json({ error: "Unblock failed" });
  }
};

export const cleanDuplicateCalendar = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const rank = (item) => {
      if (item?.source === "booking" && item?.status === "R") return 5;
      if (item?.source === "booking" && item?.status === "H") return 4;
      if (item?.source === "admin") return 3;
      if (item?.source === "internal") return 2;
      if (item?.source === "ical") return 1;
      return 0;
    };

    const map = new Map();

    for (const item of listing.calendar) {
      const key = dateOnly(item.date);

      if (!map.has(key)) {
        map.set(key, item);
      } else {
        // booking ko priority do
        if (item.source === "booking") {
          map.set(key, item);
        }
      }
    }

    listing.calendar = Array.from(map.values());
    await listing.save();

    res.json({
      message: "Duplicate calendar cleaned",
      calendar: listing.calendar,
    });
  } catch (err) {
    console.error("cleanDuplicateCalendar error:", err);
    res.status(500).json({ error: "Cleanup failed" });
  }
};

export const clearCalendar = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    listing.calendar = [];
    await listing.save();

    res.json({
      message: "Calendar cleared successfully",
      calendar: [],
    });
  } catch (err) {
    console.error("clearCalendar error:", err);
    res.status(500).json({ error: "Failed to clear calendar" });
  }
};

export const importICal = async (req, res) => {
  try {
    const { id } = req.params;

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "iCal URL required",
      });
    }

    // =====================================
    // FETCH ICAL
    // =====================================

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(400).json({
        error: "Invalid iCal URL",
      });
    }

    const data = await response.text();

    let events;

    try {
      events = ical.parseICS(data);
    } catch (e) {
      console.error("ICS PARSE ERROR:", e);

      return res.status(500).json({
        error: "Invalid iCal format",
      });
    }

    // =====================================
    // FIND LISTING
    // =====================================

    const listing = await Listing.findById(id);
    if (req.body.icalUrl?.trim()) {
      listing.icalUrl = req.body.icalUrl;

      // yahan tumhari existing importICal logic call hogi
      // ya helper function bana lo:
      await importICalData(listing._id, req.body.icalUrl);
    }

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    // =====================================
    // REMOVE OLD ICAL DATA
    // =====================================

    listing.calendar = (listing.calendar || []).filter(
      (c) => c.source !== "ical",
    );

    const bookingDates = [];

    // 🔥 parse all bookings
    // =====================================
    // LOOP EVENTS
    // =====================================

    for (const key in events) {
      const event = events[key];

      if (event.type !== "VEVENT") continue;

      if (!event.start || !event.end) continue;

      // =====================================
      // SAFE DATES
      // =====================================

      const start = new Date(
        event.start.getFullYear(),
        event.start.getMonth(),
        event.start.getDate(),
        12,
        0,
        0,
        0,
      );

      const end = new Date(
        event.end.getFullYear(),
        event.end.getMonth(),
        event.end.getDate(),
        12,
        0,
        0,
        0,
      );

      // TOTAL NIGHTS
      const totalNights = Math.round((end - start) / (1000 * 60 * 60 * 24));

      if (totalNights <= 0) continue;

      // =====================================
      // SINGLE NIGHT
      // =====================================

      if (totalNights === 1) {
        bookingDates.push({
          date: new Date(start),
          status: "CIN",
          source: "ical",
        });

        bookingDates.push({
          date: new Date(end),
          status: "COUT",
          source: "ical",
        });
      }

      // =====================================
      // MULTI NIGHT
      // =====================================
      else {
        // CHECK-IN
        bookingDates.push({
          date: new Date(start),
          status: "CIN",
          source: "ical",
        });

        // BOOKED NIGHTS
        for (let i = 1; i < totalNights; i++) {
          const booked = new Date(start);

          booked.setDate(start.getDate() + i);

          booked.setHours(12, 0, 0, 0);

          bookingDates.push({
            date: booked,
            status: "R",
            source: "ical",
          });
        }

        // REAL CHECKOUT DAY
        bookingDates.push({
          date: new Date(end),
          status: "COUT",
          source: "ical",
        });
      }
    }

    // =====================================
    // MERGE DATES
    // =====================================

    const map = new Map();

    // KEEP MANUAL DATES
    listing.calendar
      .filter((c) => c.source !== "ical")
      .forEach((c) => {
        const key = dateOnly(c.date);

        if (!map.has(key)) {
          map.set(key, []);
        }

        map.get(key).push(c);
      });

    // ADD ICAL DATES
    bookingDates.forEach((d) => {
      const key = dateOnly(d.date);

      if (!map.has(key)) {
        map.set(key, []);
      }

      const existing = map.get(key) || [];

      existing.push({
        date: d.date,
        status: d.status,
        source: d.source,
      });

      map.set(key, existing);
    });
    // =====================================
    // CREATE TURNOVER DATES
    // =====================================

    const grouped = {};

    bookingDates.forEach((item) => {
      const key = dateOnly(item.date);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(item);
    });

    Object.keys(grouped).forEach((key) => {
      const statuses = grouped[key].map((x) => x.status);

      const hasCin = statuses.includes("CIN");
      const hasCout = statuses.includes("COUT");

      if (hasCin && hasCout) {
         
      }
    });

    // =====================================
    // FINAL CALENDAR
    // =====================================

    listing.calendar = Array.from(map.values()).flat();

    // remove invalid
    listing.calendar = listing.calendar.filter((c) => c && c.date);

    // sort by date
    listing.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));

    // save url
    listing.icalUrl = url;
   
    await listing.save();

    // res.json({
    //   message: "iCal imported successfully",
    //   total: bookingDates.length,
    //   calendar: listing.calendar,
    // });
    //  const grouped = {};

    bookingDates.forEach((x) => {
      const key = dateOnly(x.date);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(x.status);
    });

 
  } catch (err) {
    console.error("ICAL FINAL ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
};

export const resetICal = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    listing.calendar = (listing.calendar || []).filter(
      (c) => c.source !== "ical",
    );

    listing.icalUrl = "";

    await listing.save();

    res.json({
      message: "iCal reset successful",
      calendar: listing.calendar,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reset failed" });
  }
};

export const getAllListingCalendars = async (req, res) => {
  try {
    const listings = await Listing.find()
      .select({
        property: 1,
        calendar: 1,
        icalUrl: 1,
        status: 1,
      })
      .sort({ "property.title": 1 });

    const data = listings.map((listing) => ({
      _id: listing._id,
      title: listing.property?.title || "Untitled Property",

      // Old
      icalUrl: listing.icalUrl || "",

      // New
      icalSources: listing.icalSources || [],

      calendar: normalizeCalendar(listing.calendar || []),
    }));

    res.json(data);
  } catch (err) {
    console.error("getAllListingCalendars:", err);

    res.status(500).json({
      error: "Failed to fetch calendars",
    });
  }
};

export const saveICalSources = async (req, res) => {
 
  try {
    const { id } = req.params;
    const { icalSources } = req.body;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    listing.icalSources = Array.isArray(icalSources) ? icalSources : [];

    await listing.save();

    res.json({
      success: true,
      message: "iCal sources saved successfully",
      icalSources: listing.icalSources,
    });
  } catch (err) {
    console.error("saveICalSources:", err);

    res.status(500).json({
      error: "Failed to save iCal sources",
    });
  }
};


export const mergeICalSources = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    console.log("========== MERGE ICAL ==========");
    console.log("LISTING:", listing._id);
    console.log("ICAL SOURCES:", listing.icalSources);

    const events = await syncListingCalendars(listing);

    console.log("SYNCED EVENTS:", events);

    const mergedCalendar = buildCalendarEntries(events);

    console.log("MERGED CALENDAR:", mergedCalendar);

    listing.calendar = (listing.calendar || []).filter(
      (item) => item.source !== "ical"
    );

    listing.calendar.push(...mergedCalendar);

    await listing.save();

    console.log(
      "SAVED CALENDAR COUNT:",
      listing.calendar.length
    );

    res.json({
      success: true,
      imported: mergedCalendar.length,
      calendar: mergedCalendar,
    });

  } catch (err) {
    console.error("Merge Error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================================================
// EXPORT UNIFIED ICAL
// =====================================================

// =====================================================
// EXPORT UNIFIED ICAL
// =====================================================

export const exportICal = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE LISTING ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid listing ID");
    }

    // ==========================================
    // FIND LISTING
    // ==========================================

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    // ==========================================
    // GET CALENDAR
    // ==========================================

    const calendar = normalizeCalendar(
      listing.calendar || []
    );

    // ==========================================
    // SORT BY DATE
    // ==========================================

    calendar.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    // ==========================================
    // BUILD BOOKINGS
    // ==========================================

    const bookings = [];

    let currentBooking = null;

    for (const item of calendar) {
      const status = item.status;

      // ------------------------------------------
      // CHECK-IN
      // ------------------------------------------

      if (status === "CIN") {
        currentBooking = {
          start: new Date(item.date),
          source: item.source,
        };

        continue;
      }

      // ------------------------------------------
      // CHECK-OUT
      // ------------------------------------------

      if (status === "COUT" && currentBooking) {
        const start = currentBooking.start;
        const end = new Date(item.date);

        // Make sure end is after start
        if (end > start) {
          bookings.push({
            start,
            end,
            summary: "Reserved",
            uid: `${id}-${dateOnly(start)}-${dateOnly(end)}`,
          });
        }

        currentBooking = null;
      }
    }

    // ==========================================
    // PROPERTY NAME
    // ==========================================

    const propertyTitle =
      listing.property?.title ||
      "Property Calendar";

    // ==========================================
    // GENERATE ICS
    // ==========================================

    const ics = generateICal(
      bookings,
      propertyTitle
    );

    // ==========================================
    // RESPONSE HEADERS
    // ==========================================

    res.setHeader(
      "Content-Type",
      "text/calendar; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${propertyTitle
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}-calendar.ics"`
    );

    // ==========================================
    // SEND ICS
    // ==========================================

    res.send(ics);

  } catch (err) {
    console.error("EXPORT ICAL ERROR:", err);

    res.status(500).send(
      "Failed to generate iCal calendar"
    );
  }
};
// export const clearCalendar = async (
//   req,
//   res
// ) => {
//   try {
//     const listing =
//       await Listing.findById(
//         req.params.id
//       );

//     if (!listing) {
//       return res
//         .status(404)
//         .json({
//           error: "Listing not found",
//         });
//     }

//     listing.calendar = [];

//     await listing.save();

//     res.json({
//       message:
//         "Calendar cleared successfully",
//     });

//   } catch (err) {
//     console.log(err);

//     res.status(500).json({
//       error: err.message,
//     });
//   }
// };
