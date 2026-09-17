import { useEffect, useState } from "react";
import api from "../api/axios.js";

import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaTags,
  FaCalendarAlt,
  FaDollarSign,
  FaTimes,
  FaSave,
} from "react-icons/fa";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const emptyForm = {
  title: "",
  originalRate: "",
  discountedRate: "",
  displayFrom: null,
  displayEnd: null,
  dealStartDate: null,
  dealEndDate: null,
  description: "",
};

export default function DealsTab({ listingId }) {
  const today = new Date();

  const [deals, setDeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* =====================================================
     FETCH DEALS
  ====================================================== */

  const fetchDeals = async () => {
    if (!listingId) return;

    try {
      setLoading(true);

      const res = await api.get(`/deals/${listingId}`);

      setDeals(res.data || []);
    } catch (error) {
      console.error("Fetch deals error:", error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [listingId]);

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditDeal(null);
  };

  /* =====================================================
     OPEN ADD FORM
  ====================================================== */

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  /* =====================================================
     DELETE DEAL
  ====================================================== */

  const deleteDeal = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this deal?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/deals/${id}`);

      await fetchDeals();
    } catch (error) {
      console.error("Delete deal error:", error);

      alert("Failed to delete deal.");
    }
  };

  /* =====================================================
     SAVE DEAL
  ====================================================== */

  const saveDeal = async () => {
    if (!form.title.trim()) {
      alert("Please enter deal title.");
      return;
    }

    if (!form.originalRate) {
      alert("Please enter original rate.");
      return;
    }

    if (!form.discountedRate) {
      alert("Please enter discounted rate.");
      return;
    }

    const payload = {
      ...form,

      listingId,

      displayFrom: form.displayFrom
        ? form.displayFrom.toISOString()
        : null,

      displayEnd: form.displayEnd
        ? form.displayEnd.toISOString()
        : null,

      dealStartDate: form.dealStartDate
        ? form.dealStartDate.toISOString()
        : null,

      dealEndDate: form.dealEndDate
        ? form.dealEndDate.toISOString()
        : null,
    };

    console.log("FORM 👉", form);
    console.log("PAYLOAD 👉", payload);

    try {
      setSaving(true);

      if (editDeal) {
        await api.put(
          `/deals/${editDeal._id}`,
          payload
        );
      } else {
        await api.post(`/deals`, payload);
      }

      setShowForm(false);
      resetForm();

      await fetchDeals();
    } catch (error) {
      console.error("Save deal error:", error);

      alert("Failed to save deal.");
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     EDIT DEAL
  ====================================================== */

  const openEdit = (deal) => {
    setEditDeal(deal);

    setForm({
      title: deal.title || "",

      originalRate:
        deal.originalRate ?? "",

      discountedRate:
        deal.discountedRate ?? "",

      displayFrom: deal.displayFrom
        ? new Date(deal.displayFrom)
        : null,

      displayEnd: deal.displayEnd
        ? new Date(deal.displayEnd)
        : null,

      dealStartDate: deal.dealStartDate
        ? new Date(deal.dealStartDate)
        : null,

      dealEndDate: deal.dealEndDate
        ? new Date(deal.dealEndDate)
        : null,

      description:
        deal.description || "",
    });

    setShowForm(true);
  };

  /* =====================================================
     CLOSE FORM
  ====================================================== */

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  /* =====================================================
     DATE FORMAT
  ====================================================== */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     DISCOUNT %
  ====================================================== */

  const getDiscount = (
    original,
    discounted
  ) => {
    const oldRate = Number(original);
    const newRate = Number(discounted);

    if (
      !oldRate ||
      !newRate ||
      newRate >= oldRate
    ) {
      return 0;
    }

    return Math.round(
      ((oldRate - newRate) / oldRate) * 100
    );
  };

  return (
    <div className="w-full">

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
        mb-6
      ">

        <div className="flex items-center gap-3">

          <div className="
            w-11
            h-11
            rounded-xl
            bg-blue-50
            text-blue-600
            flex
            items-center
            justify-center
          ">
            <FaTags size={19} />
          </div>

          <div>

            <h2 className="
              text-xl
              sm:text-2xl
              font-bold
              text-gray-900
            ">
              Property Deals
            </h2>

            <p className="
              text-sm
              text-gray-500
              mt-0.5
            ">
              Create and manage special offers
            </p>

          </div>

        </div>


        {/* ADD DEAL */}

        <button
          type="button"
          onClick={openAdd}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            px-5
            py-3
            rounded-xl
            bg-blue-600
            hover:bg-blue-700
            text-white
            text-sm
            font-semibold
            transition
            shadow-md
            shadow-blue-200
          "
        >
          <FaPlus size={13} />
          Add Deal
        </button>

      </div>


      {/* =================================================
          SUMMARY
      ================================================== */}

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-3
        gap-4
        mb-6
      ">

        {/* TOTAL */}

        <div className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          p-4
          shadow-sm
        ">

          <div className="flex items-center justify-between">

            <div>

              <p className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-gray-400
              ">
                Total Deals
              </p>

              <h3 className="
                text-2xl
                font-bold
                text-gray-900
                mt-1
              ">
                {deals.length}
              </h3>

            </div>

            <div className="
              w-10
              h-10
              rounded-xl
              bg-blue-50
              text-blue-600
              flex
              items-center
              justify-center
            ">
              <FaTags />
            </div>

          </div>

        </div>


        {/* ACTIVE */}

        <div className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          p-4
          shadow-sm
        ">

          <div className="flex items-center justify-between">

            <div>

              <p className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-gray-400
              ">
                Active Deals
              </p>

              <h3 className="
                text-2xl
                font-bold
                text-emerald-600
                mt-1
              ">
                {deals.filter((deal) => {
                  const start = deal.dealStartDate
                    ? new Date(deal.dealStartDate)
                    : null;

                  const end = deal.dealEndDate
                    ? new Date(deal.dealEndDate)
                    : null;

                  if (!start || !end) {
                    return false;
                  }

                  return (
                    today >= start &&
                    today <= end
                  );
                }).length}
              </h3>

            </div>

            <div className="
              w-10
              h-10
              rounded-xl
              bg-emerald-50
              text-emerald-600
              flex
              items-center
              justify-center
            ">
              ✓
            </div>

          </div>

        </div>


        {/* DISPLAY */}

        <div className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          p-4
          shadow-sm
        ">

          <div className="flex items-center justify-between">

            <div>

              <p className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-gray-400
              ">
                Display Offers
              </p>

              <h3 className="
                text-2xl
                font-bold
                text-purple-600
                mt-1
              ">
                {deals.filter((deal) => {
                  const start =
                    deal.displayFrom
                      ? new Date(
                          deal.displayFrom
                        )
                      : null;

                  const end =
                    deal.displayEnd
                      ? new Date(
                          deal.displayEnd
                        )
                      : null;

                  if (!start || !end) {
                    return false;
                  }

                  return (
                    today >= start &&
                    today <= end
                  );
                }).length}
              </h3>

            </div>

            <div className="
              w-10
              h-10
              rounded-xl
              bg-purple-50
              text-purple-600
              flex
              items-center
              justify-center
            ">
              <FaCalendarAlt />
            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          LOADING
      ================================================== */}

      {loading && (
        <div className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          p-10
          text-center
        ">

          <div className="
            w-9
            h-9
            border-4
            border-blue-100
            border-t-blue-600
            rounded-full
            animate-spin
            mx-auto
            mb-4
          " />

          <p className="
            text-sm
            font-semibold
            text-gray-700
          ">
            Loading deals...
          </p>

        </div>
      )}


      {/* =================================================
          EMPTY STATE
      ================================================== */}

      {!loading && deals.length === 0 && (
        <div className="
          bg-white
          border
          border-dashed
          border-gray-300
          rounded-2xl
          p-10
          sm:p-14
          text-center
        ">

          <div className="
            w-16
            h-16
            rounded-2xl
            bg-blue-50
            text-blue-600
            flex
            items-center
            justify-center
            mx-auto
            mb-4
          ">
            <FaTags size={25} />
          </div>

          <h3 className="
            text-lg
            font-bold
            text-gray-900
          ">
            No deals yet
          </h3>

          <p className="
            text-sm
            text-gray-500
            max-w-md
            mx-auto
            mt-2
          ">
            Create a special offer to attract more
            guests and increase your bookings.
          </p>

          <button
            type="button"
            onClick={openAdd}
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              px-5
              py-3
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
              text-white
              text-sm
              font-semibold
              transition
            "
          >
            <FaPlus size={13} />
            Create First Deal
          </button>

        </div>
      )}


      {/* =================================================
          DESKTOP TABLE
      ================================================== */}

      {!loading && deals.length > 0 && (
        <div className="
          hidden
          lg:block
          bg-white
          border
          border-gray-200
          rounded-2xl
          shadow-sm
          overflow-hidden
        ">

          <div className="
            px-5
            py-4
            border-b
            border-gray-100
            flex
            items-center
            justify-between
          ">

            <div>

              <h3 className="
                font-bold
                text-gray-900
              ">
                All Deals
              </h3>

              <p className="
                text-xs
                text-gray-500
                mt-0.5
              ">
                Manage your property offers
              </p>

            </div>

            <span className="
              px-3
              py-1.5
              rounded-lg
              bg-gray-100
              text-xs
              font-semibold
              text-gray-600
            ">
              {deals.length}{" "}
              {deals.length === 1
                ? "Deal"
                : "Deals"}
            </span>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="
                  bg-gray-50
                  border-b
                  border-gray-200
                ">

                  <th className="
                    px-5
                    py-3
                    text-left
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                  ">
                    Deal
                  </th>

                  <th className="
                    px-5
                    py-3
                    text-left
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                  ">
                    Pricing
                  </th>

                  <th className="
                    px-5
                    py-3
                    text-left
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                  ">
                    Display Period
                  </th>

                  <th className="
                    px-5
                    py-3
                    text-left
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                  ">
                    Deal Period
                  </th>

                  <th className="
                    px-5
                    py-3
                    text-right
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                  ">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {deals.map((deal) => {

                  const discount = getDiscount(
                    deal.originalRate,
                    deal.discountedRate
                  );

                  return (
                    <tr
                      key={deal._id}
                      className="
                        border-b
                        border-gray-100
                        last:border-0
                        hover:bg-gray-50
                        transition
                      "
                    >

                      {/* DEAL */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="
                            w-10
                            h-10
                            rounded-xl
                            bg-blue-50
                            text-blue-600
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                          ">
                            <FaTags size={15} />
                          </div>

                          <div>

                            <p className="
                              font-semibold
                              text-gray-900
                            ">
                              {deal.title}
                            </p>

                            {deal.description && (
                              <p className="
                                text-xs
                                text-gray-500
                                mt-1
                                max-w-[220px]
                                truncate
                              ">
                                {deal.description}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* PRICING */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <span className="
                            text-sm
                            text-gray-400
                            line-through
                          ">
                            ${deal.originalRate}
                          </span>

                          <span className="
                            text-base
                            font-bold
                            text-gray-900
                          ">
                            ${deal.discountedRate}
                          </span>

                        </div>

                        {discount > 0 && (
                          <span className="
                            inline-block
                            mt-1
                            px-2
                            py-0.5
                            rounded-md
                            bg-emerald-50
                            text-emerald-700
                            text-[11px]
                            font-bold
                          ">
                            {discount}% OFF
                          </span>
                        )}

                      </td>


                      {/* DISPLAY */}

                      <td className="px-5 py-4">

                        <div className="
                          text-sm
                          text-gray-700
                        ">

                          <div>
                            {formatDate(
                              deal.displayFrom
                            )}
                          </div>

                          <div className="
                            text-xs
                            text-gray-400
                            mt-1
                          ">
                            to{" "}
                            {formatDate(
                              deal.displayEnd
                            )}
                          </div>

                        </div>

                      </td>


                      {/* DEAL DATES */}

                      <td className="px-5 py-4">

                        <div className="
                          text-sm
                          text-gray-700
                        ">

                          <div>
                            {formatDate(
                              deal.dealStartDate
                            )}
                          </div>

                          <div className="
                            text-xs
                            text-gray-400
                            mt-1
                          ">
                            to{" "}
                            {formatDate(
                              deal.dealEndDate
                            )}
                          </div>

                        </div>

                      </td>


                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="
                          flex
                          items-center
                          justify-end
                          gap-2
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(deal)
                            }
                            title="Edit Deal"
                            className="
                              w-9
                              h-9
                              rounded-lg
                              bg-amber-50
                              text-amber-600
                              hover:bg-amber-100
                              flex
                              items-center
                              justify-center
                              transition
                            "
                          >
                            <FaEdit size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteDeal(
                                deal._id
                              )
                            }
                            title="Delete Deal"
                            className="
                              w-9
                              h-9
                              rounded-lg
                              bg-red-50
                              text-red-600
                              hover:bg-red-100
                              flex
                              items-center
                              justify-center
                              transition
                            "
                          >
                            <FaTrash size={13} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* =================================================
          MOBILE DEAL CARDS
      ================================================== */}

      {!loading && deals.length > 0 && (
        <div className="lg:hidden space-y-4">

          {deals.map((deal) => {

            const discount = getDiscount(
              deal.originalRate,
              deal.discountedRate
            );

            return (
              <div
                key={deal._id}
                className="
                  bg-white
                  border
                  border-gray-200
                  rounded-2xl
                  shadow-sm
                  p-4
                "
              >

                <div className="
                  flex
                  items-start
                  justify-between
                  gap-3
                ">

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <div className="
                      w-10
                      h-10
                      rounded-xl
                      bg-blue-50
                      text-blue-600
                      flex
                      items-center
                      justify-center
                    ">
                      <FaTags />
                    </div>

                    <div>

                      <h3 className="
                        font-bold
                        text-gray-900
                      ">
                        {deal.title}
                      </h3>

                      {discount > 0 && (
                        <span className="
                          inline-block
                          mt-1
                          px-2
                          py-0.5
                          rounded-md
                          bg-emerald-50
                          text-emerald-700
                          text-[11px]
                          font-bold
                        ">
                          {discount}% OFF
                        </span>
                      )}

                    </div>

                  </div>


                  <div className="
                    flex
                    gap-1
                  ">

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(deal)
                      }
                      className="
                        w-8
                        h-8
                        rounded-lg
                        bg-amber-50
                        text-amber-600
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FaEdit size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteDeal(
                          deal._id
                        )
                      }
                      className="
                        w-8
                        h-8
                        rounded-lg
                        bg-red-50
                        text-red-600
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FaTrash size={12} />
                    </button>

                  </div>

                </div>


                {/* PRICE */}

                <div className="
                  mt-4
                  p-3
                  rounded-xl
                  bg-gray-50
                ">

                  <p className="
                    text-xs
                    text-gray-400
                    font-medium
                  ">
                    Special Price
                  </p>

                  <div className="
                    flex
                    items-center
                    gap-2
                    mt-1
                  ">

                    <span className="
                      text-sm
                      text-gray-400
                      line-through
                    ">
                      ${deal.originalRate}
                    </span>

                    <span className="
                      text-xl
                      font-bold
                      text-gray-900
                    ">
                      ${deal.discountedRate}
                    </span>

                  </div>

                </div>


                {/* DATES */}

                <div className="
                  grid
                  grid-cols-2
                  gap-3
                  mt-3
                ">

                  <div>

                    <p className="
                      text-[11px]
                      font-semibold
                      uppercase
                      text-gray-400
                    ">
                      Display
                    </p>

                    <p className="
                      text-xs
                      font-medium
                      text-gray-700
                      mt-1
                    ">
                      {formatDate(
                        deal.displayFrom
                      )}
                    </p>

                    <p className="
                      text-xs
                      text-gray-400
                    ">
                      to{" "}
                      {formatDate(
                        deal.displayEnd
                      )}
                    </p>

                  </div>


                  <div>

                    <p className="
                      text-[11px]
                      font-semibold
                      uppercase
                      text-gray-400
                    ">
                      Deal Period
                    </p>

                    <p className="
                      text-xs
                      font-medium
                      text-gray-700
                      mt-1
                    ">
                      {formatDate(
                        deal.dealStartDate
                      )}
                    </p>

                    <p className="
                      text-xs
                      text-gray-400
                    ">
                      to{" "}
                      {formatDate(
                        deal.dealEndDate
                      )}
                    </p>

                  </div>

                </div>


                {deal.description && (
                  <p className="
                    text-sm
                    text-gray-500
                    mt-4
                    pt-3
                    border-t
                    border-gray-100
                  ">
                    {deal.description}
                  </p>
                )}

              </div>
            );
          })}

        </div>
      )}


      {/* =================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showForm && (
        <div className="
          fixed
          inset-0
          z-[1000]
          bg-black/60
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-white
            w-full
            max-w-2xl
            max-h-[90vh]
            overflow-y-auto
            rounded-2xl
            shadow-2xl
          ">

            {/* MODAL HEADER */}

            <div className="
              sticky
              top-0
              z-10
              bg-white
              border-b
              border-gray-100
              px-5
              sm:px-6
              py-4
              flex
              items-center
              justify-between
            ">

              <div className="flex items-center gap-3">

                <div className="
                  w-10
                  h-10
                  rounded-xl
                  bg-blue-50
                  text-blue-600
                  flex
                  items-center
                  justify-center
                ">
                  <FaTags />
                </div>

                <div>

                  <h3 className="
                    text-lg
                    font-bold
                    text-gray-900
                  ">
                    {editDeal
                      ? "Edit Deal"
                      : "Add Deal"}
                  </h3>

                  <p className="
                    text-xs
                    text-gray-500
                  ">
                    Set your special offer details
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-gray-100
                  text-gray-500
                  hover:bg-gray-200
                  flex
                  items-center
                  justify-center
                "
              >
                <FaTimes />
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="p-5 sm:p-6 space-y-5">

              {/* DEAL TITLE */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                ">
                  Deal Title
                </label>

                <input
                  type="text"
                  placeholder="e.g. Summer Special"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="
                    w-full
                    border
                    border-gray-200
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

              </div>


              {/* PRICES */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                ">
                  Pricing
                </label>

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-4
                ">

                  {/* ORIGINAL */}

                  <div className="relative">

                    <span className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    ">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Original Rate"
                      value={form.originalRate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          originalRate:
                            e.target.value,
                        }))
                      }
                      className="
                        w-full
                        border
                        border-gray-200
                        rounded-xl
                        pl-8
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


                  {/* DISCOUNTED */}

                  <div className="relative">

                    <span className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    ">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Discounted Rate"
                      value={form.discountedRate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          discountedRate:
                            e.target.value,
                        }))
                      }
                      className="
                        w-full
                        border
                        border-gray-200
                        rounded-xl
                        pl-8
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


              {/* DISPLAY DATES */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                ">
                  Display Period
                </label>

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-4
                ">

                  <DatePicker
                    selected={form.displayFrom}
                    onChange={(date) => {
                      setForm((prev) => ({
                        ...prev,
                        displayFrom: date,
                        displayEnd:
                          prev.displayEnd &&
                          date &&
                          prev.displayEnd < date
                            ? null
                            : prev.displayEnd,
                      }));
                    }}
                    dateFormat="yyyy-MM-dd"
                    minDate={today}
                    placeholderText="Display From"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />


                  <DatePicker
                    selected={form.displayEnd}
                    onChange={(date) =>
                      setForm((prev) => ({
                        ...prev,
                        displayEnd: date,
                      }))
                    }
                    dateFormat="yyyy-MM-dd"
                    minDate={
                      form.displayFrom || today
                    }
                    placeholderText="Display End"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
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


              {/* DEAL DATES */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                ">
                  Deal Period
                </label>

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-4
                ">

                  <DatePicker
                    selected={form.dealStartDate}
                    onChange={(date) => {
                      setForm((prev) => ({
                        ...prev,
                        dealStartDate: date,
                        dealEndDate:
                          prev.dealEndDate &&
                          date &&
                          prev.dealEndDate < date
                            ? null
                            : prev.dealEndDate,
                      }));
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Deal Start Date"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />


                  <DatePicker
                    selected={form.dealEndDate}
                    onChange={(date) =>
                      setForm((prev) => ({
                        ...prev,
                        dealEndDate: date,
                      }))
                    }
                    minDate={
                      form.dealStartDate || null
                    }
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Deal End Date"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
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


              {/* DESCRIPTION */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                ">
                  Description
                </label>

                <textarea
                  rows={4}
                  placeholder="Describe this special offer..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description:
                        e.target.value,
                    }))
                  }
                  className="
                    w-full
                    border
                    border-gray-200
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    resize-none
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="
              sticky
              bottom-0
              bg-white
              border-t
              border-gray-100
              px-5
              sm:px-6
              py-4
              flex
              flex-col-reverse
              sm:flex-row
              sm:justify-end
              gap-3
            ">

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="
                  w-full
                  sm:w-auto
                  px-5
                  py-3
                  rounded-xl
                  bg-gray-100
                  hover:bg-gray-200
                  text-gray-700
                  text-sm
                  font-semibold
                  transition
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={saveDeal}
                disabled={saving}
                className="
                  w-full
                  sm:w-auto
                  min-w-[140px]
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
                  shadow-md
                  shadow-blue-200
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
                      animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave size={13} />

                    {editDeal
                      ? "Update Deal"
                      : "Save Deal"}
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}