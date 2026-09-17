import fetch from "node-fetch";
import ical from "node-ical";

/* =========================================================
   SOURCE PRIORITY
========================================================= */

const SOURCE_PRIORITY = {
  OwnerRez: 1,
  Booking: 2,
  Hospitable: 2,
  Airbnb: 3,
  VRBO: 4,
  ECBYO: 5,
};

const getPriority = (source) => {
  return SOURCE_PRIORITY[source] ?? 99;
};

/* =========================================================
   DATE HELPERS
========================================================= */

const normalizeDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatDate = (date) => {
  const d = normalizeDate(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   GUEST HELPERS
========================================================= */

const cleanGuestName = (summary = "") => {
  return summary
    .replace(/\(.*?\)/g, "")
    .replace(/Blocked\s*-\s*/gi, "")
    .replace(/Reserved\s*-\s*/gi, "")
    .replace(/Smartbnb/gi, "")
    .replace(/Airbnb/gi, "")
    .replace(/VRBO/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getReservationId = (summary = "") => {
  const match = summary.match(/(HM[A-Z0-9]+|HA-[A-Z0-9]+|BR-[A-Z0-9]+)/i);

  return match ? match[0] : null;
};

/* =========================================================
   OVERLAP CHECK
========================================================= */

const datesOverlap = (a, b) => {
  const aStart = new Date(a.checkIn);
  const aEnd = new Date(a.checkOut);

  const bStart = new Date(b.checkIn);
  const bEnd = new Date(b.checkOut);

  return aStart < bEnd && bStart < aEnd;
};

/* =========================================================
   FETCH + MERGE ICAL EVENTS
========================================================= */

export const syncListingCalendars = async (listing) => {
  const events = [];

  const sources = (listing.icalSources || []).filter(
    (s) => s.enabled !== false && s.url,
  );

   

 for (const source of sources) {
  try {
    console.log("=================================");
    console.log("ICAL SOURCE:", source.name);
    console.log("ICAL URL:", source.url);

    const response = await fetch(source.url.trim(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
        Accept: "text/calendar,text/plain,*/*",
      },
    });

    console.log("ICAL STATUS:", response.status);
    console.log("ICAL CONTENT TYPE:", response.headers.get("content-type"));

    const text = await response.text();

    console.log("ICAL RESPONSE LENGTH:", text.length);
    console.log("ICAL RESPONSE START:", text.substring(0, 300));

    if (!response.ok) {
      throw new Error(
        `iCal fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const parsed = ical.parseICS(text);

    console.log(
      "ICAL PARSED EVENTS:",
      Object.values(parsed).filter(
        (event) => event.type === "VEVENT"
      ).length
    );

    Object.values(parsed).forEach((event) => {
      if (event.type !== "VEVENT") return;
      if (!event.start || !event.end) return;

      console.log("EVENT:", {
        summary: event.summary,
        start: event.start,
        end: event.end,
      });

      events.push({
        source: source.name,
        summary: event.summary || "",
        guest: cleanGuestName(event.summary),
        reservationId: getReservationId(event.summary),
        start: event.start,
        end: event.end,
        checkIn: formatDate(event.start),
        checkOut: formatDate(event.end),
      });
    });
  } catch (err) {
    console.log(
      `ICAL ERROR (${source.name}):`,
      err.message
    );
  }
}

 

  /* =====================================================
     REMOVE DUPLICATES
  ===================================================== */

  const seen = new Map();

  for (const event of events) {
    let key;

    // Highest confidence
    if (event.reservationId) {
      key = `RID:${event.reservationId}`;
    }

    // Guest + Dates
    else if (event.guest) {
      key = `GUEST:${event.guest}-${event.checkIn}-${event.checkOut}`;
    }

    // Dates only
    else {
      key = `DATE:${event.checkIn}-${event.checkOut}`;
    }

    const existing = seen.get(key);

    /* ---------------------------
       SAME BOOKING
    --------------------------- */

    if (existing) {
      const currentPriority = getPriority(event.source);
      const existingPriority = getPriority(existing.source);

      if (currentPriority < existingPriority) {
       

        seen.set(key, event);
      }

      continue;
    }

    /* ---------------------------
       OVERLAP CHECK
    --------------------------- */

    const overlap = [...seen.values()].find((item) =>
      datesOverlap(item, event),
    );

    if (overlap) {
      const currentPriority = getPriority(event.source);
      const overlapPriority = getPriority(overlap.source);

      if (currentPriority < overlapPriority) {
        for (const [k, v] of seen.entries()) {
          if (v === overlap) {
            seen.delete(k);
            break;
          }
        }

        seen.set(key, event);
 
      }

      continue;
    }

    seen.set(key, event);
  }

  const uniqueEvents = [...seen.values()];
 
 
  return uniqueEvents;
};

 export const buildCalendarEntries = (events) => {
  const occupied = new Map();

  // ----------------------------
  // Helper
  // ----------------------------
  const addDays = (dateString, days) => {
    const [y, m, d] = dateString.split("-").map(Number);

    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);

    return dt.toISOString().slice(0, 10);
  };

  // =====================================================
  // STEP 1 : BUILD OCCUPANCY MAP
  // =====================================================

  for (const event of events) {
    const checkIn = event.checkIn;     // YYYY-MM-DD
    const checkOut = event.checkOut;   // YYYY-MM-DD

    if (!checkIn || !checkOut) continue;

    // ---------------------------------
    // Occupied Nights
    // ---------------------------------

    let current = checkIn;

    while (current < checkOut) {
      if (!occupied.has(current)) {
        occupied.set(current, {
          occupied: false,
          checkIn: [],
          checkOut: [],
        });
      }

      occupied.get(current).occupied = true;

      current = addDays(current, 1);
    }

    // ---------------------------------
    // Check-In
    // ---------------------------------

    if (!occupied.has(checkIn)) {
      occupied.set(checkIn, {
        occupied: true,
        checkIn: [],
        checkOut: [],
      });
    }

    occupied.get(checkIn).checkIn.push(event);

    // ---------------------------------
    // Check-Out
    // ---------------------------------

    if (!occupied.has(checkOut)) {
      occupied.set(checkOut, {
        occupied: false,
        checkIn: [],
        checkOut: [],
      });
    }

    occupied.get(checkOut).checkOut.push(event);
  }

  // =====================================================
  // STEP 2 : SORT DATES
  // =====================================================

  const dates = [...occupied.keys()].sort();

  const calendar = [];

  for (const date of dates) {
    const info = occupied.get(date);

    const hasCheckIn = info.checkIn.length > 0;
    const hasCheckOut = info.checkOut.length > 0;

    // IMPORTANT
    // 12:00 UTC prevents timezone shifting
    const [y, m, d] = date.split("-").map(Number);

    const currentDate = new Date(
      Date.UTC(y, m - 1, d, 12, 0, 0)
    );

    // ---------------------------------
    // Turnover
    // ---------------------------------

    if (hasCheckIn && hasCheckOut) {
      calendar.push({
        date: currentDate,
        status: "COUT",
        source: "ical",
      });

      calendar.push({
        date: currentDate,
        status: "CIN",
        source: "ical",
      });

      continue;
    }

    // ---------------------------------
    // Check In
    // ---------------------------------

    if (hasCheckIn) {
      calendar.push({
        date: currentDate,
        status: "CIN",
        source: "ical",
      });
    }

    // ---------------------------------
    // Check Out
    // ---------------------------------

    if (hasCheckOut) {
      calendar.push({
        date: currentDate,
        status: "COUT",
        source: "ical",
      });
    }

    // ---------------------------------
    // Reserved
    // ---------------------------------

    if (info.occupied) {
      calendar.push({
        date: currentDate,
        status: "R",
        source: "ical",
      });
    }
  }

  // =====================================================
  // STEP 3 : REMOVE DUPLICATES
  // =====================================================

  const deduped = new Map();

  for (const item of calendar) {
    const key = `${item.date.toISOString().slice(0, 10)}-${item.status}`;

    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  // =====================================================
  // STEP 4 : SORT
  // =====================================================

  const finalCalendar = [...deduped.values()].sort(
    (a, b) => a.date - b.date
  );

   

  return finalCalendar;
};