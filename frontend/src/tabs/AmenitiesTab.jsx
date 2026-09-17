import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { amenitiesData } from "../amenitiesData.js";
import { useModal } from "../context/ModalContext";

export default function AmenitiesTab({ listingId, initialData = {}, goNextTab }) {
  const [amenities, setAmenities] = useState({});
  const { showModal } = useModal();
  const [amenityInput, setAmenityInput] = useState("");
  const [parsedAmenities, setParsedAmenities] = useState([]);

  /* ================= LOAD INITIAL ================= */
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setAmenities(initialData);
    }
  }, [initialData]);

  /* ================= FALLBACK LOAD ================= */
  useEffect(() => {
    if (!listingId || Object.keys(amenities).length > 0) return;

    api
      .get(`/listings/${listingId}`)
      .then((res) => setAmenities(res.data.amenities || {}));
  }, [listingId]);

  /* ================= HANDLERS ================= */
  const toggleCheckbox = (value) => {
    setAmenities((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  const selectRadio = (group, value) => {
    setAmenities((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith(group + ":")) delete updated[k];
      });
      updated[`${group}:${value}`] = true;
      return updated;
    });
  };

  const checkAll = (options, checked) => {
    const updated = {};
    options.forEach((opt) => (updated[opt] = checked));
    setAmenities((prev) => ({ ...prev, ...updated }));
  };

  /* ================= SAVE ================= */
 const saveAmenities = async () => {
  try {
    await api.put(
      `/listings/${listingId}/amenities`,
      amenities
    );

 
    goNextTab();
    return

  } catch (err) {
    showModal("Failed to save amenities");
  }
};
const autoSelectAmenities = () => {
  const text = amenityInput.toLowerCase();

  const allAmenities = amenitiesData
    .flatMap((s) => s.options)
    .sort((a, b) => b.length - a.length); // longest first

  const updated = {};
  let remainingText = text;

  allAmenities.forEach((option) => {
    const amenity = option.toLowerCase();

    if (remainingText.includes(amenity)) {
      updated[option] = true;

      // remove matched text so smaller matches won't fire
      remainingText = remainingText.replaceAll(
        amenity,
        " "
      );
    }
  });

  setAmenities((prev) => ({
    ...prev,
    ...updated,
  }));

  showModal(
    `${Object.keys(updated).length} amenities selected`
  );
};

const handleAmenityPaste = (value) => {
  setAmenityInput(value);

  const tags = value
    .split(/[\n,;,]/)
    .map((x) => x.trim())
    .filter(Boolean);

  setParsedAmenities(tags);
};

const removeTag = (tag) => {
  const updated = parsedAmenities.filter(
    (item) => item !== tag
  );

  setParsedAmenities(updated);
  setAmenityInput(updated.join(",  "));
};


  return (
    <div className="space-y-6">

      {/* ACTION BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-gray-800">
      Quick Amenity Selector
    </h3>

    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
      {parsedAmenities.length} Selected
    </span>
  </div>

  <textarea
    rows={4}
    value={amenityInput}
    onChange={(e) =>
      
      handleAmenityPaste(e.target.value)
    }
    
    placeholder={`Paste amenities here...
Pool Hot Tub WiFi Washer Dryer Ocean View`}
    className="
  w-full
  min-h-[120px]
  border
  border-gray-200
  rounded-xl
  p-5

  text-[15px]
  leading-8

  resize-none

  focus:outline-none
  focus:ring-2
  focus:ring-blue-500

  transition-all
  duration-200
"
  />
  <p className="text-xs text-gray-500 mt-2">
  Paste amenities separated by comma or new line.
</p>

  {/* Tags */}
  {parsedAmenities.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-4 animate-fadeIn">
      {parsedAmenities.map((tag) => (
        <div
          key={tag}
         className="
flex
items-center
gap-2
px-4
py-2
bg-gradient-to-r
from-blue-50
to-indigo-50
border
border-blue-200
rounded-full
shadow-sm
hover:shadow-md
transition-all
duration-200
hover:-translate-y-0.5
"
        >
          <span>{tag}</span>

          <button
  type="button"
  onClick={() => removeTag(tag)}
  className="
    flex
    items-center
    justify-center
    w-6
    h-6
    rounded-full
    bg-red-100
    text-red-600
    hover:bg-red-500
    hover:text-white
    transition
  "
>
  ✕
</button>
        </div>
      ))}
    </div>
  )}

  <button
    onClick={autoSelectAmenities}
    className="
     bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg cursor-pointer
    "
  >
    Auto Select Amenities
  </button>
