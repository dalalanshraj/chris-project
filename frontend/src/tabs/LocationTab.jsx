import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { TiLocationOutline } from "react-icons/ti";

import L from "leaflet";
import { useEffect, useState } from "react";

import api from "../api/axios.js";
import { useModal } from "../context/ModalContext";

import "leaflet/dist/leaflet.css";

/* =========================================================
   FIX LEAFLET DEFAULT ICON
========================================================= */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* =========================================================
   RED MARKER ICON
========================================================= */

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

/* =========================================================
   MAP VIEW
========================================================= */

function ChangeMapView({ position }) {
  const map = useMap();

  useEffect(() => {
    const lat = Number(position.lat);
    const lng = Number(position.lng);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      map.setView([lat, lng], 15);
    }
  }, [position, map]);

  return null;
}

/* =========================================================
   LOCATION MARKER
========================================================= */

function LocationMarker({
  position,
  setPosition,
}) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: String(e.latlng.lat),
        lng: String(e.latlng.lng),
      });
    },
  });

  const lat = Number(position.lat);
  const lng = Number(position.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return (
    <Marker
      position={[lat, lng]}
      icon={redIcon}
      draggable={true}
      opacity={1}
      zIndexOffset={1000}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target.getLatLng();

          setPosition({
            lat: String(marker.lat),
            lng: String(marker.lng),
          });
        },
      }}
    />
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function LocationTab({
  listingId,
  goNextTab,
}) {
  const { showModal } = useModal();

  const [position, setPosition] = useState({
    lat: "30.2447",
    lng: "-87.7056",
  });

  const [address, setAddress] = useState("");

  const [searching, setSearching] = useState(false);

  const [saving, setSaving] = useState(false);

  /* =====================================================
     LOAD LOCATION
  ====================================================== */

  useEffect(() => {
    if (!listingId) return;

    api
      .get(`/listings/${listingId}`)
      .then((res) => {
        const savedLat = Number(
          res.data?.location?.lat
        );

        const savedLng = Number(
          res.data?.location?.lng
        );

        if (
          Number.isFinite(savedLat) &&
          Number.isFinite(savedLng)
        ) {
          setPosition({
            lat: String(savedLat),
            lng: String(savedLng),
          });
        }

        setAddress(
          res.data?.location?.address || ""
        );
      })
      .catch((err) => {
        console.log("Location load error:", err);
      });
  }, [listingId]);

  /* =====================================================
     SAVE LOCATION
  ====================================================== */

  const saveLocation = async () => {
    let lat = Number(position.lat);
    let lng = Number(position.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      showModal("Invalid coordinates");
      return;
    }

    /* USA longitude fix */

    if (lng > 0 && lat > 20) {
      lng = -Math.abs(lng);
    }

    try {
      setSaving(true);

      await api.put(
        `/listings/${listingId}/location`,
        {
          lat,
          lng,
          address,
        }
      );

      showModal("Location Saved");

      if (goNextTab) {
        goNextTab();
      }
    } catch (err) {
      console.log("Save location error:", err);

      showModal("Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     SEARCH ADDRESS
  ====================================================== */

  const locateByAddress = async () => {
    if (!address.trim()) {
      showModal("Please enter address");
      return;
    }

    try {
      setSearching(true);

      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=json` +
        `&q=${encodeURIComponent(address)}`;

      const res = await fetch(url);

      const data = await res.json();

      if (!data.length) {
        showModal("Address not found");
        return;
      }

      const lat = Number(data[0].lat);

      let lng = Number(data[0].lon);

      /* USA longitude fix */

      if (lng > 0 && lat > 20) {
        lng = -Math.abs(lng);
      }

      setPosition({
        lat: String(lat),
        lng: String(lng),
      });

      showModal("Location Found");
    } catch (err) {
      console.log("Address search error:", err);

      showModal("Location search failed");
    } finally {
      setSearching(false);
    }
  };

  /* =====================================================
     MAP VALUES
  ====================================================== */

  const mapLat =
    Number(position.lat) || 30.2447;

  const mapLng =
    Number(position.lng) || -87.7056;

  return (
    <div className="w-full space-y-6">

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        sm:justify-between
        gap-4
      ">

        <div>

          <div className="flex items-center gap-2 mb-2">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-blue-50
              text-blue-600
              flex
              items-center
              justify-center
              text-lg
            ">
          <TiLocationOutline />
            </div>

            <div>

              <h2 className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-900
              ">
                Property Location
              </h2>

              <p className="
                text-sm
                text-gray-500
              ">
                Set the exact location of your property
              </p>

            </div>

          </div>

        </div>

        {/* Coordinate badge */}

        <div className="
          inline-flex
          items-center
          gap-2
          px-3
          py-2
          rounded-xl
          bg-gray-50
          border
          border-gray-200
          text-xs
          font-medium
          text-gray-600
        ">

          <span className="
            w-2
            h-2
            rounded-full
            bg-green-500 "
          />

          Map Location

        </div>

      </div>


      {/* =================================================
          ADDRESS SEARCH CARD
      ================================================== */}

      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-gray-50
        p-4
        sm:p-5
      ">

        <div className="mb-3">

          <h3 className="
            text-sm
            font-bold
            text-gray-800
          ">
            Search Property Address
          </h3>

          <p className="
            text-xs
            text-gray-500
            mt-1
          ">
            Enter an address to automatically locate it
            on the map.
          </p>

        </div>


        <div className="
          flex
          flex-col
          sm:flex-row
          gap-3
        ">

          <div className="relative flex-1">

            <span className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-gray-400
            ">
        <TiLocationOutline  size={20}/>
            </span>

            <input
              type="text"
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  locateByAddress();
                }
              }}
              placeholder="Enter property address..."
              className="
                w-full
                bg-white
                border
                border-gray-200
                rounded-xl
                pl-10
                pr-4
                py-3
                text-sm
                text-gray-800
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            />

          </div>


          <button
            type="button"
            onClick={locateByAddress}
            disabled={searching}
            className="
              sm:w-auto
              min-w-[150px]
              px-5
              py-3
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-blue-300
              text-white
              text-sm
              font-semibold
              transition
              flex
              items-center
              justify-center
              gap-2
              shadow-sm
            "
          >

            {searching ? (
              <>
                <span className="
                  w-4
                  h-4
                  border-2
                  border-white/40
                  border-t-white
                  rounded-full
                  animate-spin"
                />

                Searching...
              </>
            ) : (
              <>
                
                Locate Address
              </>
            )}

          </button>

        </div>

      </div>


      {/* =================================================
          MAP
      ================================================== */}

      <div>

        <div className="
          flex
          items-center
          justify-between
          mb-3
        ">

          <div>

            <h3 className="
              text-base
              font-bold
              text-gray-900
            ">
              Map Location
            </h3>

            <p className="
              text-xs
              text-gray-500
              mt-1
            ">
              Click anywhere on the map or drag the
              marker to adjust the location.
            </p>

          </div>

        </div>


        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          shadow-sm
          bg-gray-100
        ">

          <MapContainer
            key={`${position.lat}-${position.lng}`}
            center={[mapLat, mapLng]}
            zoom={13}
            style={{
              width: "100%",
              height: "500px",
            }}
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ChangeMapView
              position={position}
            />

            <LocationMarker
              position={position}
              setPosition={setPosition}
            />

          </MapContainer>

        </div>

      </div>


      {/* =================================================
          COORDINATES
      ================================================== */}

      <div>

        <div className="mb-3">

          <h3 className="
            text-base
            font-bold
            text-gray-900
          ">
            Exact Coordinates
          </h3>

          <p className="
            text-xs
            text-gray-500
            mt-1
          ">
            You can also enter the latitude and longitude
            manually.
          </p>

        </div>


        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        ">

          {/* LATITUDE */}

          <div className="
            bg-gray-50
            border
            border-gray-200
            rounded-2xl
            p-4
          ">

            <label className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-2
            ">
              Latitude
            </label>

            <div className="relative">

              <span className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
                text-sm
              ">
                ↕
              </span>

              <input
                type="number"
                step="any"
                value={position.lat}
                onChange={(e) =>
                  setPosition((prev) => ({
                    ...prev,
                    lat: e.target.value,
                  }))
                }
                className="
                  w-full
                  bg-white
                  border
                  border-gray-200
                  rounded-xl
                  pl-9
                  pr-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

            </div>

          </div>


          {/* LONGITUDE */}

          <div className="
            bg-gray-50
            border
            border-gray-200
            rounded-2xl
            p-4
          ">

            <label className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-2
            ">
              Longitude
            </label>

            <div className="relative">

              <span className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
                text-sm
              ">
                ↔
              </span>

              <input
                type="number"
                step="any"
                value={position.lng}
                onChange={(e) =>
                  setPosition((prev) => ({
                    ...prev,
                    lng: e.target.value,
                  }))
                }
                className="
                  w-full
                  bg-white
                  border
                  border-gray-200
                  rounded-xl
                  pl-9
                  pr-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          CURRENT LOCATION PREVIEW
      ================================================== */}

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        sm:justify-between
        gap-4
        p-4
        rounded-2xl
        bg-blue-50
        border
        border-blue-100
      ">

        <div>

          <p className="
            text-xs
            font-semibold
            text-blue-500
            uppercase
            tracking-wide
          ">
            Selected Coordinates
          </p>

          <p className="
            text-sm
            font-semibold
            text-blue-900
            mt-1
          ">
            {position.lat || "—"} ,{" "}
            {position.lng || "—"}
          </p>

        </div>

        <div className="
          text-xs
          text-blue-600
        ">
          📌 Marker position
        </div>

      </div>


      {/* =================================================
          SAVE
      ================================================== */}

      <div className="
        flex
        flex-col-reverse
        sm:flex-row
        sm:items-center
        sm:justify-end
        gap-3
        pt-2
        border-t
        border-gray-100
      ">

        <button
          type="button"
          onClick={saveLocation}
          disabled={saving}
          className="
            w-full
            sm:w-auto
            min-w-[180px]
            px-6
            py-3
            rounded-xl
            bg-blue-600
            hover:bg-blue-700
            disabled:bg-blue-300
            text-white
            font-semibold
            text-sm
            transition
            shadow-md
            shadow-blue-200
            flex
            items-center
            justify-center
            gap-2
          "
        >

          {saving ? (
            <>
              <span className="
                w-4
                h-4
                border-2
                border-white/40
                border-t-white
                rounded-full
                animate-spin "
              />

              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <span>→</span>
            </>
          )}

        </button>

      </div>

    </div>
  );
}