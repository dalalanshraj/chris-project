import { useEffect, useState } from "react";

import api from "../api/axios.js";

import { activitiesData } from "../activitiesData.js";

import { useModal } from "../context/ModalContext";

export default function ActivitiesTab({
  listingId,
  goNextTab,
  initialData = {},
}) {
  const [activities, setActivities] = useState({});

  const { showModal } = useModal();

  /* ================= PRELOAD ================= */

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setActivities(initialData);
    }
  }, [initialData]);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!listingId) return;

    api
      .get(`/listings/${listingId}`)
      .then((res) => {
        setActivities(res.data.activities || {});
      })
      .catch(() => {});
  }, [listingId]);

  /* ================= HANDLERS ================= */

  const toggleCheckbox = (value) => {
    setActivities((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  const selectRadio = (group, value) => {
    setActivities((prev) => {
      const updated = { ...prev };

      Object.keys(updated).forEach((k) => {
        if (k.startsWith(group + ":")) {
          delete updated[k];
        }
      });

      updated[`${group}:${value}`] = true;

      return updated;
    });
  };

  const checkAll = (options, checked) => {
    const updated = {};

    options.forEach((opt) => {
      updated[opt] = checked;
    });

    setActivities((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  /* ================= SAVE ================= */

  const saveActivities = async () => {
    try {
      await api.put(
        `/listings/${listingId}/activities`,
        activities
      );

      goNextTab();
    } catch (error) {
      showModal("Failed to save activities");
    }
  };

  return (
    <div className="space-y-6">

      {/* ================= ACTION BAR ================= */}

      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 py-4">
        <div className="flex justify-end">
          <button
            onClick={saveActivities}
            className="
              inline-flex
              items-center
              gap-2
              bg-blue-600
              hover:bg-blue-700
              active:scale-[0.98]
              text-white
              font-medium
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
            Save & Next
            <span className="text-lg leading-none">→</span>
          </button>
        </div>
      </div>

      {/* ================= ACTIVITIES GRID ================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {activitiesData.map((section) => (

          <div
            key={section.title}
            className="
              bg-white
              border border-gray-200
              rounded-2xl
              overflow-hidden
              shadow-sm
              hover:shadow-md
              transition-shadow
              duration-200
            "
          >

            {/* ================= HEADER ================= */}

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
              <div className="flex items-center justify-between gap-3">

                <h3 className="text-base font-semibold text-gray-800">
                  {section.title}
                </h3>

                {/* Selected Count */}

                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                  {
                    section.options.filter((option) =>
                      section.type === "radio"
                        ? !!activities[
                            `${section.name}:${option}`
                          ]
                        : !!activities[option]
                    ).length
                  }{" "}
                  selected
                </span>

              </div>
            </div>

            {/* ================= SELECT ALL ================= */}

            {section.type === "checkbox" && (
              <label
                className="
                  flex
                  items-center
                  gap-3
                  mx-4
                  mt-4
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50/70
                  cursor-pointer
                  select-none
                  hover:bg-blue-50
                  transition
                "
              >

                <input
                  type="checkbox"
                  onChange={(e) =>
                    checkAll(
                      section.options,
                      e.target.checked
                    )
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
                    ? !!activities[
                        `${section.name}:${option}`
                      ]
                    : !!activities[option];

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
                      px-4
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

                    {/* Hidden Native Input */}

                    <input
                      type={section.type}
                      name={section.name}
                      checked={isChecked}
                      onChange={() =>
                        section.type === "radio"
                          ? selectRadio(
                              section.name,
                              option
                            )
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
                        w-5
                        h-5
                        min-w-[20px]
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
                            ? "bg-blue-600 border-blue-600 scale-105"
                            : "bg-white border-gray-300 group-hover:border-blue-400"
                        }
                      `}
                    >

                      {isChecked &&
                        (section.type === "radio" ? (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
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

                  </label>
                );
              })}

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}