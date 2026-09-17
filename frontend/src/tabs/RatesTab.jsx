import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useModal } from "../context/ModalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ===============================
   EMPTY STRUCTURES
================================ */

const emptyRate = {
  season: "",
  from: null,
  to: null,
  nightly: "",
  weekly: "0",
  monthly: "0",
  minNights: "",
};

const emptyFee = {
  name: "",
  value: "",
  type: "$",
  option: "mandatory",
};

export default function RatesTab({ listingId, goNextTab }) {
  const [rates, setRates] = useState([]);
  const [extraFees, setExtraFees] = useState([]);

  const [form, setForm] = useState(emptyRate);
  const [feeForm, setFeeForm] = useState(emptyFee);

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editFeeIndex, setEditFeeIndex] = useState(null);
  const [editRateIndex, setEditRateIndex] = useState(null);

  const [savingRate, setSavingRate] = useState(false);
  const [savingFee, setSavingFee] = useState(false);

  const { showModal } = useModal();

  /* ===============================
     NORMALIZE DATE
  ================================ */

  const normalizeDate = (date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0
    );
  };

  /* ===============================
     LOAD LISTING DATA
  ================================ */

  useEffect(() => {
    if (!listingId) return;

    api
      .get(`/listings/${listingId}`)
      .then((res) => {
        setRates(res.data?.rates || []);
        setExtraFees(res.data?.extraFees || []);
      })
      .catch((err) => console.log(err));
  }, [listingId]);

  /* ===============================
     DATE INPUT HANDLER
  ================================ */

  const handleManualDate = (field, e) => {
    let value = e.target.value;

    value = value.replaceAll("-", "/");

    e.target.value = value;

    const parts = value.split("/");

    if (parts.length !== 3) return;

    const [month, day, year] = parts;

    if (
      month.length === 2 &&
      day.length === 2 &&
      year.length === 4
    ) {
      const parsed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12
      );

      if (!isNaN(parsed.getTime())) {
        setForm((prev) => ({
          ...prev,
          [field]: parsed,
        }));
      }
    }
  };

  /* ===============================
     ADD / EDIT RATE
  ================================ */

  const addRate = async () => {
    if (!form.season || !form.nightly || !form.from || !form.to) {
      showModal("All fields required");
      return;
    }

    if (new Date(form.from) > new Date(form.to)) {
      showModal("From date must be before To date");
      return;
    }

    if (!form.minNights || Number(form.minNights) < 1) {
      showModal("Minimum nights must be at least 1");
      return;
    }

    try {
      setSavingRate(true);

      let res;

      const rate = {
        ...form,
        nightly: Number(form.nightly),
        weekly: Number(form.weekly),
        monthly: Number(form.monthly),
        minNights: Number(form.minNights),
        from: normalizeDate(form.from),
        to: normalizeDate(form.to),
      };

      if (editRateIndex !== null) {
        res = await api.put(`/listings/${listingId}/rates/edit`, {
          index: editRateIndex,
          rate,
        });
      } else {
        res = await api.put(`/listings/${listingId}/rates`, {
          rate,
        });
      }

      setRates(res.data.rates);
      setForm(emptyRate);
      setEditRateIndex(null);
    } catch (err) {
      console.log(err);
      showModal("Failed to save rate");
    } finally {
      setSavingRate(false);
    }
  };

  /* ===============================
     EDIT RATE
  ================================ */

  const editRate = (rate, index) => {
    setForm({
      season: rate.season || "",
      from: rate.from ? new Date(rate.from) : null,
      to: rate.to ? new Date(rate.to) : null,
      nightly: rate.nightly ?? "",
      weekly: rate.weekly ?? "0",
      monthly: rate.monthly ?? "0",
      minNights: rate.minNights ?? "",
    });

    setEditRateIndex(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ===============================
     CANCEL RATE EDIT
  ================================ */

  const cancelRateEdit = () => {
    setForm(emptyRate);
    setEditRateIndex(null);
  };

  /* ===============================
     DELETE RATE
  ================================ */

  const deleteRate = async (index) => {
    try {
      const res = await api.put(
        `/listings/${listingId}/rates/delete`,
        {
          index,
        }
      );

      setRates(res.data.rates);

      if (editRateIndex === index) {
        cancelRateEdit();
      }
    } catch {
      showModal("Delete failed");
    }
  };

  /* ===============================
     SAVE EXTRA FEE
  ================================ */

  const saveExtraFee = async () => {
    if (!feeForm.name || !feeForm.value) {
      showModal("Fee name and value are required");
      return;
    }

    try {
      setSavingFee(true);

      const url =
        editFeeIndex !== null
          ? "/extra-fees/edit"
          : "/extra-fees";

      const payload =
        editFeeIndex !== null
          ? {
              index: editFeeIndex,
              fee: feeForm,
            }
          : feeForm;

      const res = await api.put(
        `/listings/${listingId}${url}`,
        payload
      );

      setExtraFees(res.data);

      setFeeForm(emptyFee);
      setEditFeeIndex(null);
      setShowFeeModal(false);
    } catch (err) {
      console.log(err);
      showModal("Fee save failed");
    } finally {
      setSavingFee(false);
    }
  };

  /* ===============================
     EDIT EXTRA FEE
  ================================ */

  const editExtraFee = (fee, index) => {
    setFeeForm({
      name: fee.name || "",
      value: fee.value || "",
      type: fee.type || "$",
      option: fee.option || "mandatory",
    });

    setEditFeeIndex(index);
    setShowFeeModal(true);
  };

  /* ===============================
     DELETE EXTRA FEE
  ================================ */

  const deleteExtraFee = async (index) => {
    try {
      const res = await api.put(
        `/listings/${listingId}/extra-fees/delete`,
        {
          index,
        }
      );

      setExtraFees(res.data);
    } catch {
      showModal("Failed to delete fee");
    }
  };

  /* ===============================
     SUMMARY
  ================================ */

  const nightlyRates = rates
    .map((r) => Number(r.nightly))
    .filter((value) => !isNaN(value) && value > 0);

  const minNightly = nightlyRates.length
    ? Math.min(...nightlyRates)
    : 0;

  const maxNightly = nightlyRates.length
    ? Math.max(...nightlyRates)
    : 0;

  const avgNightly = nightlyRates.length
    ? (
        nightlyRates.reduce((a, b) => a + b, 0) /
        nightlyRates.length
      ).toFixed(2)
    : "0.00";

  const minNightsOverall =
    rates.length > 0
      ? Math.min(
          ...rates.map((r) => Number(r.minNights || 0))
        )
      : 0;

  return (
    <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 space-y-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Rates & Fees
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage seasonal pricing, nightly rates and additional fees.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
            {rates.length} {rates.length === 1 ? "Rate" : "Rates"}
          </span>

          <span className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold">
            {extraFees.length}{" "}
            {extraFees.length === 1 ? "Fee" : "Fees"}
          </span>

        </div>
      </div>

      {/* =====================================================
          RATE FORM
      ====================================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

        {/* FORM HEADER */}

        <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editRateIndex !== null
                  ? "Edit Rental Rate"
                  : "Add Rental Rate"}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                Set pricing for a specific season and date range.
              </p>
            </div>

            {editRateIndex !== null && (
              <button
                type="button"
                onClick={cancelRateEdit}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition cursor-pointer"
              >
                Cancel Edit
              </button>
            )}

          </div>
        </div>

        {/* FORM */}

        <div className="p-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">

            {/* SEASON */}

            <div className="xl:col-span-1">

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Season
              </label>

              <input
                type="text"
                placeholder="e.g. Summer"
                value={form.season}
                onChange={(e) =>
                  setForm({
                    ...form,
                    season: e.target.value,
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            {/* FROM */}

            <div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                From Date
              </label>

              <DatePicker
                selected={form.from}
                onChange={(date) =>
                  setForm({
                    ...form,
                    from: date,
                  })
                }
                onChangeRaw={(e) =>
                  handleManualDate("from", e)
                }
                selectsStart
                startDate={form.from}
                endDate={form.to}
                dateFormat="MM/dd/yyyy"
                placeholderText="MM/DD/YYYY"
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                isClearable
                portalId="root"
              />

            </div>

            {/* TO */}

            <div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                To Date
              </label>

              <DatePicker
                selected={form.to}
                onChange={(date) =>
                  setForm({
                    ...form,
                    to: date,
                  })
                }
                onChangeRaw={(e) =>
                  handleManualDate("to", e)
                }
                selectsEnd
                startDate={form.from}
                endDate={form.to}
                minDate={form.from}
                dateFormat="MM/dd/yyyy"
                placeholderText="MM/DD/YYYY"
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                isClearable
                portalId="root"
              />

            </div>

            {/* NIGHTLY */}

            <div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nightly
              </label>

              <div className="relative">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.nightly}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nightly: e.target.value,
                    })
                  }
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* WEEKLY */}

            <div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Weekly
              </label>

              <div className="relative">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.weekly}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      weekly: e.target.value,
                    })
                  }
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* MONTHLY */}

            <div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Monthly
              </label>

              <div className="relative">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.monthly}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      monthly: e.target.value,
                    })
                  }
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* MIN NIGHTS */}

            <div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Min Nights
              </label>

              <input
                type="number"
                min="1"
                placeholder="1"
                value={form.minNights}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minNights: e.target.value,
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* ACTION */}

          <div className="mt-5 flex justify-end">

            <button
              onClick={addRate}
              disabled={savingRate}
              className={`
                min-w-[130px] h-11 px-5 rounded-xl
                text-sm font-semibold text-white
                shadow-sm transition-all duration-200
                ${
                  savingRate
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] cursor-pointer"
                }
              `}
            >
              {savingRate
                ? "Saving..."
                : editRateIndex !== null
                ? "Update Rate"
                : "+ Add Rate"}
            </button>

          </div>

        </div>
      </div>

      {/* =====================================================
          RATE LIST
      ====================================================== */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Rental Rates
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Your configured seasonal pricing.
            </p>
          </div>

        </div>

        {rates.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 text-center">

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
              $
            </div>

            <h4 className="font-semibold text-gray-800">
              No rates added yet
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              Add your first seasonal rental rate above.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {rates.map((rate, i) => (

              <div
                key={i}
                className={`
                  group bg-white border rounded-2xl p-4
                  transition-all duration-200
                  hover:shadow-md
                  ${
                    editRateIndex === i
                      ? "border-blue-400 ring-4 ring-blue-50"
                      : "border-gray-200"
                  }
                `}
              >

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-center">

                  {/* SEASON */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      Season
                    </p>

                    <p className="font-semibold text-gray-800 mt-1">
                      {rate.season || "—"}
                    </p>

                  </div>

                  {/* FROM */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      From
                    </p>

                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {rate.from
                        ? new Date(rate.from).toLocaleDateString(
                            "en-US"
                          )
                        : "—"}
                    </p>

                  </div>

                  {/* TO */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      To
                    </p>

                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {rate.to
                        ? new Date(rate.to).toLocaleDateString(
                            "en-US"
                          )
                        : "—"}
                    </p>

                  </div>

                  {/* NIGHTLY */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      Nightly
                    </p>

                    <p className="text-lg font-bold text-blue-600 mt-1">
                      ${rate.nightly}
                    </p>

                  </div>

                  {/* WEEKLY */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      Weekly
                    </p>

                    <p className="font-semibold text-gray-800 mt-1">
                      ${rate.weekly}
                    </p>

                  </div>

                  {/* MONTHLY */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      Monthly
                    </p>

                    <p className="font-semibold text-gray-800 mt-1">
                      ${rate.monthly}
                    </p>

                  </div>

                  {/* MIN NIGHTS */}

                  <div>

                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      Min Nights
                    </p>

                    <span className="inline-flex mt-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      {rate.minNights}
                    </span>

                  </div>

                  {/* ACTIONS */}

                  <div className="flex xl:justify-end gap-2">

                    <button
                      onClick={() => editRate(rate, i)}
                      className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteRate(i)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition cursor-pointer"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

      {/* =====================================================
          EXTRA FEES
      ====================================================== */}

      <div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Additional Fees
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Configure cleaning fees, service fees and other charges.
            </p>
          </div>

          <button
            onClick={() => {
              setFeeForm(emptyFee);
              setEditFeeIndex(null);
              setShowFeeModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 hover:shadow-md transition-all cursor-pointer"
          >
            + Add New Fee
          </button>

        </div>

        {extraFees.length === 0 ? (

          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-10 text-center">

            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-50 flex items-center justify-center text-xl">
              %
            </div>

            <h4 className="font-semibold text-gray-800">
              No additional fees
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              Add a fee if your property has extra charges.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {extraFees.map((fee, i) => (

              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                      Fee
                    </p>

                    <h4 className="font-bold text-gray-900 mt-1">
                      {fee.name}
                    </h4>

                  </div>

                  <span
                    className={`
                      px-2.5 py-1 rounded-full text-[11px] font-semibold
                      ${
                        fee.option === "mandatory"
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }
                    `}
                  >
                    {fee.option === "mandatory"
                      ? "Mandatory"
                      : "Optional"}
                  </span>

                </div>

                <div className="mt-5 flex items-end justify-between">

                  <div>

                    <p className="text-xs text-gray-400">
                      Amount
                    </p>

                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {fee.type === "$" ? "$" : ""}
                      {fee.value}
                      {fee.type === "%" ? "%" : ""}
                    </p>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() => editExtraFee(fee, i)}
                      className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteExtraFee(i)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition cursor-pointer"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      {rates.length > 0 && (

        <div>

          <div className="mb-4">

            <h3 className="text-xl font-bold text-gray-900">
              Rate Summary
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Quick overview of your configured pricing.
            </p>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* MIN */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Min Nightly
              </p>

              <p className="text-2xl font-bold text-blue-600 mt-2">
                ${minNightly}
              </p>

            </div>

            {/* MAX */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Max Nightly
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${maxNightly}
              </p>

            </div>

            {/* AVG */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Avg Nightly
              </p>

              <p className="text-2xl font-bold text-purple-600 mt-2">
                ${avgNightly}
              </p>

            </div>

            {/* MIN NIGHTS */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Min Nights
              </p>

              <p className="text-2xl font-bold text-green-600 mt-2">
                {minNightsOverall}
              </p>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          EXTRA FEE MODAL
      ====================================================== */}

      {showFeeModal && (

        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeeModal(false);
            }
          }}
        >

          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-gray-900">
                    {editFeeIndex !== null
                      ? "Edit Extra Fee"
                      : "Add Extra Fee"}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Configure the additional charge.
                  </p>

                </div>

                <button
                  onClick={() => setShowFeeModal(false)}
                  className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                >
                  ✕
                </button>

              </div>

            </div>

            {/* MODAL BODY */}

            <div className="p-6 space-y-4">

              {/* NAME */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Fee Name
                </label>

                <input
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g. Cleaning Fee"
                  value={feeForm.name}
                  onChange={(e) =>
                    setFeeForm({
                      ...feeForm,
                      name: e.target.value,
                    })
                  }
                />

              </div>

              {/* VALUE */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Fee Value
                </label>

                <input
                  type="number"
                  min="0"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter amount"
                  value={feeForm.value}
                  onChange={(e) =>
                    setFeeForm({
                      ...feeForm,
                      value: e.target.value,
                    })
                  }
                />

              </div>

              {/* TYPE */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Fee Type
                </label>

                <select
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={feeForm.type}
                  onChange={(e) =>
                    setFeeForm({
                      ...feeForm,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="$">Fixed Amount ($)</option>
                  <option value="%">Percentage (%)</option>
                </select>

              </div>

              {/* OPTION */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Fee Option
                </label>

                <select
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={feeForm.option}
                  onChange={(e) =>
                    setFeeForm({
                      ...feeForm,
                      option: e.target.value,
                    })
                  }
                >
                  <option value="mandatory">
                    Mandatory
                  </option>

                  <option value="optional">
                    Optional
                  </option>
                </select>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowFeeModal(false);
                  setEditFeeIndex(null);
                  setFeeForm(emptyFee);
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={saveExtraFee}
                disabled={savingFee}
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition
                  ${
                    savingFee
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  }
                `}
              >
                {savingFee
                  ? "Saving..."
                  : editFeeIndex !== null
                  ? "Update Fee"
                  : "Save Fee"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}