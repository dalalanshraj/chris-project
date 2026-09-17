import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import {
  FaEye,
  FaDownload,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaUsers,
  FaChild,
  FaHome,
} from "react-icons/fa";

export default function Inquiry() {
  const [inquiries, setInquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =====================================================
     FETCH INQUIRIES
  ====================================================== */

  const fetchInquiries = async () => {
    try {
      setLoading(true);

      const res = await api.get("/inquiries");

      setInquiries(res.data || []);
    } catch (error) {
      console.log("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  /* =====================================================
     DOWNLOAD INQUIRY
  ====================================================== */

  const download = (inq) => {
    const propertyName =
      inq.property?.property?.title || "N/A";

    const text = `
PROPERTY INQUIRY
==============================

Property: ${propertyName}

Guest Information
------------------------------
Name: ${inq.name || "N/A"}
Email: ${inq.email || "N/A"}
Phone: ${inq.phone || "N/A"}

Stay Information
------------------------------
Arrival: ${
      inq.Arrival
        ? new Date(inq.Arrival).toLocaleDateString()
        : "-"
    }

Departure: ${
      inq.Departure
        ? new Date(inq.Departure).toLocaleDateString()
        : "-"
    }

Adults: ${inq.Adults || 0}
Kids: ${inq.Kids || 0}

Message
------------------------------
${inq.message || "No message"}

Inquiry Date
------------------------------
${
  inq.createdAt
    ? new Date(inq.createdAt).toLocaleString()
    : "-"
}
`;

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `inquiry-${inq.name || "guest"}.txt`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     SUMMARY
  ====================================================== */

  const totalAdults = useMemo(() => {
    return inquiries.reduce(
      (total, item) =>
        total + Number(item.Adults || 0),
      0
    );
  }, [inquiries]);

  const totalKids = useMemo(() => {
    return inquiries.reduce(
      (total, item) =>
        total + Number(item.Kids || 0),
      0
    );
  }, [inquiries]);

  /* =====================================================
     DATE FORMAT
  ====================================================== */

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Inquiries
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Messages and booking inquiries submitted from property pages.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold">
            <FaEnvelope size={13} />
            {inquiries.length} Total
          </span>

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

        {/* TOTAL INQUIRIES */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Total Inquiries
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {inquiries.length}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaEnvelope />
            </div>

          </div>

        </div>

        {/* ADULTS */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Adults
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalAdults}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FaUsers />
            </div>

          </div>

        </div>

        {/* KIDS */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Kids
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalKids}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FaChild />
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          INQUIRY LIST
      ====================================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* SECTION HEADER */}

        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

          <div>

            <h3 className="font-bold text-gray-900">
              Guest Inquiries
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              View and manage messages received from guests.
            </p>

          </div>

          {inquiries.length > 0 && (
            <span className="hidden sm:inline-flex px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
              {inquiries.length} Records
            </span>
          )}

        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading ? (

          <div className="py-16 flex flex-col items-center justify-center">

            <div className="w-9 h-9 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

            <p className="text-sm text-gray-500 mt-3">
              Loading inquiries...
            </p>

          </div>

        ) : inquiries.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================== */

          <div className="py-16 px-5 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
              <FaEnvelope />
            </div>

            <h4 className="font-bold text-gray-800 mt-4">
              No inquiries found
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              Guest inquiries will appear here when someone contacts you.
            </p>

          </div>

        ) : (

          <>
            {/* =================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="hidden md:block overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-50 border-b border-gray-200">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Guest
                    </th>

                    <th className="px-5 py-4 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Property
                    </th>

                    <th className="px-5 py-4 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Stay
                    </th>

                    <th className="px-5 py-4 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Inquiry Date
                    </th>

                    <th className="px-5 py-4 text-center text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {inquiries.map((inq) => (

                    <tr
                      key={inq._id}
                      className="border-b last:border-b-0 border-gray-100 hover:bg-gray-50/70 transition"
                    >

                      {/* GUEST */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {inq.name
                              ?.charAt(0)
                              ?.toUpperCase() || "G"}
                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
                              {inq.name || "Guest"}
                            </p>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {inq.email || "No email"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* PROPERTY */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FaHome size={13} />
                          </div>

                          <p className="font-medium text-gray-700 max-w-[220px] truncate">
                            {inq.property?.property?.title ||
                              "N/A"}
                          </p>

                        </div>

                      </td>

                      {/* STAY */}

                      <td className="px-5 py-4">

                        <div className="text-xs space-y-1">

                          <p className="text-gray-700">

                            <span className="font-semibold">
                              Arrival:
                            </span>{" "}

                            {formatDate(inq.Arrival)}

                          </p>

                          <p className="text-gray-500">

                            <span className="font-semibold">
                              Departure:
                            </span>{" "}

                            {formatDate(inq.Departure)}

                          </p>

                        </div>

                      </td>

                      {/* CREATED */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-medium text-gray-700">
                          {formatDate(inq.createdAt)}
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {inq.createdAt
                            ? new Date(
                                inq.createdAt
                              ).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </p>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() =>
                              setSelected(inq)
                            }
                            title="View Inquiry"
                            className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition cursor-pointer"
                          >
                            <FaEye size={14} />
                          </button>

                          <button
                            onClick={() =>
                              download(inq)
                            }
                            title="Download Inquiry"
                            className="w-9 h-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition cursor-pointer"
                          >
                            <FaDownload size={14} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* =================================================
                MOBILE CARDS
            ================================================== */}

            <div className="md:hidden p-4 space-y-4">

              {inquiries.map((inq) => (

                <div
                  key={inq._id}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                >

                  {/* GUEST */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {inq.name
                          ?.charAt(0)
                          ?.toUpperCase() || "G"}
                      </div>

                      <div>

                        <p className="font-semibold text-gray-900">
                          {inq.name || "Guest"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {inq.email || "No email"}
                        </p>

                      </div>

                    </div>

                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      {formatDate(inq.createdAt)}
                    </span>

                  </div>

                  {/* PROPERTY */}

                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">

                    <div className="flex items-center gap-2">

                      <FaHome
                        size={13}
                        className="text-purple-600"
                      />

                      <span className="text-xs text-gray-400">
                        Property
                      </span>

                    </div>

                    <p className="font-semibold text-gray-800 mt-1">
                      {inq.property?.property?.title ||
                        "N/A"}
                    </p>

                  </div>

                  {/* STAY */}

                  <div className="grid grid-cols-2 gap-3 mt-3">

                    <div className="p-3 rounded-xl border border-gray-100">

                      <div className="flex items-center gap-2 text-xs text-gray-400">

                        <FaCalendarAlt
                          size={11}
                          className="text-blue-500"
                        />

                        Arrival

                      </div>

                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {formatDate(inq.Arrival)}
                      </p>

                    </div>

                    <div className="p-3 rounded-xl border border-gray-100">

                      <div className="flex items-center gap-2 text-xs text-gray-400">

                        <FaCalendarAlt
                          size={11}
                          className="text-purple-500"
                        />

                        Departure

                      </div>

                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {formatDate(inq.Departure)}
                      </p>

                    </div>

                  </div>

                  {/* GUEST COUNT */}

                  <div className="flex gap-2 mt-3">

                    <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                      Adults: {inq.Adults || 0}
                    </span>

                    <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
                      Kids: {inq.Kids || 0}
                    </span>

                  </div>

                  {/* MESSAGE */}

                  {inq.message && (

                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                      {inq.message}
                    </p>

                  )}

                  {/* ACTIONS */}

                  <div className="grid grid-cols-2 gap-2 mt-4">

                    <button
                      onClick={() =>
                        setSelected(inq)
                      }
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
                    >
                      <FaEye size={13} />
                      View
                    </button>

                    <button
                      onClick={() =>
                        download(inq)
                      }
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition cursor-pointer"
                    >
                      <FaDownload size={13} />
                      Download
                    </button>

                  </div>

                </div>

              ))}

            </div>

          </>

        )}

      </div>

      {/* =====================================================
          INQUIRY DETAIL MODAL
      ====================================================== */}

      {selected && (

        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
            }
          }}
        >

          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    {selected.name
                      ?.charAt(0)
                      ?.toUpperCase() || "G"}
                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      Inquiry Details
                    </h2>

                    <p className="text-sm text-gray-500 mt-0.5">
                      {selected.name || "Guest"}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setSelected(null)
                  }
                  className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
                >
                  ✕
                </button>

              </div>

            </div>

            {/* =================================================
                MODAL BODY
            ================================================== */}

            <div className="p-6 overflow-y-auto space-y-5">

              {/* PROPERTY */}

              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">

                <div className="flex items-center gap-2 text-purple-600">

                  <FaHome size={14} />

                  <span className="text-xs uppercase tracking-wide font-semibold">
                    Property
                  </span>

                </div>

                <p className="font-bold text-gray-900 mt-1">
                  {selected.property?.property?.title ||
                    "N/A"}
                </p>

              </div>

              {/* CONTACT */}

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                  Guest Information
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* NAME */}

                  <div className="border border-gray-200 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Name
                    </p>

                    <p className="font-semibold text-gray-800 mt-1">
                      {selected.name || "N/A"}
                    </p>

                  </div>

                  {/* EMAIL */}

                  <div className="border border-gray-200 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Email
                    </p>

                    <p className="font-semibold text-gray-800 mt-1 break-all">
                      {selected.email || "N/A"}
                    </p>

                  </div>

                  {/* PHONE */}

                  <div className="border border-gray-200 rounded-xl p-4">

                    <div className="flex items-center gap-2">

                      <FaPhone
                        size={11}
                        className="text-green-500"
                      />

                      <p className="text-xs text-gray-400">
                        Phone
                      </p>

                    </div>

                    <p className="font-semibold text-gray-800 mt-1">
                      {selected.phone || "N/A"}
                    </p>

                  </div>

                  {/* CREATED */}

                  <div className="border border-gray-200 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Inquiry Date
                    </p>

                    <p className="font-semibold text-gray-800 mt-1">
                      {formatDateTime(
                        selected.createdAt
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* STAY INFORMATION */}

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                  Stay Information
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* ARRIVAL */}

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">

                    <div className="flex items-center gap-2 text-blue-600">

                      <FaCalendarAlt size={13} />

                      <span className="text-xs font-semibold">
                        Arrival
                      </span>

                    </div>

                    <p className="font-bold text-gray-800 mt-2">
                      {formatDate(
                        selected.Arrival
                      )}
                    </p>

                  </div>

                  {/* DEPARTURE */}

                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">

                    <div className="flex items-center gap-2 text-purple-600">

                      <FaCalendarAlt size={13} />

                      <span className="text-xs font-semibold">
                        Departure
                      </span>

                    </div>

                    <p className="font-bold text-gray-800 mt-2">
                      {formatDate(
                        selected.Departure
                      )}
                    </p>

                  </div>

                  {/* ADULTS */}

                  <div className="border border-gray-200 rounded-xl p-4">

                    <div className="flex items-center gap-2 text-green-600">

                      <FaUsers size={13} />

                      <span className="text-xs font-semibold">
                        Adults
                      </span>

                    </div>

                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {selected.Adults || 0}
                    </p>

                  </div>

                  {/* KIDS */}

                  <div className="border border-gray-200 rounded-xl p-4">

                    <div className="flex items-center gap-2 text-purple-600">

                      <FaChild size={13} />

                      <span className="text-xs font-semibold">
                        Kids
                      </span>

                    </div>

                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {selected.Kids || 0}
                    </p>

                  </div>

                </div>

              </div>

              {/* MESSAGE */}

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                  Guest Message
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">

                  <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                    {selected.message ||
                      "No message provided."}
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================== */}

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  onClick={() =>
                    download(selected)
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition cursor-pointer"
                >
                  <FaDownload size={14} />
                  Download
                </button>

                <button
                  onClick={() =>
                    setSelected(null)
                  }
                  className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition cursor-pointer"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}