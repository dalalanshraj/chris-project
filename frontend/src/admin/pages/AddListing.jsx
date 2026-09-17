import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import api from "../../api/axios.js";
import { CiHome } from "react-icons/ci";
import { FaWpforms } from "react-icons/fa";
import { MdOutlineAutoMode } from "react-icons/md";
import { GoGoal } from "react-icons/go";
import { MdOutlinePhotoCameraBack } from "react-icons/md";
import { IoVideocamOutline } from "react-icons/io5";
import { AiTwotoneDollar } from "react-icons/ai";
import { TiLocationOutline } from "react-icons/ti";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { MdOutlineReviews } from "react-icons/md";
import { MdOutlineLocalOffer } from "react-icons/md";

import { IoMailOpenOutline } from "react-icons/io5";



import PropertyTab from "../../tabs/PropertyTab";
import DescriptionTab from "../../tabs/DescriptionTab";
import AmenitiesTab from "../../tabs/AmenitiesTab";
import ActivitiesTab from "../../tabs/ActivitiesTab";
import PhotosTab from "../../tabs/PhotosTab";
import VideoTab from "../../tabs/VideoTab";
import RatesTab from "../../tabs/RatesTab";
import LocationTab from "../../tabs/LocationTab";
import Inquiry from "../../tabs/Inquiry";
import Reviews from "../../tabs/Reviews.jsx";
import CalendarTab from "../../tabs/CalendarTab.jsx";
import DealsTab from "../../tabs/DealsTab.jsx";

const tabs = [
  { name: "Property", icon: <CiHome/> },
  { name: "Description", icon: <FaWpforms /> },
  { name: "Amenities", icon: <MdOutlineAutoMode /> },
  { name: "Activities", icon: <GoGoal /> },
  { name: "Photos", icon: <MdOutlinePhotoCameraBack /> },
  { name: "Video", icon: <IoVideocamOutline /> },
  { name: "Rates", icon: <AiTwotoneDollar /> },
  { name: "Location", icon: <TiLocationOutline /> },
  { name: "Calendar", icon: <MdOutlineCalendarMonth /> },
  { name: "Reviews", icon: <MdOutlineReviews /> },
  { name: "Deals", icon: <MdOutlineLocalOffer /> },
  { name: "Inquiry", icon: <IoMailOpenOutline /> },
];

export default function AddListing() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [listingId, setListingId] = useState(null);
  const [listingData, setListingData] = useState(null);
  const [activeTab, setActiveTab] = useState("Property");
  const [loading, setLoading] = useState(false);

  /* =====================================================
     GET ID + TAB FROM URL
  ====================================================== */

  useEffect(() => {
    if (id) {
      setListingId(id);
    }

    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl) {
      const exists = tabs.some(
        (tab) => tab.name === tabFromUrl
      );

      if (exists) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [id, searchParams]);

  /* =====================================================
     LOAD LISTING DATA
  ====================================================== */

  useEffect(() => {
    if (!listingId) {
      setListingData(null);
      return;
    }

    setLoading(true);

    api
      .get(`/listings/${listingId}`)
      .then((res) => {
        console.log("LISTING DATA:", res.data);
        setListingData(res.data);
      })
      .catch((err) => {
        console.error("LISTING LOAD ERROR:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [listingId]);

  /* =====================================================
     NEXT TAB
  ====================================================== */

  const goNextTab = () => {
    const currentIndex = tabs.findIndex(
      (tab) => tab.name === activeTab
    );

    if (
      currentIndex !== -1 &&
      currentIndex < tabs.length - 1
    ) {
      setActiveTab(
        tabs[currentIndex + 1].name
      );
    }
  };

  /* =====================================================
     TAB CLICK
  ====================================================== */

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading && !listingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">

          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-gray-800">
            Loading Listing
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Please wait...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-5">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">

          <div className="p-5 sm:p-6">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

              {/* LEFT */}

              <div className="min-w-0">

                <div className="flex gap-4">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 mt-3">
                  {listingId
                    ? "Edit Listing"
                    : "Add New Listing"}
                </h1>

                {listingData?.property?.title && (
                  <p className="mt-2 text-3xl font-semibold text-blue-600">
                    {listingData.property.title}
                  </p>
                )}
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Manage property information, photos,
                  pricing, location and inquiries.
                </p>

              </div>

              {/* RIGHT */}

              <div className="flex-shrink-0">

                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100">

                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />

                  <span className="text-sm font-semibold text-blue-700">
                    {listingId
                      ? "Editing Listing"
                      : "New Listing"}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          STICKY TABS
      ====================================================== */}

      <div className="sticky top-0 z-[50] pb-4">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

          <div className="flex items-center gap-1 p-2 overflow-x-auto">

            {tabs.map((tab) => {

              const isActive =
                activeTab === tab.name;

              return (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() =>
                    handleTabChange(tab.name)
                  }
                  className={
                    isActive
                      ? "relative flex items-center gap-2 flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white shadow-md transition-all duration-200 cursor-pointer"
                      : "relative flex items-center gap-2 flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer"
                  }
                >

                  <span className="text-xl leading-none">
                    {tab.icon}
                  </span>

                  <span>
                    {tab.name}
                  </span>

                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-white" />
                  )}

                </button>
              );
            })}

          </div>

        </div>

      </div>


      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="pb-10">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 sm:p-6">

            {/* =================================================
                PROPERTY
            ================================================= */}

            {activeTab === "Property" && (
              <PropertyTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.property}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                DESCRIPTION
            ================================================= */}

            {activeTab === "Description" && (
              <DescriptionTab
                listingId={listingId}
                initialData={
                  listingData?.description || ""
                }
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                AMENITIES
            ================================================= */}

            {activeTab === "Amenities" && (
              <AmenitiesTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Amenities}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                ACTIVITIES
            ================================================= */}

            {activeTab === "Activities" && (
              <ActivitiesTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Activities}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                PHOTOS
            ================================================= */}

            {activeTab === "Photos" && (
              <PhotosTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Photos}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                VIDEO
            ================================================= */}

            {activeTab === "Video" && (
              <VideoTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Video}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                RATES
            ================================================= */}

            {activeTab === "Rates" && (
              <RatesTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Rates}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                LOCATION
            ================================================= */}

            {activeTab === "Location" && (
              <LocationTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Location}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                CALENDAR
            ================================================= */}

            {activeTab === "Calendar" && (
              <CalendarTab
                listingId={listingId}
                calendar={listingData?.calendar}
              />
            )}


            {/* =================================================
                REVIEWS
            ================================================= */}

            {activeTab === "Reviews" && (
              <Reviews
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Reviews}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                DEALS
            ================================================= */}

            {activeTab === "Deals" && (
              <DealsTab
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Deals}
                goNextTab={goNextTab}
              />
            )}


            {/* =================================================
                INQUIRY
            ================================================= */}

            {activeTab === "Inquiry" && (
              <Inquiry
                listingId={listingId}
                setListingId={setListingId}
                initialData={listingData?.Inquiry}
                goNextTab={goNextTab}
                setActiveTab={setActiveTab}
              />
            )}

          </div>

        </div>

      </div>

    </div>
  );
}