import { useEffect, useState } from "react";
import AboutSection from "../components/homeSection/About";
import InfoSection from "../components/homeSection/InfoSection";
import Properties from "./Properties";
import GallerySection from "../components/gallarySection";
import AmenitiesSection from "../components/homeSection/amenitiesSection";
import api from "../api/axios.js";

import bgImage from "../assets/heroImg.png";
// import bgImagetwo from "../assets/img3.png";
// import imgthree from "../assets/4-2.jpg";

import BookingModalContact from "../components/bookingModel.jsx";
import FeesTable from "../components/FeesTable.jsx";
import ReviewsSection from "../components/ReviewsSection.jsx";
import { Link } from "react-router-dom";

export default function Hero({listingId}) {
  const [offset, setOffset] = useState(0);
  const [featured, setFeatured] = useState(null);
  const [open, setOpen] = useState(false);
  // const [listing, setListing] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL;

  // ✅ Helper (safe URL)
  const getImageUrl = (path) => `${BASE_URL?.replace(/\/$/, "")}${path}`;

  // ===========================
  // FETCH FEATURED LISTING
  // ===========================
  useEffect(() => {
    api
      .get("/listings/published")
      .then((res) => {
        const data = res.data || [];
        setFeatured(data[0]); // first listing
      })
      .catch(console.log);
  }, []);

  // ===========================
  // DATA SAFE EXTRACTION
  // ===========================
  // const image = featured?.photos?.[4]
  //   ? getImageUrl(featured.photos[0])
  //   : bgImagetwo;

  const title = featured?.property?.title || "Luxury Villa";
  const beds = featured?.property?.bedrooms || 4;
  const baths = featured?.property?.bathrooms || 3;

  const price =
    featured?.deal?.discountedRate || featured?.rates?.[0]?.nightly || 320;

  // ===========================
  // PARALLAX
  // ===========================
  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.3);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
     <section
      className="relative h-screen bg-fixed bg-center bg-cover"
       style={{
            
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/45"></div>

      {/* Content */}
    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 ">
        
  {/* Small Subtitle */}
  <p className="uppercase tracking-[6px] text-white/80 text-[10px]  md:text-base mt-5  md:mt-0">
    Luxury Penthouse Condo
  </p>

  {/* Main Heading */}
 <h1 className="font-playfair text-white font-bold leading-[1.05] max-w-6xl text-5xl sm:text-6xl md:text-7xl lg:text-[95px]">
  Stunning Gulf View
  <br />
  <span className="italic font-medium">
    Penthouse Condo
  </span>
</h1>

  {/* Description */}
  <p className="mt-8 text-white/90 text-lg md:text-2xl max-w-3xl leading-relaxed">
    Experience luxury beachfront living with breathtaking ocean
    views, premium interiors, and unforgettable resort amenities.
  </p>

  {/* Button */}
  <div className="flex gap-4">
     <Link to={listingId="6a0fa92e7591f49c6ad3eef0"} >
  <button
  className="
    px-12
    py-4
    bg-white/10
    backdrop-blur-sm
    border
    border-white/20
    text-white
    uppercase
    tracking-[4px]
    text-sm
    rounded-full
    hover:scale-105
    hover:backdrop-blur-xl
    hover:border-white/40
    active:scale-95
    transition-all
    duration-500
  "
>
  More Info
</button>
  </Link>
 
  {/* <button
  onClick={() => {
    setOpen(true);
  }}
  className="
    px-12
    py-4
    bg-white/10
    backdrop-blur-sm
    border
    border-white/20
    text-white
    uppercase
    tracking-[4px]
    text-sm
    rounded-full
    hover:scale-105
    hover:backdrop-blur-xl
    hover:border-white/40
    active:scale-95
    transition-all
    duration-500
  "
>
  Book Now
</button> */}
   </div>
</div>
    </section>

      {/* MODAL */}
      {open && featured && (
        <BookingModalContact
          onClose={() => setOpen(false)}
          listingId={featured._id}
        />
      )}
      {/* OTHER SECTIONS */}
      <AboutSection  />
      {/* <FeesTable /> */}
      {/* <InfoSection /> */}
      {/* <Properties /> */}

      {/* <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <img
            src={imgthree}
            className="rounded-2xl w-full h-[400px] object-cover"
          />

          <div>
            <p className="uppercase text-xs tracking-[3px] text-[#2f9bad] mb-3">
              Premium Vacation
            </p>
            <h3 className="text-3xl md:text-5xl font-semibold text-gray-800 mb-8">
              Premium Vacation Rental Homes
            </h3>
            <p className="text-gray-600">
              Enjoy a relaxing beachfront escape in our beautifully designed
              vacation condo, perfect for families, couples, and group getaways.
              This spacious property features comfortable king suites, modern
              amenities, a fully equipped kitchen, and inviting living spaces
              designed for comfort and convenience. Wake up to breathtaking
              ocean views, unwind with stunning sunsets from your private
              balcony, and enjoy resort-style amenities including beach access,
              fire pits, a tiki bar, and live entertainment. Located in the
              heart of Panama City Beach near popular restaurants, shopping, and
              attractions, this condo offers the perfect combination of luxury,
              relaxation, and coastal charm for an unforgettable vacation
              experience.
            </p>
          </div>
        </div>
      </section> */}

      <AmenitiesSection  listingId="6a0fa92e7591f49c6ad3eef0" />
      <GallerySection />
      <ReviewsSection  listingId="6a0fa92e7591f49c6ad3eef0"/>
    </>
  );
}
