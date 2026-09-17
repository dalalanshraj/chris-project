import { Link } from "react-router-dom";

import {
  FaEdit,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaEnvelope,
  FaChevronRight,
} from "react-icons/fa";

export default function ListingCard({
  listing,
  onToggleStatus,
  onDelete,
}) {
  if (!listing) return null;

  /* =====================================================
     IMAGE URL
  ====================================================== */

  const getImageUrl = (photo) => {
    const base =
      import.meta.env.VITE_API_URL || "";

    const cleanBase = base.replace(/\/$/, "");

    /* String */

    if (typeof photo === "string") {
      if (photo.startsWith("http")) {
        return photo;
      }

      return (
        cleanBase +
        "/" +
        photo.replace(/^\//, "")
      );
    }

    /* Object */

    if (
      photo &&
      typeof photo === "object"
    ) {
      /* Normal object */

      if (photo.url) {
        const photoUrl = String(photo.url);

        if (photoUrl.startsWith("http")) {
          return photoUrl;
        }

        return (
          cleanBase +
          "/" +
          photoUrl.replace(/^\//, "")
        );
      }

      /* Corrupted Mongo object */

      const reconstructed = Object.values(photo)
        .filter(
          (value) =>
            typeof value === "string"
        )
        .join("");

      if (
        reconstructed.includes(
          "/gallery-uploads/"
        )
      ) {
        return (
          cleanBase +
          "/" +
          reconstructed.replace(/^\//, "")
        );
      }
    }

    return "https://via.placeholder.com/800x500?text=No+Image";
  };

  const image = getImageUrl(
    listing?.photos?.[0]
  );

  /* =====================================================
     PRICE
  ====================================================== */

  const price =
    listing?.rates &&
    listing.rates.length > 0
      ? `$${listing.rates[0].nightly}`
      : "Call for price";

  /* =====================================================
     STATUS
  ====================================================== */

  const isPublished =
    listing.status === "published";

  return (
    <div
      className="
        group
        bg-white
        border
        border-gray-200
        rounded-2xl
        overflow-hidden
        shadow-sm
         
        hover:border-gray-300
        transition-all
        duration-300
      "
    >

      {/* =================================================
          MAIN SECTION
      ================================================== */}

      <div className="
        flex
        flex-col
        lg:flex-row
      ">

        {/* =================================================
            IMAGE
        ================================================== */}

        <div className="
          relative
          w-full
          lg:w-72
          xl:w-80
          h-56
          lg:h-auto
          min-h-[230px]
          flex-shrink-0
          overflow-hidden
          bg-gray-100
        ">

          <img
            src={image}
            alt={
              listing?.property?.title ||
              "Property"
            }
            className="
              w-full
              h-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/800x500?text=No+Image";
            }}
          />

          {/* IMAGE OVERLAY */}

          <div className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/60
            via-black/10
            to-transparent
            pointer-events-none
          " />

          {/* PRICE */}

         


          {/* EDIT BUTTON */}

          <Link
            to={`/admin/listings/${listing._id}`}
            className="
              absolute
              top-4
              right-4
              w-10
              h-10
              rounded-xl
              bg-white
              text-gray-700
              flex
              items-center
              justify-center
              shadow-lg
              hover:bg-blue-600
              hover:text-white
              transition-all
              duration-200
            "
            title="Edit Listing"
          >
            <FaEdit size={14} />
          </Link>

        </div>


        {/* =================================================
            DETAILS
        ================================================== */}

        <div className="
          flex-1
          p-5
          sm:p-6
          min-w-0
        ">

          {/* HEADER */}

          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-start
            sm:justify-between
            gap-4
          ">

            <div className="min-w-0">

              <h2 className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-900
                truncate
              ">
                {listing?.property?.title ||
                  "Untitled Property"}
              </h2>

              {/* LOCATION */}

              {listing?.location?.address && (
                <div className="
                  flex
                  items-center
                  gap-2
                  mt-2
                  text-sm
                  text-gray-500
                ">

                  <FaMapMarkerAlt
                    className="text-red-500"
                    size={13}
                  />

                  <span className="truncate">
                    {listing.location.address}
                  </span>

                </div>
              )}

            </div>


            {/* STATUS */}

            <div className="
              flex
              items-center
              gap-2
              flex-shrink-0
            ">

              <span
                className={
                  isPublished
                    ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold"
                    : "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold"
                }
              >

                <span
                  className={
                    isPublished
                      ? "w-2 h-2 rounded-full bg-emerald-500"
                      : "w-2 h-2 rounded-full bg-gray-400"
                  }
                />

                {listing.status || "Draft"}

              </span>

            </div>

          </div>


          {/* =================================================
              META INFO
          ================================================== */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-3
            mt-5
          ">

            {/* APPROVAL */}

            <div className="
              flex
              items-center
              gap-3
              p-3
              rounded-xl
              bg-gray-50
              border
              border-gray-100
            ">

              <div className="
                w-9
                h-9
                rounded-lg
                bg-emerald-50
                text-emerald-600
                flex
                items-center
                justify-center
              ">
                ✓
              </div>

              <div>

                <p className="
                  text-[11px]
                  text-gray-400
                  font-medium
                  uppercase
                ">
                  Approval
                </p>

                <p className="
                  text-sm
                  font-semibold
                  text-gray-800
                ">
                  Approved
                </p>

              </div>

            </div>


            {/* ADDED */}

            <div className="
              flex
              items-center
              gap-3
              p-3
              rounded-xl
              bg-gray-50
              border
              border-gray-100
            ">

              <div className="
                w-9
                h-9
                rounded-lg
                bg-blue-50
                text-[#047edf]
                flex
                items-center
                justify-center
              ">
                <FaCalendarAlt size={13} />
              </div>

              <div>

                <p className="
                  text-[11px]
                  text-gray-400
                  font-medium
                  uppercase
                ">
                  Added
                </p>

                <p className="
                  text-sm
                  font-semibold
                  text-gray-800
                ">
                  {listing.createdAt
                    ? new Date(
                        listing.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </p>

              </div>

            </div>


            {/* REVIEWS */}

            <div className="
              flex
              items-center
              gap-3
              p-3
              rounded-xl
              bg-gray-50
              border
              border-gray-100
            ">

              <div className="
                w-9
                h-9
                rounded-lg
                bg-amber-50
                text-amber-500
                flex
                items-center
                justify-center
              ">
                <FaStar size={14} />
              </div>

              <div>

                <p className="
                  text-[11px]
                  text-gray-400
                  font-medium
                  uppercase
                ">
                  Reviews
                </p>

                <p className="
                  text-sm
                  font-semibold
                  text-gray-800
                ">
                  {listing.reviewCount || 0}
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              QUICK LINKS
          ================================================== */}

          <div className="
            mt-5
            pt-5
            border-t
            border-gray-100
          ">

            <p className="
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-gray-400
              mb-3
            ">
              Quick Manage
            </p>


            <div className="
              flex
              flex-wrap
              gap-2
            ">

              <QuickLink
                to={`/admin/listings/${listing._id}`}
                label="Details"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Description`}
                label="Description"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Amenities`}
                label="Amenities"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Activities`}
                label="Activities"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Photos`}
                label="Photos"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Video`}
                label="Video"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Rates`}
                label="Rates"
              />

              <QuickLink
                to={`/admin/listings/${listing._id}?tab=Location`}
                label="Location"
              />

              {/* REVIEWS */}

              <div className="flex items-center gap-1">

                <QuickLink
                  to={`/admin/listings/${listing._id}?tab=Reviews`}
                  label="Reviews"
                />

                {listing.reviewCount > 0 && (
                  <span className="
                    px-2
                    py-1
                    rounded-md
                    bg-orange-50
                    text-orange-600
                    text-[10px]
                    font-bold
                  ">
                    {listing.reviewCount} New
                  </span>
                )}

              </div>


              {/* INQUIRY */}

              <div className="flex items-center gap-1">

                <QuickLink
                  to={`/admin/listings/${listing._id}?tab=Inquiry`}
                  label="Inquiry"
                />

                {listing.inquiryCount > 0 && (
                  <span className="
                    px-2
                    py-1
                    rounded-md
                    bg-orange-50
                    text-orange-600
                    text-[10px]
                    font-bold
                  ">
                    {listing.inquiryCount} New
                  </span>
                )}

              </div>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="
            mt-5
            pt-4
            border-t
            border-gray-100
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          ">

            <div>

              <p className="
                text-xs
                text-gray-400
              ">
                Listing visibility
              </p>

              <p className="
                text-sm
                font-semibold
                text-gray-700
                mt-0.5
              ">
                {isPublished
                  ? "Published"
                  : "Not published"}
              </p>

            </div>


            {/* TOGGLE */}

            <button
              type="button"
              onClick={() =>
                onToggleStatus(listing._id)
              }
              className="
                flex
                items-center
                gap-3
                cursor-pointer
              "
              title={
                isPublished
                  ? "Unpublish listing"
                  : "Publish listing"
              }
            >

              <span className="
                text-xs
                font-semibold
                text-gray-500
              ">
                {isPublished
                  ? "Published"
                  : "Draft"}
              </span>

              <div
                className={
                  isPublished
                    ? "w-12 h-7 rounded-full bg-emerald-500 p-1 transition-colors"
                    : "w-12 h-7 rounded-full bg-gray-300 p-1 transition-colors"
                }
              >

                <div
                  className={
                    isPublished
                      ? "w-5 h-5 rounded-full bg-white shadow-md translate-x-5 transition-transform"
                      : "w-5 h-5 rounded-full bg-white shadow-md translate-x-0 transition-transform"
                  }
                />

              </div>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   QUICK LINK
========================================================= */

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="
        inline-flex
        items-center
        gap-1.5
        px-3
        py-2
        rounded-lg
        bg-gray-50
        border
        border-gray-200
        text-xs
        font-semibold
        text-gray-600
        hover:bg-blue-50
        hover:border-blue-200
        hover:text-[#047edf]
        transition-all
        duration-200
      "
    >
      {label}

      <FaChevronRight
        size={8}
        className="opacity-50"
      />
    </Link>
  );
}