</div>
      <div className="sticky top-0 bg-white z-10 flex justify-end border-b pb-4">
        <button
          onClick={saveAmenities}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg cursor-pointer"
        >
          Save & Next →
        </button>
      </div>

      {/* GRID */}
     {/* ================= AMENITIES GRID ================= */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
  {amenitiesData.map((section) => {
    const selectedCount = section.options.filter((option) =>
      section.type === "radio"
        ? !!amenities[`${section.name}:${option}`]
        : !!amenities[option]
    ).length;

    const allSelected =
      section.type === "checkbox" &&
      section.options.length > 0 &&
      section.options.every((option) => !!amenities[option]);

    return (
      <div
        key={section.name}
        className="
          bg-white
          rounded-2xl
          border border-gray-200
          overflow-hidden
          shadow-sm
          hover:shadow-md
          transition-all
          duration-200
        "
      >
        {/* ================= HEADER ================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-5
            py-4
            bg-gradient-to-r
            from-gray-50
            to-white
            border-b
            border-gray-200
          "
        >
          <h3 className="text-[15px] font-semibold text-gray-800">
            {section.name}
          </h3>

          {selectedCount > 0 && (
            <span
              className="
                shrink-0
                text-[11px]
                font-semibold
                text-blue-700
                bg-blue-50
                border
                border-blue-100
                px-2.5
                py-1
                rounded-full
              "
            >
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* ================= SELECT ALL ================= */}

        {section.type === "checkbox" && (
          <label
            className="
              mx-4
              mt-4
              flex
              items-center
              gap-3
              px-4
              py-2.5
              rounded-xl
              border
              border-blue-100
              bg-blue-50/60
              cursor-pointer
              select-none
              hover:bg-blue-50
              transition-all
              duration-200
            "
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) =>
                checkAll(section.options, e.target.checked)
              }
              className="
                w-4
                h-4
                accent-blue-600
                cursor-pointer
              "
            />

            <span className="text-sm font-medium text-blue-700">
              Select all
            </span>
          </label>
        )}

        {/* ================= OPTIONS ================= */}

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {section.options.map((option) => {
            const isChecked =
              section.type === "radio"
                ? !!amenities[`${section.name}:${option}`]
                : !!amenities[option];

            return (
              <label
                key={option}
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-3
                  min-h-[56px]
                  px-3.5
                  py-3
                  rounded-xl
                  border
                  cursor-pointer
                  select-none
                  transition-all
                  duration-200
                  ease-out

                  ${
                    isChecked
                      ? `
                        border-blue-500
                        bg-blue-50
                        shadow-sm
                        shadow-blue-100
                      `
                      : `
                        border-gray-200
                        bg-white
                        hover:border-blue-300
                        hover:bg-blue-50/40
                        hover:shadow-sm
                      `
                  }
                `}
              >
                {/* Hidden Input */}

                <input
                  type={section.type}
                  name={section.name}
                  checked={isChecked}
                  onChange={() =>
                    section.type === "radio"
                      ? selectRadio(section.name, option)
                      : toggleCheckbox(option)
                  }
                  className="sr-only"
                />

                {/* Custom Checkbox / Radio */}

                <span
                  className={`
                    flex
                    items-center
                    justify-center
                    shrink-0
                    w-5
                    h-5
                    border-2
                    transition-all
                    duration-200

                    ${
                      section.type === "radio"
                        ? "rounded-full"
                        : "rounded-md"
                    }

                    ${
                      isChecked
                        ? `
                          bg-blue-600
                          border-blue-600
                          scale-105
                        `
                        : `
                          bg-white
                          border-gray-300
                          group-hover:border-blue-400
                        `
                    }
                  `}
                >
                  {isChecked &&
                    (section.type === "radio" ? (
                      <span className="w-2 h-2 bg-white rounded-full" />
                    ) : (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ))}
                </span>

                {/* Option Text */}

                <span
                  className={`
                    text-sm
                    leading-5
                    font-medium
                    transition-colors
                    duration-200
                    ${
                      isChecked
                        ? "text-blue-700"
                        : "text-gray-700 group-hover:text-gray-900"
                    }
                  `}
                >
                  {option}
                </span>

                {/* Selected Indicator */}

                {isChecked && (
                  <span
                    className="
                      absolute
                      right-2
                      top-2
                      w-1.5
                      h-1.5
                      rounded-full
                      bg-blue-500
                    "
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>
    );
  })}
</div>
    </div>
  );
}
