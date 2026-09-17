import cron from "node-cron";
import Listing from "../models/Listing.js";

import {
  syncListingCalendars,
  buildCalendarEntries,
} from "../helpers/icalHelper.js";

let isSyncRunning = false;

const startCalendarCron = () => {
  console.log("🚀 Calendar Cron initialized");
  console.log("⏱️ Schedule: Every 5 minutes");

  // ==========================================
  // RUN EVERY 5 MINUTES
  // ==========================================

  cron.schedule("0 * * * *", async () => {

    // ==========================================
    // PREVENT OVERLAPPING SYNC
    // ==========================================

    if (isSyncRunning) {
      console.log(
        "⏭️ Previous iCal sync is still running. Skipping this run."
      );
      return;
    }

    isSyncRunning = true;

    const start = Date.now();

    console.log("\n========================================");
    console.log("🔄 ICAL CRON STARTED");
    console.log("⏰ Time:", new Date().toISOString());
    console.log("========================================");

    try {

      // ==========================================
      // FIND LISTINGS HAVING ICAL SOURCES
      // ==========================================

      const listings = await Listing.find({
        "icalSources.url": {
          $exists: true,
          $ne: "",
        },
      });

      console.log(`📋 Found ${listings.length} listings`);

      // ==========================================
      // NO LISTINGS
      // ==========================================

      if (listings.length === 0) {
        console.log("⚠️ No listings with iCal sources found");
        return;
      }

      // ==========================================
      // SYNC EACH LISTING
      // ==========================================

      for (const listing of listings) {

        const propertyTitle =
          listing.property?.title || "Untitled Property";

        console.log("\n----------------------------------------");
        console.log(`🏠 Property: ${propertyTitle}`);
        console.log(`🆔 Listing ID: ${listing._id}`);

        try {

          // ========================================
          // GET ENABLED ICAL SOURCES
          // ========================================

          const sources = (listing.icalSources || []).filter(
            (source) =>
              source.enabled !== false &&
              source.url &&
              source.url.trim() !== ""
          );

          console.log(
            `🔗 iCal sources found: ${sources.length}`
          );

          sources.forEach((source, index) => {
            console.log(
              `   ${index + 1}. ${
                source.name || "Unknown Source"
              }`
            );
          });

          // ========================================
          // FETCH + MERGE ICAL EVENTS
          // ========================================

          console.log("📥 Fetching iCal calendars...");

          const events =
            await syncListingCalendars(listing);

          console.log(
            `📦 Events received: ${events.length}`
          );

          // ========================================
          // BUILD CALENDAR ENTRIES
          // ========================================

          const mergedCalendar =
            buildCalendarEntries(events);

          console.log(
            `📅 Calendar entries generated: ${mergedCalendar.length}`
          );

          // ========================================
          // REMOVE OLD ICAL ENTRIES
          // ========================================

          const oldICalCount =
            (listing.calendar || []).filter(
              (item) => item.source === "ical"
            ).length;

          console.log(
            `🗑️ Old iCal entries: ${oldICalCount}`
          );

          listing.calendar =
            (listing.calendar || []).filter(
              (item) => item.source !== "ical"
            );

          // ========================================
          // ADD NEW ICAL ENTRIES
          // ========================================

          listing.calendar.push(
            ...mergedCalendar
          );

          // ========================================
          // SAVE
          // ========================================

          await listing.save();

          const newICalCount =
            listing.calendar.filter(
              (item) => item.source === "ical"
            ).length;

          console.log(
            `💾 New iCal entries saved: ${newICalCount}`
          );

          console.log(
            `✅ ${propertyTitle} synced successfully`
          );

        } catch (err) {

          console.error(
            `❌ ${propertyTitle} sync failed`
          );

          console.error(
            "Error:",
            err.message
          );
        }
      }

      // ==========================================
      // CRON FINISHED
      // ==========================================

      const duration =
        Date.now() - start;

      console.log("\n========================================");
      console.log("✅ ICAL CRON FINISHED");
      console.log(
        `⏱️ Duration: ${duration} ms`
      );
      console.log("========================================\n");

    } catch (err) {

      console.error(
        "❌ ICAL CRON ERROR:",
        err
      );

    } finally {

      // ==========================================
      // RELEASE LOCK
      // ==========================================

      isSyncRunning = false;
    }
  });
};

export default startCalendarCron;