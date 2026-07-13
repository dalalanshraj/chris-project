import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function Gallery() {
  const [images, setImages] = useState([]);

  // null = slider closed
  // number = current image index
  const [activeIndex, setActiveIndex] = useState(null);

  // MOBILE SWIPE
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  // =====================================
  // IMAGE URL
  // =====================================

  const getImageUrl = (path) => {
    if (!path || typeof path !== "string") return "";

    const base = import.meta.env.VITE_API_URL || "";

    if (path.startsWith("http")) return path;

    return (
      base.replace(/\/$/, "") +
      "/" +
      path.replace(/^\//, "")
    );
  };

  // =====================================
  // FETCH
  // =====================================

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get("/gallery/published");

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.gallery || [];

        setImages(data);
      } catch (error) {
        console.error(
          "GALLERY ERROR:",
          error.response?.data || error.message
        );

        setImages([]);
      }
    };

    fetchGallery();
  }, []);

  // =====================================
  // OPEN SLIDER
  // =====================================

  const openSlider = (index) => {
    setActiveIndex(index);
  };

  // =====================================
  // CLOSE SLIDER
  // =====================================

  const closeSlider = () => {
    setActiveIndex(null);
  };

  // =====================================
  // NEXT SLIDE
  // =====================================

  const nextSlide = () => {
    if (images.length <= 1) return;

    setActiveIndex((currentIndex) => {
      if (currentIndex === null) return null;

      return (currentIndex + 1) % images.length;
    });
  };

  // =====================================
  // PREVIOUS SLIDE
  // =====================================

  const previousSlide = () => {
    if (images.length <= 1) return;

    setActiveIndex((currentIndex) => {
      if (currentIndex === null) return null;

      return (
        (currentIndex - 1 + images.length) %
        images.length
      );
    });
  };

  // =====================================
  // KEYBOARD + BODY SCROLL LOCK
  // =====================================

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyboard = (event) => {
      if (event.key === "ArrowRight") {
        setActiveIndex((currentIndex) => {
          return (currentIndex + 1) % images.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((currentIndex) => {
          return (
            (currentIndex - 1 + images.length) %
            images.length
          );
        });
      }

      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );

      document.body.style.overflow = oldOverflow;
    };
  }, [activeIndex, images.length]);

  // =====================================
  // MOBILE SWIPE
  // =====================================

  const handleTouchStart = (event) => {
    setTouchEnd(null);

    setTouchStart(
      event.targetTouches[0].clientX
    );
  };

  const handleTouchMove = (event) => {
    setTouchEnd(
      event.targetTouches[0].clientX
    );
  };

  const handleTouchEnd = () => {
    if (
      touchStart === null ||
      touchEnd === null
    ) {
      return;
    }

    const distance = touchStart - touchEnd;

    const swipedLeft =
      distance > minSwipeDistance;

    const swipedRight =
      distance < -minSwipeDistance;

    if (swipedLeft) {
      nextSlide();
    }

    if (swipedRight) {
      previousSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="bg-[#f8f8f5] min-h-screen">
      {/* ================= HEADING ================= */}

      <section
        className="
          pt-24
          pb-16
          px-5
          md:px-10
        "
      >
        <div className="max-w-7xl mx-auto text-center mt-16 md:mt-10">
          {/* SMALL TEXT */}

          <p
            className="
              uppercase
              tracking-[6px]
              text-gray-400
              text-xs
              md:text-sm
              mb-6
            "
          >
            Luxury Moments
          </p>

          {/* MAIN HEADING */}

          <h1
            className="
              font-playfair
              text-black
              font-bold
              leading-[0.95]
              text-5xl
              sm:text-6xl
              md:text-7xl
              lg:text-[90px]
            "
          >
            Property Gallery
          </h1>

          {/* DESCRIPTION */}

          <p
            className="
              mt-8
              text-gray-600
              max-w-3xl
              mx-auto
              text-lg
              md:text-xl
              leading-[2]
            "
          >
            Explore our luxury penthouse, breathtaking
            gulf views, elegant interiors, resort
            amenities, and unforgettable beachfront
            experiences.
          </p>
        </div>
      </section>

      {/* ================= GALLERY ================= */}

      <section
        className="
          px-4
          sm:px-6
          md:px-10
          lg:px-16
          pb-20
        "
      >
        <div
          className="
            columns-1
            sm:columns-2
            lg:columns-3
            xl:columns-4
            gap-5
            space-y-5
          "
        >
          {images.map((img, index) => (
            <div
              key={img._id || index}
              className="
                relative

                break-inside-avoid

                overflow-hidden

                rounded-[28px]

                cursor-pointer

                group
              "
              onClick={() => openSlider(index)}
            >
              {/* IMAGE */}

              <img
                src={getImageUrl(img.image)}
                alt={`Gallery image ${index + 1}`}
                loading="lazy"
                className="
                  block

                  w-full
                  h-auto

                  object-cover

                  rounded-[28px]

                  transition-transform
                  duration-700

                  group-hover:scale-105
                "
                onError={(event) => {
                  event.currentTarget.onerror = null;

                  event.currentTarget.src =
                    "/placeholder.png";
                }}
              />

              {/* OVERLAY */}

              <div
                className="
                  absolute
                  inset-0

                  bg-gradient-to-t

                  from-black/40
                  via-black/5
                  to-transparent

                  opacity-0

                  group-hover:opacity-100

                  transition-opacity
                  duration-500

                  pointer-events-none
                "
              />

              {/* VIEW BUTTON */}

              <div
                className="
                  absolute

                  bottom-5

                  left-1/2
                  -translate-x-1/2

                  opacity-0

                  group-hover:opacity-100

                  transition-opacity
                  duration-500

                  pointer-events-none
                "
              >
                <span
                  className="
                    inline-block

                    bg-white/90

                    backdrop-blur-md

                    text-black

                    px-5
                    py-2

                    rounded-full

                    text-sm

                    tracking-[2px]

                    uppercase
                  "
                >
                  View
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= LIGHTBOX SLIDER ================= */}

      {activeIndex !== null &&
        images[activeIndex] && (
          <div
            className="
              fixed
              inset-0

              bg-black/95

              z-[999999]

              flex
              items-center
              justify-center

              overflow-hidden
            "
            onClick={closeSlider}
          >
            {/* ================= CLOSE ================= */}

            <button
              type="button"
              aria-label="Close gallery"
              onClick={(event) => {
                event.stopPropagation();

                closeSlider();
              }}
              className="
                absolute

                top-4
                right-4

                md:top-6
                md:right-8

                z-50

                w-11
                h-11

                md:w-12
                md:h-12

                flex
                items-center
                justify-center

                rounded-full

                bg-white/10
                backdrop-blur-md

                text-white

                hover:bg-white
                hover:text-black

                transition-all
                duration-300
              "
            >
              <X size={26} />
            </button>

            {/* ================= COUNTER ================= */}

            <div
              className="
                absolute

                top-5

                left-1/2
                -translate-x-1/2

                z-40

                bg-white/10
                backdrop-blur-md

                text-white

                text-sm

                tracking-[2px]

                px-4
                py-2

                rounded-full
              "
            >
              {activeIndex + 1} / {images.length}
            </div>

            {/* ================= PREVIOUS ================= */}

            {images.length > 1 && (
              <button
                type="button"
                aria-label="Previous image"
                onClick={(event) => {
                  event.stopPropagation();

                  previousSlide();
                }}
                className="
                  absolute

                  left-2
                  sm:left-4
                  md:left-8

                  top-1/2
                  -translate-y-1/2

                  z-50

                  w-11
                  h-11

                  md:w-14
                  md:h-14

                  flex
                  items-center
                  justify-center

                  rounded-full

                  bg-white/10
                  backdrop-blur-md

                  text-white

                  hover:bg-white
                  hover:text-black

                  transition-all
                  duration-300
                "
              >
                <ChevronLeft className="w-7 h-7 md:w-9 md:h-9" />
              </button>
            )}

            {/* ================= IMAGE AREA ================= */}

            <div
              className="
                w-full
                h-full

                px-14
                sm:px-16
                md:px-28

                py-20
                md:py-16

                flex
                items-center
                justify-center

                touch-pan-y
              "
              onClick={(event) => {
                event.stopPropagation();
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={
                  images[activeIndex]._id ||
                  activeIndex
                }
                src={getImageUrl(
                  images[activeIndex].image
                )}
                alt={`Gallery preview ${
                  activeIndex + 1
                }`}
                draggable={false}
                className="
                  block

                  max-w-full
                  max-h-full

                  w-auto
                  h-auto

                  object-contain

                  rounded-2xl

                  select-none
                "
                onError={(event) => {
                  event.currentTarget.onerror = null;

                  event.currentTarget.src =
                    "/placeholder.png";
                }}
              />
            </div>

            {/* ================= NEXT ================= */}

            {images.length > 1 && (
              <button
                type="button"
                aria-label="Next image"
                onClick={(event) => {
                  event.stopPropagation();

                  nextSlide();
                }}
                className="
                  absolute

                  right-2
                  sm:right-4
                  md:right-8

                  top-1/2
                  -translate-y-1/2

                  z-50

                  w-11
                  h-11

                  md:w-14
                  md:h-14

                  flex
                  items-center
                  justify-center

                  rounded-full

                  bg-white/10
                  backdrop-blur-md

                  text-white

                  hover:bg-white
                  hover:text-black

                  transition-all
                  duration-300
                "
              >
                <ChevronRight className="w-7 h-7 md:w-9 md:h-9" />
              </button>
            )}
          </div>
        )}
    </div>
  );
}