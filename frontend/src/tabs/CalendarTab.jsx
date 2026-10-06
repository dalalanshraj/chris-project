import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import { useMemo, useCallback } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
// import { toast } from "react-toastify";

export default function CalendarTab({ listingId }) {
  const [isMobile, setIsMobile] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [calendarSource, setCalendarSource] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [icalSources, setIcalSources] = useState([
    {
      name: "",
      url: "",
    },
  ]);

  const [startDate, setStartDate] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [comment, setComment] = useState("");
  const [manualBookings, setManualBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(false);

  const hasICal = icalSources.some((item) => item.url.trim() !== "");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // =====================================
  // FETCH DATES
  // =====================================

  useEffect(() => {
    if (listingId) {
      fetchDates();
    }
  }, [listingId]);

  useEffect(() => {
  if (
    calendarSource === "manual" &&
    startDate &&
    endDate &&
    !editingBooking
  ) {
    setShowModal(true);
  }
}, [
  startDate,
  endDate,
  calendarSource,
  editingBooking,
]);

  const fetchDates = async () => {
    try {
      const res = await api.get(`/calendar/${listingId}/calendar`);

      console.log("CALENDAR API RESPONSE:", res.data);
      console.log("MANUAL BOOKINGS:", res.data.manualBookings);

      setBlockedDates(res.data.calendar || []);

      setManualBookings(res.data.manualBookings || []);

      // बाकी existing code...
    } catch (err) {
      console.log(err);
    }
  };

  const saveICalSources = async () => {
    const validSources = icalSources.filter((item) => item.url.trim() !== "");

    await api.put(`/calendar/${listingId}/calendar/ical-sources`, {
      icalSources: validSources,
    });
  };

  const handleViewBooking = (booking) => {
    setViewBooking(booking);
  };

const handleEditBooking = (booking) => {
  setSelectedBooking(booking);

  setCustomerName(booking.customerName || "");
  setCustomerEmail(booking.customerEmail || "");
  setCustomerPhone(booking.customerPhone || "");
  setGuests(booking.guests || 1);
  setComment(booking.comment || "");

  setStartDate(
    booking.checkIn
      ? new Date(booking.checkIn)
      : null
  );

  setEndDate(
    booking.checkOut
      ? new Date(booking.checkOut)
      : null
  );

  setEditingBooking(true);
  setShowModal(true);
};
  const handleDeleteBooking = async (booking) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete the booking for ${
      booking.customerName || "this customer"
    }?`
  );

  if (!confirmed) return;

  try {
    setLoading(true);

    const res = await api.delete(
      `/calendar/${listingId}/manual-booking/${booking._id}`
    );

    console.log("DELETE RESPONSE:", res.data);

    setBlockedDates(res.data.calendar || []);
    setManualBookings(res.data.manualBookings || []);

    alert("Booking deleted successfully");
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);
    console.error("DELETE RESPONSE:", err.response?.data);

    alert(
      err.response?.data?.error ||
        "Failed to delete booking"
    );
  } finally {
    setLoading(false);
  }
};

  const updateSource = (index, value) => {
    const copy = [...icalSources];

    copy[index].url = value;

    setIcalSources(copy);
  };

  // =====================================
  // SAME DAY
  // =====================================

  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // =====================================
  // DATE INPUT HELPERS
  // =====================================

  // =====================================
  // FORM DATE HELPERS
  // =====================================

  const formatDateForInput = (date) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const parseDateInput = (value) => {
    if (!value) return null;

    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day, 12, 0, 0, 0);
  };

  // =====================================
  // FORM START DATE CHANGE
  // =====================================

  const handleStartDateChange = (e) => {
    const value = e.target.value;

    if (!value) {
      setStartDate(null);
      return;
    }

    const newStartDate = parseDateInput(value);

    setStartDate(newStartDate);

    // Agar existing end date start se pehle hai
    if (endDate && newStartDate > endDate) {
      setEndDate(null);
    }
  };

  // =====================================
  // FORM END DATE CHANGE
  // =====================================

  const handleEndDateChange = (e) => {
    const value = e.target.value;

    if (!value) {
      setEndDate(null);
      return;
    }

    const newEndDate = parseDateInput(value);

    // End date start date se pehle nahi ho sakti
    if (startDate && newEndDate < startDate) {
      alert("End date cannot be before start date");
      return;
    }

    setEndDate(newEndDate);
  };

  // =====================================
  // DAY TYPE
  // =====================================
  const TIMEZONE = "America/Chicago";

  const formatLocalDate = (date) => {
    if (!date) return "";

    if (typeof date === "string") {
      return date.substring(0, 10);
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };
  const blockedMap = useMemo(() => {
    const map = {};

    blockedDates.forEach((item) => {
      const key = formatLocalDate(item.date);

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(item.status);
    });

    return map;
  }, [blockedDates]);

  const getDateType = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = new Date(date);
    current.setHours(0, 0, 0, 0);

    const key = formatLocalDate(current);

    // Past
    if (current < today) {
      return "past-day";
    }

    const statuses = [...new Set(blockedMap[key] || [])];

    const hasR = statuses.includes("R");
    const hasH = statuses.includes("H");
    const hasCIN = statuses.includes("CIN");
    const hasCOUT = statuses.includes("COUT");

    // ----------------------------------------------------
    // TURNOVER (same day checkin + checkout)
    // ----------------------------------------------------

    if (hasCIN && hasCOUT) {
      return "turnover-day";
    }

    // ----------------------------------------------------
    // CHECK-IN
    // ----------------------------------------------------

    if (hasCIN) {
      return "checkin-day";
    }

    // ----------------------------------------------------
    // CHECK-OUT
    // ----------------------------------------------------

    if (hasCOUT) {
      return "checkout-day";
    }

    // ----------------------------------------------------
    // RESERVED
    // ----------------------------------------------------

    if (hasR) {
      return "blocked-day";
    }

    // ----------------------------------------------------
    // HOLD
    // ----------------------------------------------------

    if (hasH) {
      return "hold-day";
    }

    // ----------------------------------------------------
    // AVAILABLE
    // ----------------------------------------------------

    return "available-day";
  };
  // =====================================
  // MANUAL DATE SELECT
  // =====================================

  const resetBookingForm = () => {
  setCustomerName("");
  setCustomerEmail("");
  setCustomerPhone("");
  setGuests(1);
  setComment("");

  setEditingBooking(false);
  setSelectedBooking(null);
};
const handleDateSelect = (date) => {
  if (calendarSource !== "manual") {
    alert(
      "Switch to Manual Calendar mode to create manual bookings."
    );
    return;
  }

  if (!date) return;

  console.log("SELECTED DATE:", date);

  // Selected date = Check-in
  setStartDate(date);

  // Check-out initially empty
  setEndDate(null);

  // New booking
  setEditingBooking(false);
  setSelectedBooking(null);

  // Fresh form
  setCustomerName("");
  setCustomerEmail("");
  setCustomerPhone("");
  setGuests(1);
  setComment("");

  // OPEN MODAL IMMEDIATELY
  setShowModal(true);
};
  // =====================================
  // BLOCK DATES
  // =====================================

const saveBooking = async () => {
  if (calendarSource !== "manual") {
    return alert(
      "Manual bookings are disabled while iCal mode is active."
    );
  }

  if (!startDate || !endDate) {
    return alert("Please select check-in and check-out date");
  }

  if (endDate <= startDate) {
    return alert("Check-out must be after check-in");
  }

  try {
    setLoading(true);

    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      startDate: formatDateForInput(startDate),
      endDate: formatDateForInput(endDate),
      guests,
      comment,
    };

    let res;

    if (editingBooking && selectedBooking) {
      res = await api.put(
        `/calendar/${listingId}/manual-booking/${selectedBooking._id}`,
        payload
      );
    } else {
      res = await api.post(
        `/calendar/${listingId}/manual-booking`,
        payload
      );
    }

    console.log("BOOKING SAVED:", res.data);

    // IMPORTANT:
    // Fetch fresh calendar + manual bookings from database
    await fetchDates();

    setShowModal(false);
    setEditingBooking(false);
    setSelectedBooking(null);

    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setGuests(1);
    setComment("");

    setStartDate(null);
    setEndDate(null);

    alert(
      editingBooking
        ? "Booking updated successfully"
        : "Booking created successfully"
    );
  } catch (err) {
    console.error("SAVE BOOKING ERROR:", err);

    alert(
      err.response?.data?.error ||
        "Failed to save booking"
    );
  } finally {
    setLoading(false);
  }
};

  // =====================================
  // UNBLOCK DATES
  // =====================================

  const unblockDates = async () => {
    if (!startDate || !endDate) {
      return alert("Please select blocked dates");
    }

    const confirmed = window.confirm(
      "Are you sure you want to unblock these dates?",
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await api.post(`/calendar/${listingId}/calendar/unblock`, {
        startDate,
        endDate,
      });

      console.log("UNBLOCK RESPONSE:", res.data);

      setBlockedDates(res.data.calendar || []);

      setStartDate(null);
      setEndDate(null);

      alert("Dates unblocked successfully");
    } catch (err) {
      console.error("UNBLOCK ERROR:", err);
      alert(err.response?.data?.error || "Failed to unblock dates");
    } finally {
      setLoading(false);
    }
  };
  // =====================================
  // IMPORT ICAL
  // =====================================

  // const importICal = async () => {
  //   if (calendarSource !== "ical") {
  //     return alert("Please switch Calendar Mode to iCal first.");
  //   }
  //  if (!hasICal) {
  // return alert("Enter at least one iCal URL");
  //   }

  //   try {
  //     await api.post(
  //       `/calendar/${listingId}/calendar/import-ical`,

  //       {
  //         url: hasICal,
  //       },
  //     );

  //     alert("iCal imported successfully");

  //     fetchDates();
  //   } catch (err) {
  //     console.log(err);

  //     alert(err?.response?.data?.error || "iCal failed");
  //   }
  // };
  const resetICal = async () => {
    try {
      await api.put(`/calendar/${listingId}/calendar/reset-ical`);

      alert("iCal reset successful");

      setIcalSources([
        { name: "Airbnb", url: "" },
        { name: "VRBO", url: "" },
        { name: "Florida", url: "" },
        { name: "OwnerRez", url: "" },
      ]);

      fetchDates();
    } catch (err) {
      console.log(err);

      alert("Reset failed");
    }
  };

  const clearCalendar = async () => {
    const confirmReset = window.confirm(
      "Are you sure? This will remove all bookings.",
    );

    if (!confirmReset) return;

    try {
      await api.put(`/calendar/${listingId}/calendar/clear`);

      alert("Calendar reset successfully");

      fetchDates();
    } catch (err) {
      console.log(err);

      alert("Reset failed");
    }
  };

  const isSelectableDate = (date) => {
    const key = formatLocalDate(date);

    const statuses = blockedMap[key] || [];

    const hasR = statuses.includes("R");
    const hasCIN = statuses.includes("CIN");
    const hasCOUT = statuses.includes("COUT");

    // Turnover date allow
    if (hasCIN && hasCOUT) return true;

    // Checkout date allow
    if (hasCOUT) return true;

    // Reserved day block
    if (hasR) return false;

    return true;
  };

  const mergeICal = async () => {
    try {
      setLoading(true);

      await api.post(`/calendar/${listingId}/calendar/merge-ical`);

      await fetchDates();
    } catch (err) {
      console.error(err);

      console.error(err.response?.data?.message || "Failed to merge calendars");
    } finally {
      setLoading(false);
    }
  };
  const addICalSource = () => {
    setIcalSources((prev) => [
      ...prev,
      {
        name: "",
        url: "",
      },
    ]);
  };

  const removeICalSource = (index) => {
    setIcalSources((prev) => prev.filter((_, i) => i !== index));
  };

  // const updateSource = (index, field, value) => {
  //   const copy = [...icalSources];
  //   copy[index][field] = value;
  //   setIcalSources(copy);
  // };

  return (
    <div className="w-full flex justify-center px-3 sm:px-6 py-10 bg-[#f8fafc]">
      {/* CARD */}
      <div
        className="
        w-full
        max-w-[900px]
        
        border border-gray-100
        rounded-3xl
        shadow-2xl
        p-4 sm:p-6
      "
      >
        {/* HEADER */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Calendar Source
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MANUAL */}
            <button
              type="button"
              onClick={() => {
                setCalendarSource("manual");
                setStartDate(null);
                setEndDate(null);
              }}
              className={`
        relative
        rounded-2xl
        border-2
        p-5
        text-left
        transition-all
        duration-300
        hover:shadow-lg
        ${
          !hasICal
            ? "border-green-500 bg-green-50 shadow-md scale-[1.02]"
            : "border-gray-200 bg-white hover:border-green-300"
        }
      `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    📅 Manual Calendar
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Manage bookings manually
                  </p>
                </div>

                {!hasICal && (
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                )}
              </div>
            </button>

            {/* ICAL */}
            <button
              type="button"
              onClick={() => {
                setCalendarSource("ical");
                setStartDate(null);
                setEndDate(null);
              }}
              className={`
        relative
        rounded-2xl
        border-2
        p-5
        text-left
        transition-all
        duration-300
        hover:shadow-lg
        ${
          hasICal
            ? "border-blue-500 bg-blue-50 shadow-md scale-[1.02]"
            : "border-gray-200 bg-white hover:border-blue-300"
        }
      `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    🔗 iCal Sync
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Sync Airbnb / VRBO calendar
                  </p>
                </div>

                {hasICal && (
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* STATUS */}
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium border ${
              hasICal
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            {hasICal
              ? "🔗 iCal Sync Active — Manual booking disabled"
              : "📅 Manual Calendar Active — iCal import disabled"}
          </div>
        </div>

        {/* ICAL SECTION */}
        {calendarSource === "ical" && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 mb-6">
            <div className="space-y-4">
              {icalSources.map((item, index) => (
                <div key={index}>
                  <label className="block text-sm font-semibold mb-2">
                    {item.name} URL
                  </label>

                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => updateSource(index, e.target.value)}
                    placeholder={`Paste ${item.name} iCal URL`}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>
              ))}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={saveICalSources}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
                >
                  Save URLs
                </button>

                <button
                  onClick={mergeICal}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Merging..." : "Merge Calendars"}
                </button>

                <button
                  onClick={resetICal}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700"
                >
                  Reset
                </button>
              </div>
            </div>
            {/* <button
              onClick={importICal}
              className="
      bg-blue-600
      text-white
      px-5
      py-3
      rounded-xl
    "
            >
              Import
            </button> */}
            {/* <button
              onClick={saveICalSources}
              className="
    bg-blue-600
    text-white
    px-6
    py-3
    rounded-xl
  "
            >
              Save iCal URLs
            </button> */}
            {/* <button
              onClick={mergeICal}
              disabled={loading}
              className="
    bg-green-600
    text-white
    px-6
    py-3
    rounded-xl
    hover:bg-green-700
    disabled:opacity-50
  "
            >
              {loading ? "Merging..." : "Merge Calendars"}
            </button> */}

            <button></button>
          </div>
        )}

        {/* CALENDAR */}
        <div
          className="
    w-full
    overflow-x-auto
    rounded-2xl
    border
    border-gray-100
    bg-white
    shadow-inner
    p-2
    sm:p-3
  "
        >
<DatePicker
  inline
  monthsShown={isMobile ? 1 : 2}
  selected={startDate}
  startDate={startDate}
  endDate={endDate}
  onChange={handleDateSelect}
  minDate={new Date()}
  dayClassName={getDateType}
  showOtherMonths={false}
  showPopperArrow={false}
  filterDate={(date) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const current = new Date(date);

    current.setHours(0, 0, 0, 0);

    return current >= today && isSelectableDate(date);
  }}
/>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap justify-center gap-5 mt-8">
          {/* AVAILABLE */}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-[#FFE7E7]"></span>
            Available
          </div>

          {/* BOOKED */}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-[#ADB8D6]"></span>
            Booked
          </div>

          {/* CHECK-IN */}
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border"
              style={{
                background: "linear-gradient(135deg, #ADB8D6 50%, #FFE7E7 50%)",
              }}
            ></span>
            Check-Out
          </div>

          {/* CHECK-OUT */}
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border"
              style={{
                background: "linear-gradient(315deg, #ADB8D6 50%, #FFE7E7 50%)",
              }}
            ></span>
            Check-In
          </div>

          {/* TURNOVER */}
          <div className="flex items-center gap-2">
            <span className="relative w-4 h-4 rounded bg-[#ADB8D6] overflow-hidden">
              <span className="absolute w-[140%] h-[2px] bg-black top-1/2 left-[-20%] rotate-135"></span>
            </span>
            Turnover
          </div>

          {/* HOLD */}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-yellow-400"></span>
            Hold
          </div>
        </div>
        {/* =========================================
    MANUAL BOOKINGS
========================================= */}
        <div className="mt-10">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Manual Bookings
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Manage your manually created reservations
              </p>
            </div>

            <div className="self-start sm:self-auto">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                {manualBookings.length} Booking
                {manualBookings.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* EMPTY STATE */}
          {manualBookings.length === 0 ? (
            <div
              className="
      border
      border-dashed
      border-gray-300
      rounded-2xl
      p-8
      sm:p-12
      text-center
      bg-gray-50
    "
            >
              <div className="text-4xl mb-3">📅</div>

              <h3 className="text-lg font-semibold text-gray-700">
                No Manual Bookings
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Bookings created from the calendar will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* =====================================
          DESKTOP TABLE
      ===================================== */}
              <div
                className="
        hidden
        md:block
        overflow-hidden
        border
        border-gray-200
        rounded-2xl
        bg-white
        shadow-sm
      "
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {/* TABLE HEADER */}
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-4 font-semibold text-gray-600">
                          Customer
                        </th>

                        <th className="text-left px-5 py-4 font-semibold text-gray-600">
                          Check-In
                        </th>

                        <th className="text-left px-5 py-4 font-semibold text-gray-600">
                          Check-Out
                        </th>

                        {/* <th className="text-center px-5 py-4 font-semibold text-gray-600">
                          Guests
                        </th> */}

                        <th className="text-center px-5 py-4 font-semibold text-gray-600">
                          Nights
                        </th>

                        <th className="text-left px-5 py-4 font-semibold text-gray-600">
                          Status
                        </th>

                        <th className="text-center px-5 py-4 font-semibold text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    {/* TABLE BODY */}
                    <tbody>
                      {manualBookings.map((booking) => (
                        <tr
                          key={booking._id}
                          className="
                    border-b
                    border-gray-100
                    last:border-b-0
                    hover:bg-gray-50
                    transition
                  "
                        >
                          {/* CUSTOMER */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="
                        w-10
                        h-10
                        rounded-full
                        bg-blue-100
                        text-blue-700
                        flex
                        items-center
                        justify-center
                        font-bold
                        shrink-0
                      "
                              >
                                {(booking.customerName || "N")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div
                                  className="
                          font-semibold
                          text-gray-800
                          truncate
                          max-w-[180px]
                        "
                                >
                                  {booking.customerName || "No Name"}
                                </div>

                                {booking.customerEmail && (
                                  <div
                                    className="
                            text-xs
                            text-gray-500
                            truncate
                            max-w-[180px]
                            mt-0.5
                          "
                                  >
                                    {booking.customerEmail}
                                  </div>
                                )}

                                {booking.customerPhone && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {booking.customerPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* CHECK IN */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-gray-800 font-medium">
                              {booking.checkIn
                                ? new Date(booking.checkIn).toLocaleDateString()
                                : "-"}
                            </div>
                          </td>

                          {/* CHECK OUT */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-gray-800 font-medium">
                              {booking.checkOut
                                ? new Date(
                                    booking.checkOut,
                                  ).toLocaleDateString()
                                : "-"}
                            </div>
                          </td>

                          {/* GUESTS
                          <td className="px-5 py-4 text-center">
                            <span className="font-medium text-gray-700">
                              {booking.guests || 0}
                            </span>
                          </td> */}

                          {/* NIGHTS */}
                          <td className="px-5 py-4 text-center">
                            <span className="font-medium text-gray-700">
                              {booking.nights || 0}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <span
                              className={`
                        inline-flex
                        items-center
                        px-3
                        py-1.5
                        rounded-full
                        text-xs
                        font-semibold
                        capitalize

                        ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      `}
                            >
                              {booking.status || "confirmed"}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {/* VIEW */}
                              <button
                                type="button"
                                onClick={() => handleViewBooking(booking)}
                                title="View Booking"
                                className="
                          px-3
                          py-2
                          rounded-lg
                          border
                          border-gray-200
                          bg-white
                          text-gray-700
                          hover:bg-gray-100
                          transition
                          text-xs
                          font-semibold
                        "
                              >
                                 View
                              </button>

                              {/* EDIT */}
                              <button
                                type="button"
                                onClick={() => handleEditBooking(booking)}
                                title="Edit Booking"
                                className="
                          px-3
                          py-2
                          rounded-lg
                          bg-blue-600
                          text-white
                          hover:bg-blue-700
                          transition
                          text-xs
                          font-semibold
                        "
                              >
                                 Edit
                              </button>

                              {/* DELETE */}
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(booking)}
                                title="Delete Booking"
                                className="
                          px-3
                          py-2
                          rounded-lg
                          bg-red-600
                          text-white
                          hover:bg-red-700
                          transition
                          text-xs
                          font-semibold
                        "
                              >
                                 Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* =====================================
          MOBILE CARDS
      ===================================== */}
              <div className="md:hidden space-y-4">
                {manualBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="
              bg-white
              border
              border-gray-200
              rounded-2xl
              p-4
              shadow-sm
            "
                  >
                    {/* CUSTOMER HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="
                  w-11
                  h-11
                  rounded-full
                  bg-blue-100
                  text-blue-700
                  flex
                  items-center
                  justify-center
                  font-bold
                  shrink-0
                "
                        >
                          {(booking.customerName || "N")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h3
                            className="
                    font-semibold
                    text-gray-800
                    truncate
                  "
                          >
                            {booking.customerName || "No Name"}
                          </h3>

                          {booking.customerEmail && (
                            <p
                              className="
                      text-xs
                      text-gray-500
                      truncate
                    "
                            >
                              {booking.customerEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* STATUS */}
                      <span
                        className={`
                  shrink-0
                  inline-flex
                  px-2.5
                  py-1
                  rounded-full
                  text-[11px]
                  font-semibold
                  capitalize

                  ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }
                `}
                      >
                        {booking.status || "confirmed"}
                      </span>
                    </div>

                    {/* PHONE */}
                    {booking.customerPhone && (
                      <div
                        className="
                mt-4
                text-sm
                text-gray-600
              "
                      >
                        📞 {booking.customerPhone}
                      </div>
                    )}

                    {/* DATE INFO */}
                    <div
                      className="
              grid
              grid-cols-2
              gap-3
              mt-4
            "
                    >
                      <div
                        className="
                bg-gray-50
                rounded-xl
                p-3
              "
                      >
                        <p className="text-xs text-gray-500 mb-1">Check-In</p>

                        <p className="text-sm font-semibold text-gray-800">
                          {booking.checkIn
                            ? new Date(booking.checkIn).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>

                      <div
                        className="
                bg-gray-50
                rounded-xl
                p-3
              "
                      >
                        <p className="text-xs text-gray-500 mb-1">Check-Out</p>

                        <p className="text-sm font-semibold text-gray-800">
                          {booking.checkOut
                            ? new Date(booking.checkOut).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* GUEST / NIGHTS */}
                    <div
                      className="
              grid
              grid-cols-2
              gap-3
              mt-3
            "
                    >
                      <div
                        className="
                border
                border-gray-100
                rounded-xl
                p-3
              "
                      >
                        <p className="text-xs text-gray-500">Guests</p>

                        <p className="font-semibold text-gray-800 mt-1">
                          {booking.guests || 0}
                        </p>
                      </div>

                      <div
                        className="
                border
                border-gray-100
                rounded-xl
                p-3
              "
                      >
                        <p className="text-xs text-gray-500">Nights</p>

                        <p className="font-semibold text-gray-800 mt-1">
                          {booking.nights || 0}
                        </p>
                      </div>
                    </div>

                    {/* COMMENT */}
                    {booking.comment && (
                      <div
                        className="
                mt-3
                bg-gray-50
                rounded-xl
                p-3
              "
                      >
                        <p className="text-xs text-gray-500 mb-1">Comment</p>

                        <p className="text-sm text-gray-700">
                          {booking.comment}
                        </p>
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div
                      className="
              grid
              grid-cols-3
              gap-2
              mt-4
            "
                    >
                      {/* VIEW */}
                      <button
                        type="button"
                        onClick={() => {
                          console.log("VIEW BOOKING:", booking);
                        }}
                        className="
                  px-3
                  py-2.5
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  text-gray-700
                  hover:bg-gray-50
                  text-xs
                  font-semibold
                "
                      >
                         View
                      </button>

                      {/* EDIT */}
                      <button
                        type="button"
                        onClick={() => {
                          console.log("EDIT BOOKING:", booking);
                        }}
                        className="
                  px-3
                  py-2.5
                  rounded-xl
                  bg-blue-600
                  text-white
                  hover:bg-blue-700
                  text-xs
                  font-semibold
                "
                      >
                         Edit
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => {
                          console.log("DELETE BOOKING:", booking);
                        }}
                        className="
                  px-3
                  py-2.5
                  rounded-xl
                  bg-red-600
                  text-white
                  hover:bg-red-700
                  text-xs
                  font-semibold
                "
                      >
                         Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS */}
      <style>{`
      .react-datepicker__day {
  transition: all 0.25s ease;
}

.react-datepicker__day:hover {
  transform: scale(1.15);
  z-index: 10;
}

.react-datepicker__day.available-day:hover {
  box-shadow: 0 0 12px rgba(34,197,94,.4);
}

.react-datepicker__day.blocked-day:hover,
.react-datepicker__day.checkin-day:hover,
.react-datepicker__day.checkout-day:hover,
.react-datepicker__day.turnover-day:hover {
  transform: scale(1.12);
  filter: brightness(1.08);
}
  .react-datepicker__day--in-range {
  background: #dbeafe !important;
  color: #111 !important;
}

.react-datepicker__day--range-start,
.react-datepicker__day--range-end {
  background: #2563eb !important;
  color: white !important;
  transform: scale(1.1);
}
.react-datepicker {
  width: 100% !important;
  border: none !important;
  font-family: inherit;
  background: transparent !important;

  display: flex !important;
  justify-content: center !important;
  align-items: flex-start !important;
}

/* Center the month calendars */
.react-datepicker__month-container {
  float: none !important;
  display: block !important;
}

/* Space between September and October */
.react-datepicker__month-container + .react-datepicker__month-container {
  margin-left: 12px !important;
} .react-datepicker__week 
 { display: flex; 
  justify-content: space-between; 
  } 
  .react-datepicker__day, .react-datepicker__day-name { 
  width: 36px; height: 36px; 
  line-height: 36px; 
  margin: 2px; 
  border-radius: 8px; 
  } 
  /* AVAILABLE */ 
  .react-datepicker__day.available-day {
   background: #FFE7E7 !important; 
   color: black !important; 
   } 
   /* AVAILABLE */
   .react-datepicker__day.available-day 
   { 
   background: #FFE7E7 !important; 
   color: black !important; 
   } 
   /* BOOKED */ 
   .react-datepicker__day.blocked-day { 
   background: #ADB8D6 !important; 
   color: white !important; 
   }
    /* HOLD */ 
    .react-datepicker__day.hold-day { 
    background: #facc15 !important; 
    color: black !important; 
    } 
    /* CHECK-IN */ 
    .react-datepicker__day.checkin-day { 
    background: linear-gradient( 135deg, #FFE7E7 50%, #ADB8D6 50% ) !important; 
    color: black !important; 
    } 
    /* CHECK-OUT */ 
    .react-datepicker__day.checkout-day { 
    background: linear-gradient( 315deg, #FFE7E7 50%, #ADB8D6 50% ) !important; 
    color: black !important; 
    } 

   /* TURNOVER */
   
.react-datepicker__day.turnover-day {
  background: linear-gradient(
    135deg,
    #ADB8D6 0%,
    #ADB8D6 48%,
    #000 48%,
    #000 52%,
    #ADB8D6 52%,
    #ADB8D6 100%
  ) !important;

  color: white !important;

  width: 36px !important;
  height: 36px !important;
  line-height: 36px !important;

  border-radius: 8px !important;
}
     .react-datepicker__day--outside-month { 
     visibility: hidden !important; 
     pointer-events: none !important; 
     } 
   .react-datepicker__day.past-day {
  background: #f1f1f1 !important;
  color: #94a3b8 !important;
  opacity: 0.7 !important;
  cursor: not-allowed !important;
}

    `}</style>
      {showModal && (
        <div
          className="
    fixed
    inset-0
    bg-black/50
    z-50
    flex
    items-center
    justify-center
  "
        >
          <div
            className="
    bg-white
    w-full
    max-w-2xl
    rounded-2xl
    p-6
  "
          >
            <h2 className="text-2xl font-bold mb-6">
              {editingBooking ? "Edit Booking" : "Create Booking"}
            </h2>

            <div className="space-y-4">
              {/* CUSTOMER NAME */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name
                </label>

                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="
        w-full
        border
        border-gray-300
        p-3
        rounded-lg
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      "
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Email
                </label>

                <input
                  type="email"
                  placeholder="Enter customer email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="
        w-full
        border
        border-gray-300
        p-3
        rounded-lg
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      "
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Phone
                </label>

                <input
                  type="tel"
                  placeholder="Enter customer phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="
        w-full
        border
        border-gray-300
        p-3
        rounded-lg
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      "
                />
              </div>

              {/* DATES */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

  {/* CHECK-IN */}
  <div>
    <label className=" flex gap-1 block text-sm font-semibold text-gray-700 mb-2">
      Check-In <FaRegCalendarAlt size={13} className="mt-1" />
    </label>

    <DatePicker
      selected={startDate}
      onChange={(date) => {
        setStartDate(date);

        // Agar new check-in check-out se baad hai
        if (endDate && date && date >= endDate) {
          setEndDate(null);
        }
      }}
      minDate={new Date()}
      dateFormat="MMM dd, yyyy"
      placeholderText="Select check-in date"
      className="w-full border border-gray-300 p-3 rounded-lg"
      wrapperClassName="w-full"
      showPopperArrow={false}
    />
  </div>

  {/* CHECK-OUT */}
  <div>
    <label className=" flex gap-1 block text-sm font-semibold text-gray-700 mb-2">
      Check-Out <FaRegCalendarAlt size={13} className="mt-1" />
    </label>

    <DatePicker
      selected={endDate}
      onChange={(date) => {
        if (startDate && date && date <= startDate) {
          alert("Check-out must be after check-in");
          return;
        }

        setEndDate(date);
      }}
      minDate={
        startDate
          ? new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate() + 1
            )
          : new Date()
      }
      dateFormat="MMM dd, yyyy"
      placeholderText="Select check-out date"
      className="w-full border border-gray-300 p-3 rounded-lg"
      wrapperClassName="w-full"
      showPopperArrow={false}
    />
  </div>

</div>
              {/* COMMENT */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment
                </label>

                <textarea
                  placeholder="Enter booking notes or comments"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="
        w-full
        border
        border-gray-300
        p-3
        rounded-lg
        resize-none
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      "
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 mt-6">
              <button
                type="button"
                  onClick={() => {
    setShowModal(false);
    resetBookingForm();
    setStartDate(null);
    setEndDate(null);
  }}
                className="
      px-5
      py-3
      bg-gray-200
      hover:bg-gray-300
      rounded-lg
      font-semibold
    "
              >
                Cancel
              </button>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveBooking}
                  disabled={!startDate || !endDate || loading}
                  className="
        px-5
        py-3
        bg-blue-600
        hover:bg-blue-700
        disabled:opacity-50
        text-white
        rounded-lg
        font-semibold
      "
                >
                  {loading ? "Saving..." : "Save Booking"}
                </button>

                {startDate && endDate && (
                  <button
                    type="button"
                    onClick={unblockDates}
                    disabled={loading}
                    className="
          px-5
          py-3
          bg-red-600
          hover:bg-red-700
          disabled:opacity-50
          text-white
          rounded-lg
          font-semibold
        "
                  >
                    {loading ? "Unblocking..." : "Unblock Dates"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {viewBooking && (
  <div className="
    fixed
    inset-0
    z-[60]
    bg-black/50
    flex
    items-center
    justify-center
    p-4
  ">

    <div className="
      w-full
      max-w-lg
      bg-white
      rounded-2xl
      shadow-2xl
      overflow-hidden
    ">

      {/* HEADER */}
      <div className="
        px-5
        sm:px-6
        py-4
        border-b
        flex
        items-center
        justify-between
      ">

        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Booking Details
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Reservation information
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewBooking(null)}
          className="
            w-9
            h-9
            rounded-full
            bg-gray-100
            hover:bg-gray-200
            text-gray-600
            text-xl
          "
        >
          ×
        </button>

      </div>


      {/* CONTENT */}
      <div className="p-5 sm:p-6 space-y-4">

        {/* CUSTOMER */}
        <div className="
          bg-gray-50
          rounded-xl
          p-4
        ">
          <p className="text-xs text-gray-500">
            Customer
          </p>

          <p className="text-lg font-semibold text-gray-800 mt-1">
            {viewBooking.customerName || "No Name"}
          </p>
        </div>


        {/* EMAIL */}
        {viewBooking.customerEmail && (
          <div>
            <p className="text-xs text-gray-500">
              Email
            </p>

            <p className="text-sm font-medium text-gray-800 mt-1 break-all">
              {viewBooking.customerEmail}
            </p>
          </div>
        )}


        {/* PHONE */}
        {viewBooking.customerPhone && (
          <div>
            <p className="text-xs text-gray-500">
              Phone
            </p>

            <p className="text-sm font-medium text-gray-800 mt-1">
              {viewBooking.customerPhone}
            </p>
          </div>
        )}


        {/* DATES */}
        <div className="
          grid
          grid-cols-2
          gap-3
        ">

          <div className="
            border
            border-gray-200
            rounded-xl
            p-3
          ">
            <p className="text-xs text-gray-500">
              Check-In
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {viewBooking.checkIn
                ? new Date(
                    viewBooking.checkIn
                  ).toLocaleDateString()
                : "-"}
            </p>
          </div>


          <div className="
            border
            border-gray-200
            rounded-xl
            p-3
          ">
            <p className="text-xs text-gray-500">
              Check-Out
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {viewBooking.checkOut
                ? new Date(
                    viewBooking.checkOut
                  ).toLocaleDateString()
                : "-"}
            </p>
          </div>

        </div>


        {/* GUEST / NIGHTS */}
        <div className="
          grid
          grid-cols-2
          gap-3
        ">

           <div className="
            bg-gray-50
            rounded-xl
            p-3
          ">
             <div>
          <p className="text-xs text-gray-500 mb-2">
            Status
          </p>

          <span className="
            inline-flex
            px-3
            py-1.5
            rounded-full
            bg-green-100
            text-green-700
            text-xs
            font-semibold
            capitalize
          ">
            {viewBooking.status || "confirmed"}
          </span>
        </div>
          </div>  


          <div className="
            bg-gray-50
            rounded-xl
            p-3
          ">
            <p className="text-xs text-gray-500">
              Nights
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {viewBooking.nights || 0}
            </p>
          </div>

        </div>


        {/* STATUS */}
        


        {/* COMMENT */}
        {viewBooking.comment && (
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Comment
            </p>

            <div className="
              bg-gray-50
              rounded-xl
              p-3
              text-sm
              text-gray-700
              whitespace-pre-wrap
            ">
              {viewBooking.comment}
            </div>
          </div>
        )}

      </div>


      {/* FOOTER */}
      <div className="
        px-5
        sm:px-6
        py-4
        border-t
        flex
        flex-col-reverse
        sm:flex-row
        sm:justify-end
        gap-2
      ">

        <button
          type="button"
          onClick={() => setViewBooking(null)}
          className="
            px-5
            py-2.5
            rounded-xl
            bg-gray-100
            hover:bg-gray-200
            text-gray-700
            font-semibold
          "
        >
          Close
        </button>

        <button
          type="button"
          onClick={() => {
            const booking = viewBooking;

            setViewBooking(null);

            handleEditBooking(booking);
          }}
          className="
            px-5
            py-2.5
            rounded-xl
            bg-blue-600
            hover:bg-blue-700
            text-white
            font-semibold
          "
        >
           Edit Booking
        </button>

      </div>

    </div>

  </div>
)}
    </div>
    
  );
  
}
