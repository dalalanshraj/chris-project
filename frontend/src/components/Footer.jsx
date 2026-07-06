import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

import { useState, useEffect } from "react";

import api from "../api/axios.js";

import logo from "../assets/logo/LOGO.png";
import { Link } from "react-router-dom";

export default function Footer({ listingId }) {
  const [listing, setListing] = useState(null);

  // =====================================
  // FETCH LISTING
  // =====================================

  useEffect(() => {
    if (!listingId) return;

    api
      .get(`/listings/${listingId}`)

      .then((res) => {
        console.log("FOOTER DATA:", res.data);

        setListing(res.data);
      })

      .catch((err) => {
        console.log(err);
      });
  }, [listingId]);

  // =====================================
  // DATA
  // =====================================

  const address = listing?.location?.address || "Panama City Beach, Florida";
  const email = listing?.property?.altEmail || "info@example.com";
  const phone = listing?.property?.altPhone || "000-000-0000";
  const title = listing?.property?.title || "Luxury Condo";

  return (
    <footer className="bg-black text-white mt-20">
      {/* ================= MAP ================= */}

      <div className="w-full h-[240px] overflow-hidden">
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d873.5075493519123!2d-85.80502213039706!3d30.17657209842859!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8893891dea520c1f%3A0x6d3694878ccb8cb!2sWash%20Wizards!5e1!3m2!1sen!2sin!4v1779500259298!5m2!1sen!2sin`}
          className="w-full h-100 border-0"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      {/* ================= FOOTER CONTENT ================= */}

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 items-center">
          {/* ================= LEFT ================= */}

          <div className="text-center md:text-left">
            <img src={logo} alt="logo" className="w-48 mx-auto md:mx-0 mb-6" />

            <p className="text-gray-400 text-sm leading-7">
             © 2026 <a href="https://digifyamerica.com/">Digify America.</a> All rights reserved.
            </p>
          </div>

          {/* ================= CENTER ================= */}

          <div className="text-center">
            <h3 className="text-3xl font-semibold mb-6">{title}</h3>

            <p className="text-gray-300 leading-8">{address}</p>

            <p className="mt-5 text-gray-300">{phone}</p>

            <p className="text-gray-300 break-all">{email}</p>
          </div>

          {/* ================= RIGHT ================= */}

          <div className="flex flex-col items-center md:items-end">
            <Link to="/admin/login">
              <button className="px-12 py-4 bg-black text-white uppercase tracking-[4px] text-sm hover:bg-blue-500 transition-all duration-500">
                Owner Login →
              </button>
            </Link>

            {/* POWERED */}

            <div className="mt-10 text-center md:text-right">
              <p className="uppercase tracking-[4px] text-gray-500 text-sm mb-6">
                Follow Us
              </p>

              <div className="flex gap-4">
                {[FaFacebookF, FaInstagram, FaTwitter].map((Icon, i) => (
                  <div
                    key={i}
                    className="
                      w-12
                      h-12
                      rounded-full
                      border
                      border-gray-700
                      flex
                      items-center
                      justify-center
                      hover:bg-[#FFE8BE]
                      hover:text-black
                      hover:border-[#FFE8BE]
                      transition-all
                      duration-300
                      cursor-pointer
                    "
                  >
                    <Icon size={18} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
