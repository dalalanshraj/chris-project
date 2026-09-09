 import React, { useEffect, useState } from "react";
import { useModal } from "../context/ModalContext";
import { useParams } from "react-router-dom";
import api from "../api/axios.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import PropertyGallery from "../components/PropertyGallery";
import ReviewModal from "../components/ReviewModal";
import BookingPreviewModal from "../components/BookingModal";
import ProCalendar from "../components/ProCalendar.jsx";

import { MdFamilyRestroom, MdOutlineDoorBack } from "react-icons/md";
import { LuBath } from "react-icons/lu";
import { IoHome } from "react-icons/io5";

import { amenitiesData } from "../amenitiesData.js";
import { activitiesData } from "../activitiesData.js";
import InquiryModal from "../components/InquiryModal.jsx";
import DisplayCalendar from "../components/miniCalendar.jsx";
import PropertyminiCalendar from "../components/PropertyminiCalendar.jsx";

const PropertyDetail = () => {
  const { showModal } = useModal();
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openReview, setOpenReview] = useState(false);
  const [openBooking, setOpenBooking] = useState(false);

  const [checkIn, setCheckIn] = useState(null);
    const [owner, setOwner] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [openInquiry, setOpenInquiry] = useState(false);
  const [calendarData, setCalendarData] = useState([]);

  // ================= FETCH LISTING =================
  // ================= FETCH LISTING =================
  useEffect(() => {
    api
      .get(`/listings/${id}`)
      .then((res) => {
        setListing(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api
      .get(`/profile/public/6a0fa7b07591f49c6ad3eed6`)
      .then((res) => setOwner(res.data));
  }, []);

  // ================= FETCH CALENDAR =================
  useEffect(() => {
    api.get(`/listings/${id}/calendar`).then((res) => {
      const ranges = res.data.icalRanges || [];

      const blocked = [];

      ranges.forEach((r) => {
        const start = new Date(r.start);
        const end = new Date(r.end);

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const dt = new Date(d);
          dt.setHours(0, 0, 0, 0);
          blocked.push(new Date(dt));
        }
      });

      setBlockedDates(blocked);
    });
  }, [id]);

  const getDateKey = (date) => {
    const d = new Date(date);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getRateForDate = (date) => {
    if (!listing?.rates?.length || !date) return null;

    const currentKey = getDateKey(date);

    

    return listing.rates.find((rate) => {
      const fromKey = getDateKey(rate.from);
      const toKey = getDateKey(rate.to);

      return currentKey >= fromKey && currentKey <= toKey;
    });
  };

  const getMinNightsForDate = (date) => {
    const rate = getRateForDate(date);

    return rate ? Number(rate.minNights || 1) : null;
  };

  // 🔹 useEffect
  // useEffect(() => {
  //   if (checkIn && checkOut && listing) {
  //     const minNights = getMinNightsForDate(checkIn);

  //     const diff = (checkOut - checkIn) / (1000 * 60 * 60 * 24);

  //     if (diff < minNights) {
  //       const newDate = new Date(checkIn);
  //       newDate.setDate(newDate.getDate() + minNights);
  //       setCheckOut(newDate);
  //     }
  //   }
  // }, [checkIn, checkOut, listing]);

  if (loading) return <p className="p-10">Loading...</p>;
  if (!listing) return <p className="p-10">Property not found</p>;

  // ================= IMAGES =================
  const imageUrls = listing.photos || [];
  // ================= REVIEWS =================
  const publishedReviews =
    listing.reviews?.filter((r) => r.published === true) || [];

  // ================= YOUTUBE =================
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    if (url.includes("embed")) return url;
    if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/");
    if (url.includes("youtu.be/"))
      return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
    return null;
  };

  // ================= MAP =================
  const getMapEmbedUrl = (lat, lng) => {
    const finalLat = Number(lat);
    const finalLng = Number(lng);

    return `https://maps.google.com/maps?q=${finalLat},${finalLng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };
  const formatDate = (date) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const fetchPricing = async (start, end) => {
    if (!start || !end) {
      setPricing(null);
      return;
    }

    try {
      setPricingLoading(true);

      const res = await api.post("/bookings/preview", {
        propertyId: id,
        checkIn: formatDate(start),
        checkOut: formatDate(end),
      });

      setPricing(res.data);
    } catch (err) {
      console.error("PRICING ERROR:", err.response?.data || err.message);
      setPricing(null);
    } finally {
      setPricingLoading(false);
    }
  };
  // ================= MIN NIGHT AUTO FIX =================
  // 🔹 single function

  return (
    <>
      {/* GALLERY */}
      <PropertyGallery images={imageUrls} />

      <div className="max-w-7xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
        {/* LEFT */}
       <div className="order-2 lg:order-1 lg:col-span-2 bg-white rounded-3xl shadow-lg p-6 md:p-10">
          <p className="text-gray-500 text-sm mb-2">
            {listing.location?.address || "Location"}
          </p>

          <h1 className="text-4xl font-bold mb-4">{listing.property?.title}</h1>

          {/* ICONS */}
          <div className="flex gap-20 mb-6 flex-wrap">
            <div className="text-center">
              <MdFamilyRestroom className="text-3xl mx-auto" />
              <p>Sleeps {listing.property?.maxSleeps}</p>
            </div>

            <div className="text-center">
              <MdOutlineDoorBack className="text-3xl mx-auto" />
              <p>Bedrooms {listing.property?.bedrooms}</p>
            </div>

            <div className="text-center">
              <LuBath className="text-3xl mx-auto" />
              <p>Bathrooms {listing.property?.bathrooms}</p>
            </div>

            <div className="text-center">
              <IoHome className="text-3xl mx-auto" />
              <p>{listing.property?.category}</p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <h2 className="text-2xl font-semibold mb-2">Description</h2>
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: listing.description }}
          />

          {/* AMENITIES */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">Amenities</h2>
          {amenitiesData.map((section) => {
            const selected = section.options.filter(
              (item) => listing.amenities?.[item],
            );
            if (selected.length === 0) return null;

            return (
              <div key={section.title} className="mb-6">
                <h5 className="bg-[#2f9bad] text-white p-2 rounded-xl text-lg mb-2">
                  {section.title}
                </h5>

                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 list-disc ml-6">
                  {selected.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
          {/* Activities */}

          {activitiesData.map((section) => {
            const selected = section.options.filter(
              (item) => listing.activities?.[item],
            );
            if (selected.length === 0) return null;

            return (
              <div key={section.title} className="mb-6">
                <h2 className="text-2xl font-semibold mt-8 mb-4">Activities</h2>
                <h5 className="bg-[#2f9bad] text-white p-2 rounded-xl text-lg mb-2">
                  {section.title}
                </h5>

                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 list-disc ml-6">
                  {selected.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* VIDEO */}
          {listing.video?.youtube && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Property Video</h2>
              <iframe
                src={getYoutubeEmbed(listing.video.youtube)}
                className="w-full h-80 rounded-xl border"
                allowFullScreen
                title="video"
              />
            </div>
          )}

          {/* MAP */}
          {listing?.location?.lat && listing?.location?.lng && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Location</h2>

              <iframe
                src={getMapEmbedUrl(listing.location.lat, listing.location.lng)}
                className="w-full h-96 rounded-xl border"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Property Location"
              />
            </div>
          )}

          {/* REVIEWS */}
          {publishedReviews.length > 0 && (
            <div className="mt-14">
              <h2 className="text-2xl font-semibold mb-6">
                Guest Reviews ({publishedReviews.length})
              </h2>

              {publishedReviews.map((review) => (
                <div key={review._id} className="mb-8">
                  <div className=" rounded-xl p-6 bg-gray-50">
                    {/* ⭐ RATING */}
                    <div className="text-yellow-500 text-lg mb-2">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>

                    {/* TITLE */}
                    <h4 className="font-semibold text-lg">{review.title}</h4>

                    {/* MESSAGE */}
                    <p className="text-gray-700 mt-2">{review.message}</p>
                    <div className="flex">
                      <p className="text-gray-700 mt-2">-{review.name}</p>
                      <p className="mt-2 mx-3">
                        {review.stayDate
                          ? new Date(review.stayDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    {/* 🔥 ADMIN REPLY (ADD THIS) */}
                    {review.reply && (
                      <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                        <p className="text-sm font-semibold text-green-700 mb-1">
                          Owner Reply
                        </p>
                        <p className="text-gray-700 text-sm">{review.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setOpenReview(true)}
            className="mt-6 bg-[#FFE8BE] text-black px-6 py-2 rounded"
          >
            Write a Review
          </button>

          {openReview && (
            <ReviewModal listingId={id} onClose={() => setOpenReview(false)} />
          )}
        </div>

        {/* RIGHT BOOKING */}
        {/* CALENDAR */}

        <div className="order-1 lg:order-2 lg:col-span-1">
              <div
              className="
        relative
        pt-20
        pb-10
        px-8
        bg-gradient-to-br
        from-[#0c8b8d]
        via-[#1587d6]
        to-[#2557e5]
        text-white
      "
            >
              {/* IMAGE */}

              <div
                className="
          absolute
          top-0
          translate-y-[-50%]
          left-1/2
          -translate-x-1/2
          w-24
          h-24
          rounded-full
          overflow-hidden
          border-[5px]
          border-white
          shadow-2xl
          bg-white
        "
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}${owner?.photo}`}
                  alt={owner?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <p
                className="
          text-center
          uppercase
          tracking-[5px]
          text-xs
          text-white/80
        "
              >
                Property Host
              </p>

              <h2
                className="
          mt-2
          text-center
          text-3xl
          font-bold
        "
              >
                {owner?.name}
              </h2>
            </div>
          <div className="lg:sticky lg:top-6 self-start bg-white rounded-2xl shadow p-6 space-y-5">
            <div className="flex gap-2">
              <DatePicker
                selected={checkIn}
                onChange={(date) => {
                  if (!date) {
                    setCheckIn(null);
                    setCheckOut(null);
                    setPricing(null);
                    return;
                  }

                  const rate = getRateForDate(date);

                  if (!rate) {
                    showModal("No rate available for selected date");
                    setCheckIn(null);
                    setCheckOut(null);
                    setPricing(null);
                    return;
                  }

                  setCheckIn(date);
                  setCheckOut(null);
                  setPricing(null);
                }}
                // excludeDates={blockedDates}
                placeholderText="Check-in"
                minDate={new Date()}
                className="border p-3 rounded w-full"
              />

              <DatePicker
                selected={checkOut}
                onChange={(date) => {
                  if (!date || !checkIn) return;

                  const minNights = Number(getMinNightsForDate(checkIn) || 1);

                  const start = new Date(checkIn);
                  const end = new Date(date);

                  start.setHours(12, 0, 0, 0);
                  end.setHours(12, 0, 0, 0);

                  const nights = Math.round(
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                  );

                  console.log("DATE CHECK:", {
                    checkIn: getDateKey(start),
                    checkOut: getDateKey(end),
                    nights,
                    minNights,
                  });

                  // Minimum nights validation
                  if (nights < minNights) {
                    showModal(`Minimum ${minNights} nights stay required`);

                    setCheckOut(null);
                    setPricing(null);
                    return;
                  }

                  // Check every night has a rate
                  for (
                    let d = new Date(start);
                    d < end;
                    d.setDate(d.getDate() + 1)
                  ) {
                    if (!getRateForDate(d)) {
                      showModal(
                        "Selected dates are not available for the complete stay",
                      );

                      setCheckOut(null);
                      setPricing(null);
                      return;
                    }
                  }

                  setCheckOut(date);
                  fetchPricing(checkIn, date);
                }}
                placeholderText="Check-out"
                minDate={
                  checkIn
                    ? (() => {
                        const d = new Date(checkIn);

                        d.setHours(12, 0, 0, 0);

                        d.setDate(
                          d.getDate() +
                            Number(getMinNightsForDate(checkIn) || 1),
                        );

                        return d;
                      })()
                    : new Date()
                }
                className="border p-3 rounded w-full"
              />
            </div>
           {pricing &&
  !pricingLoading &&
  (() => {
    const mandatoryFees =
      pricing.extraFees?.filter(
        (fee) => fee.option === "mandatory"
      ) || [];

    const taxFees = mandatoryFees.filter((fee) =>
      fee.name?.toLowerCase().includes("tax")
    );

    const otherFees = mandatoryFees.filter(
      (fee) => !fee.name?.toLowerCase().includes("tax")
    );

    const taxAmount = taxFees.reduce(
      (sum, fee) => sum + Number(fee.amount || 0),
      0
    );

    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Header */}
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Price Summary
              </h3>

              
            </div>

            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              {pricing.nights}{" "}
              {pricing.nights === 1 ? "night" : "nights"}
            </div>
          </div>
        </div>

        {/* Price Details */}
        <div className="space-y-4 px-5 py-5">

          {/* Accommodation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                $
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800">
       Rates
                </p>

                <p className="text-xs text-gray-500">
                  {pricing.nights}{" "}
                  {pricing.nights === 1 ? "night" : "nights"}
                </p>
              </div>
            </div>

            <span className="text-sm font-semibold text-gray-900">
              ${Number(pricing.subtotal || 0).toFixed(2)}
            </span>
          </div>

          {/* Other Mandatory Fees */}
          {otherFees.map((fee, index) => (
            <div
              key={`${fee.name}-${index}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  {fee.type === "$" ? "$" : "%"}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {fee.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    Mandatory fee
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-gray-900">
                ${Number(fee.amount || 0).toFixed(2)}
              </span>
            </div>
          ))}

          {/* Taxes */}
          {taxFees.length > 0 && (
            <div className="space-y-3">
              {taxFees.map((fee, index) => (
                <div
                  key={`${fee.name}-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                      %
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {fee.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {fee.type === "%"
                          ? `${fee.value || ""}% tax`
                          : "Tax"}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-gray-900">
                    ${Number(fee.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-gray-900">
                  Total
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                Including all mandatory fees
              </p>
            </div>

            <span className="text-xl font-bold text-gray-900">
              ${Number(pricing.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-center text-xs text-gray-500">
            Final price may vary depending on applicable fees.
          </p>
        </div>
      </div>
    );
  })()}
            {/* <button
            disabled={!checkIn || !checkOut}
            onClick={() => setOpenBooking(true)}
            className={`w-full py-3 rounded-xl font-semibold text-white 
      ${!checkIn || !checkOut
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
          >
            Book Now
          </button> */}
            <button
              onClick={() => setOpenInquiry(true)}
              className="w-full py-3 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            >
              Send Inquiry
            </button>
            <PropertyminiCalendar listingId={listing._id} className="mt-20" />
           <div className="overflow-hidden">
  {openInquiry && (
    <InquiryModal
      propertyId={id}
      initialArrival={checkIn}
      initialDeparture={checkOut}
      onClose={() => setOpenInquiry(false)}
    />
  )}
</div>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {openBooking && (
        <BookingPreviewModal
          propertyId={id}
          checkIn={formatDate(checkIn)}
          checkOut={formatDate(checkOut)}
          onClose={() => setOpenBooking(false)}
        />
      )}
    </>
  );
};

export default PropertyDetail;
