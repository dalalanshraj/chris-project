import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import { useMemo, useCallback } from "react";

export default function CalendarTab({ listingId }) {
  const [blockedDates, setBlockedDates] = useState([]);
  const [calendarSource, setCalendarSource] = useState("manual");
  const [icalUrl, setIcalUrl] = useState("");

  const [startDate, setStartDate] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [customerName, setCustomerName] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [guests, setGuests] = useState(1);

  const [comment, setComment] = useState("");

  // =====================================
  // FETCH DATES
  // =====================================

  useEffect(() => {
    if (listingId) {
      fetchDates();
    }
  }, [listingId]);

  const fetchDates = () => {
    api
      .get(`/calendar/${listingId}/calendar`)
      .then((res) => {
        setBlockedDates(res.data.calendar || []);

        const savedIcal = res.data.icalUrl || "";

        setIcalUrl(savedIcal);

        setCalendarSource(savedIcal ? "ical" : "manual");
      })
      .catch(console.log);
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
  // DAY TYPE
  // =====================================
  const formatLocalDate = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
  const blockedMap = useMemo(() => {
    const map = {};

    blockedDates.forEach((item) => {
      const d = new Date(item.date);

      const key = formatLocalDate(d);

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

    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate < today) {
      return "past-day";
    }

    const currentKey = formatLocalDate(currentDate);

    const statuses = blockedMap[currentKey] || [];

    const hasCIN = statuses.includes("CIN");

    const hasCOUT = statuses.includes("COUT");

    const hasR = statuses.includes("R");

    const hasH = statuses.includes("H");

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const nextKey = formatLocalDate(nextDay);

    const nextStatuses = blockedMap[nextKey] || [];

    if ((hasCOUT && nextStatuses.includes("CIN")) || (hasCIN && hasCOUT)) {
      return "turnover-day";
    }

    if (hasCIN) {
      return "checkin-day";
    }

    if (hasCOUT) {
      return "checkout-day";
    }

    if (hasR) {
      return "blocked-day";
    }

    if (hasH) {
      return "hold-day";
    }

    return "available-day";
  };
  // =====================================
  // MANUAL DATE SELECT
  // =====================================

  const handleDateSelect = (dates) => {
    if (calendarSource !== "manual") {
      return alert("Switch to Manual Calendar mode to create manual bookings.");
    }

    const [start, end] = dates;

    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      setShowModal(true);
    }
  };
  // =====================================
  // BLOCK DATES
  // =====================================

  const saveBooking = async () => {
    if (calendarSource !== "manual") {
      return alert("Manual bookings are disabled while iCal mode is active.");
    }
    try {
      await api.post(`/calendar/${listingId}/calendar/block`, {
        startDate,
        endDate,

        customerName,
        customerEmail,
        customerPhone,

        comment,
      });

      fetchDates();

      setShowModal(false);

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setComment("");

      alert("Booking Saved");
    } catch (err) {
      console.log(err);
    }
  };

  // =====================================
  // UNBLOCK DATES
  // =====================================

  const unblockDates = async () => {
    if (!startDate || !endDate) {
      return alert("Select date range");
    }

    try {
      await api.post(`/calendar/${listingId}/calendar/unblock`, {
        start: startDate,

        end: endDate,
      });

      alert("Dates unblocked");

      fetchDates();

      setStartDate(null);

      setEndDate(null);
    } catch (err) {
      console.log(err);

      alert("Unblock failed");
    }
  };

  // =====================================
  // IMPORT ICAL
  // =====================================

  const importICal = async () => {
    if (calendarSource !== "ical") {
      return alert("Please switch Calendar Mode to iCal first.");
    }
    if (!icalUrl.trim()) {
      return alert("Enter iCal URL");
    }

    try {
      await api.post(
        `/calendar/${listingId}/calendar/import-ical`,

        {
          url: icalUrl,
        },
      );

      alert("iCal imported successfully");

      fetchDates();
    } catch (err) {
      console.log(err);

      alert(err?.response?.data?.error || "iCal failed");
    }
  };
  const resetICal = async () => {
    try {
      await api.put(`/calendar/${listingId}/calendar/reset-ical`);

      alert("iCal reset successful");

      setIcalUrl("");

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
                setIcalUrl("");
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
          !icalUrl
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

                {!icalUrl && (
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
          icalUrl
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

                {icalUrl && (
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
              icalUrl
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            {icalUrl
              ? "🔗 iCal Sync Active — Manual booking disabled"
              : "📅 Manual Calendar Active — iCal import disabled"}
          </div>
        </div>
        <button
          onClick={clearCalendar}
          className="
    bg-red-600
    text-white
    py-3
    rounded-xl
    font-semibold
    hover:bg-red-700
  "
        >
          Reset Calendar
        </button>

        {/* ICAL SECTION */}
        {calendarSource === "ical" && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 mb-6">
            <input
              type="text"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="Paste iCal URL"
              className="
      w-full
      border
      border-gray-200
      rounded-xl
      px-4
      py-3
    "
            />

            <button
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
            </button>

            <button
              onClick={resetICal}
              className="
      bg-red-500
      text-white
      px-5
      py-3
      rounded-xl
    "
            >
              Reset
            </button>
          </div>
        )}

        {/* CALENDAR */}
        <div
          className="
          w-full
          overflow-x-auto
          rounded-2xl
          border border-gray-100
          bg-white
          shadow-inner
          p-3
        "
        >
          <DatePicker
            inline
            monthsShown={2}
            selectsRange
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
            <span className="w-4 h-4 rounded bg-[#d1fae5]"></span>
            Available
          </div>

          {/* BOOKED */}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-[#5C5CFF]"></span>
            Booked
          </div>

          {/* CHECK-IN */}
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border"
              style={{
                background: "linear-gradient(135deg, #5C5CFF 50%, #d1fae5 50%)",
              }}
            ></span>
            Check-Out
          </div>

          {/* CHECK-OUT */}
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border"
              style={{
                background: "linear-gradient(315deg, #5C5CFF 50%, #d1fae5 50%)",
              }}
            ></span>
            Check-In
          </div>

          {/* TURNOVER */}
          <div className="flex items-center gap-2">
            <span className="relative w-4 h-4 rounded bg-[#5C5CFF] overflow-hidden">
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
}.react-datepicker__month-container {
  padding: 40px;
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
   background: #d1fae5 !important; 
   color: black !important; 
   } 
   /* AVAILABLE */
   .react-datepicker__day.available-day 
   { 
   background: #d1fae5 !important; 
   color: black !important; 
   } 
   /* BOOKED */ 
   .react-datepicker__day.blocked-day { 
   background: #5C5CFF !important; 
   color: white !important; 
   }
    /* HOLD */ 
    .react-datepicker__day.hold-day { 
    background: #facc15 !important; 
    color: black !important; 
    } 
    /* CHECK-IN */ 
    .react-datepicker__day.checkin-day { 
    background: linear-gradient( 135deg, #d1fae5 50%, #5C5CFF 50% ) !important; 
    color: black !important; 
    } 
    /* CHECK-OUT */ 
    .react-datepicker__day.checkout-day { 
    background: linear-gradient( 315deg, #d1fae5 50%, #5C5CFF 50% ) !important; 
    color: black !important; 
    } 

   /* TURNOVER */
   
.react-datepicker__day.turnover-day {
  background: linear-gradient(
    135deg,
    #5C5CFF 0%,
    #5C5CFF 48%,
    #000 48%,
    #000 52%,
    #5C5CFF 52%,
    #5C5CFF 100%
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
  background: #d1fae5 !important;
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
            <h2 className="text-2xl font-bold mb-6">Create Booking</h2>

            <div className="space-y-4">
              <input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="
    w-full
    border
    p-3
    rounded-lg
  "
              />

              <input
                placeholder="Customer Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="
    w-full
    border
    p-3
    rounded-lg
  "
              />

              <input
                placeholder="Customer Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="
    w-full
    border
    p-3
    rounded-lg
  "
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  readOnly
                  value={startDate ? startDate.toLocaleDateString() : ""}
                  className="border p-3 rounded-lg"
                />

                <input
                  readOnly
                  value={endDate ? endDate.toLocaleDateString() : ""}
                  className="border p-3 rounded-lg"
                />
              </div>

              <textarea
                placeholder="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="
    w-full
    border
    p-3
    rounded-lg
  "
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="
    px-5
    py-3
    bg-gray-200
    rounded-lg
  "
              >
                Cancel
              </button>

              <button
                onClick={saveBooking}
                className="
    px-5
    py-3
    bg-blue-600
    text-white
    rounded-lg
  "
              >
                Save Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
