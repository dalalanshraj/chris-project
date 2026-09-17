import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios.js";

import PropertyTab from "../../tabs/PropertyTab";
import DescriptionTab from "../../tabs/DescriptionTab";
import AmenitiesTab from "../../tabs/AmenitiesTab";
import ActivitiesTab from "../../tabs/ActivitiesTab";
import PhotosTab from "../../tabs/PhotosTab";
import VideoTab from "../../tabs/VideoTab";
import RatesTab from "../../tabs/RatesTab";
import LocationTab from "../../tabs/LocationTab";
import Inquiry from "../../tabs/Inquiry";
// import Sidebar from "../components/Sidebar";

const tabs = [
  "Property",
  "Description",
  "Amenities",
  "Activities",
  "Photos",
  "Video",
  "Rates",
  "Location",
  "Inquiry",
];

export default function EditListing() {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [activeTab, setActiveTab] = useState("Property");

  useEffect(() => {
  if (initialData) setForm(initialData);
}, [initialData]);

  // ✅ LOAD EXISTING LISTING
  useEffect(() => {
    api
      .get(`/listings/${id}`)
      .then((res) => setListing(res.data))
      .catch(() => alert("Listing not found"));
  }, [id]);

  if (!listing) return <p className="p-6">Loading listing...</p>;

  return (
  <div className="min-h-screen bg-slate-50">
    <div className="w-full">

      {/* ================= HEADER ================= */}
      <div className="px-4 sm:px-6 pt-5 pb-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-slate-500">
                  Listings
                </span>

                <span className="text-slate-300">/</span>

                <span className="text-sm text-blue-600 font-medium">
                  Edit Listing
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {listing?.property?.title ||
                  listing?.property?.name ||
                  "Property"}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Manage your property details, photos, rates and inquiries.
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />

                <span className="text-sm font-semibold text-emerald-700">
                  Active Listing
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* ================= STICKY TABS ================= */}
     {/* STICKY TABS */}
<div className="sticky top-0 z-[90] py-3 bg-gray-100/95 backdrop-blur-md">

  <div className="
    bg-white
    border
    border-gray-200
    rounded-2xl
    shadow-lg
    overflow-hidden
  ">

    <div className="
      flex
      gap-1
      p-2
      overflow-x-auto
      scrollbar-hide
    ">

      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <button
            key={tab.name}
            type="button"
            onClick={() => setActiveTab(tab.name)}
            className={`
              flex-shrink-0
              flex
              items-center
              gap-2
              px-4
              py-3
              rounded-xl
              text-sm
              font-semibold
              whitespace-nowrap
              transition-all
              duration-200

              ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
          >

            <span className="text-base">
              {tab.icon}
            </span>

            {tab.name}

          </button>
        );
      })}

    </div>

  </div>

</div>


      {/* ================= CONTENT ================= */}
      <div className="px-4 sm:px-6 py-6">

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6">

          {activeTab === "Property" && (
            <PropertyTab
              listingId={listing._id}
              initialData={listing.property}
            />
          )}

          {activeTab === "Description" && (
            <DescriptionTab
              listingId={listing._id}
              initialData={listing.description}
            />
          )}

          {activeTab === "Amenities" && (
            <AmenitiesTab
              listingId={listing._id}
              initialData={listing.amenities}
            />
          )}

          {activeTab === "Activities" && (
            <ActivitiesTab
              listingId={listing._id}
              initialData={listing.activities}
            />
          )}

          {activeTab === "Photos" && (
            <PhotosTab
              listingId={listing._id}
              initialData={listing.photos}
            />
          )}

          {activeTab === "Video" && (
            <VideoTab
              listingId={listing._id}
              initialData={listing.video}
            />
          )}

          {activeTab === "Rates" && (
            <RatesTab
              listingId={listing._id}
            />
          )}

          {activeTab === "Location" && (
            <LocationTab
              listingId={listing._id}
              initialData={listing.location}
            />
          )}

          {activeTab === "Inquiry" && (
            <Inquiry
              listingId={listing._id}
            />
          )}

        </div>

      </div>

    </div>
  </div>
);
}
