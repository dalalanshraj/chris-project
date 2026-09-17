import { useEffect, useState } from "react";

import api from "../api/axios.js";

export default function VideoTab({
  listingId,
  goNextTab,
}) {
  const [form, setForm] = useState({
    youtube: "",
    virtualTour: "",
  });

  const [loading, setLoading] = useState(false);


  /* =========================================================
     LOAD SAVED VIDEO
  ========================================================= */

  useEffect(() => {
    if (!listingId) return;

    api
      .get(`/listings/${listingId}`)
      .then((res) => {
        if (res.data?.video) {
          setForm({
            youtube: res.data.video.youtube || "",
            virtualTour:
              res.data.video.virtualTour || "",
          });
        }
      })
      .catch(() => {});
  }, [listingId]);


  /* =========================================================
     YOUTUBE EMBED URL
  ========================================================= */

 const getEmbedUrl = (url) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);

    // Normal YouTube:
    // https://www.youtube.com/watch?v=VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.searchParams.get("v")
    ) {
      const videoId = parsedUrl.searchParams.get("v");

      return `https://www.youtube.com/embed/${videoId}`;
    }

    // YouTube Shorts:
    // https://www.youtube.com/shorts/VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.pathname.startsWith("/shorts/")
    ) {
      const videoId = parsedUrl.pathname
        .split("/shorts/")[1]
        .split("/")[0];

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // YouTube share:
    // https://youtu.be/VIDEO_ID
    if (parsedUrl.hostname === "youtu.be") {
      const videoId = parsedUrl.pathname
        .substring(1)
        .split("/")[0];

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Already embed URL:
    // https://www.youtube.com/embed/VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.pathname.startsWith("/embed/")
    ) {
      return url;
    }

    return "";
  } catch {
    return "";
  }
};


  /* =========================================================
     SAVE VIDEO
  ========================================================= */

  const saveVideo = async () => {
    if (!listingId) return;

    try {
      setLoading(true);

      await api.put(
        `/listings/${listingId}/video`,
        form
      );

      goNextTab();
    } catch (error) {
      console.log(
        "VIDEO SAVE ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  const youtubeEmbed = getEmbedUrl(
    form.youtube
  );


  return (
    <div className="space-y-6">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <h2 className="text-xl font-bold text-gray-800">
          Videos & Virtual Tour
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Add a YouTube video or virtual tour
          to showcase the property.
        </p>
      </div>


      {/* =====================================================
          VIDEO & TOUR CARD
      ===================================================== */}

      <div
        className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          shadow-sm
          overflow-hidden
        "
      >

        {/* Card Header */}

        <div
          className="
            px-5
            py-4
            bg-gradient-to-r
            from-gray-50
            to-white
            border-b
            border-gray-200
          "
        >
          <h3 className="text-base font-semibold text-gray-800">
            Property Media
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Add video and virtual tour links
          </p>
        </div>


        {/* Form */}

        <div className="p-5 space-y-6">


          {/* =================================================
              YOUTUBE
          ================================================= */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube Video URL
            </label>

            <div className="relative">

              {/* YouTube Icon */}

              <div
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  rounded-lg
                  bg-red-50
                  text-red-500
                "
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.8V8.2l6.5 3.8-6.5 3.8z" />
                </svg>
              </div>

              <input
                type="url"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  pl-14
                  pr-4
                  py-3
                  text-sm
                  text-gray-700
                  outline-none
                  transition-all
                  duration-200
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  hover:border-gray-300
                "
                placeholder="https://www.youtube.com/watch?v=xxxx"
                value={form.youtube}
                onChange={(e) =>
                  setForm({
                    ...form,
                    youtube: e.target.value,
                  })
                }
              />

            </div>

            <p className="text-xs text-gray-400 mt-2">
              Paste a YouTube watch, share or embed
              link.
            </p>

          </div>


          {/* =================================================
              VIRTUAL TOUR
          ================================================= */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Virtual Tour URL
            </label>

            <div className="relative">

              {/* Tour Icon */}

              <div
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  rounded-lg
                  bg-purple-50
                  text-purple-600
                "
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l9-8 9 8-9 8-9-8z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12v7l9 4 9-4v-7"
                  />
                </svg>
              </div>

              <input
                type="url"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  pl-14
                  pr-4
                  py-3
                  text-sm
                  text-gray-700
                  outline-none
                  transition-all
                  duration-200
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  hover:border-gray-300
                "
                placeholder="https://my.matterport.com/..."
                value={form.virtualTour}
                onChange={(e) =>
                  setForm({
                    ...form,
                    virtualTour:
                      e.target.value,
                  })
                }
              />

            </div>

            <p className="text-xs text-gray-400 mt-2">
              Optional — Matterport, 3D tour or
              other virtual tour URL.
            </p>

          </div>

        </div>
      </div>


      {/* =====================================================
          YOUTUBE PREVIEW
      ===================================================== */}

      {youtubeEmbed && (
        <div
          className="
            bg-white
            border
            border-gray-200
            rounded-2xl
            shadow-sm
            overflow-hidden
          "
        >

          {/* Preview Header */}

          <div
            className="
              flex
              items-center
              justify-between
              px-5
              py-4
              border-b
              border-gray-200
              bg-gray-50
            "
          >
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Video Preview
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Preview of your YouTube video
              </p>
            </div>

            <span
              className="
                text-xs
                font-medium
                px-2.5
                py-1
                rounded-full
                bg-green-50
                text-green-600
                border
                border-green-100
              "
            >
              Ready
            </span>
          </div>


          {/* Video */}

          <div className="p-5">

            <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black">

              <iframe
                className="absolute inset-0 w-full h-full"
                src={youtubeEmbed}
                title="YouTube video preview"
                allow="
                  accelerometer;
                  autoplay;
                  clipboard-write;
                  encrypted-media;
                  gyroscope;
                  picture-in-picture;
                  web-share
                "
                allowFullScreen
              />

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          ACTION BAR
      ===================================================== */}

      <div
        className="
          flex
          justify-end
          pt-4
          border-t
          border-gray-200
        "
      >

        <button
          onClick={saveVideo}
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            min-w-[160px]
            bg-blue-600
            hover:bg-blue-700
            disabled:bg-blue-400
            disabled:cursor-not-allowed
            active:scale-[0.98]
            text-white
            font-semibold
            px-7
            py-2.5
            rounded-xl
            shadow-sm
            hover:shadow-md
            transition-all
            duration-200
            cursor-pointer
          "
        >

          {loading ? (
            <>
              <span
                className="
                  w-4
                  h-4
                  border-2
                  border-white/40
                  border-t-white
                  rounded-full
                  animate-spin
                "
              />

              Saving...
            </>
          ) : (
            <>
              Save & Continue

              <span className="text-lg leading-none">
                →
              </span>
            </>
          )}

        </button>

      </div>

    </div>
  );
}