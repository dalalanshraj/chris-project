import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import {
  FaCheck,
  FaTrash,
  FaEye,
  FaReply,
  FaPlus,
} from "react-icons/fa";
import { IoMdStar } from "react-icons/io";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ReviewsTab({ listingId }) {
  const [reviewForm, setReviewForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    stayDate: null,
    review: "",
    rating: 5,
  });

  const [reviews, setReviews] = useState([]);

  const [openReview, setOpenReview] = useState(null);

  const [replyReview, setReplyReview] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [showReviewModal, setShowReviewModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [savingReply, setSavingReply] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  /* =========================================================
     FETCH REVIEWS
  ========================================================== */

  const fetchReviews = async () => {
    if (!listingId) return;

    try {
      setLoading(true);

      const res = await api.get(`/listings/${listingId}`);

      setReviews(res.data?.reviews || []);
    } catch (error) {
      console.log("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [listingId]);

  /* =========================================================
     SUMMARY
  ========================================================== */

  const publishedCount = reviews.filter(
    (review) => review.published
  ).length;

  const pendingCount = reviews.filter(
    (review) => !review.published
  ).length;

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  /* =========================================================
     PUBLISH REVIEW
  ========================================================== */

  const publishReview = async (id) => {
    try {
      setPublishingId(id);

      await api.put(
        `/listings/${listingId}/reviews/${id}/publish`
      );

      await fetchReviews();
    } catch (error) {
      console.log(error);
      alert("Failed to publish review");
    } finally {
      setPublishingId(null);
    }
  };

  /* =========================================================
     DELETE REVIEW
  ========================================================== */

  const deleteReview = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await api.delete(
        `/listings/${listingId}/reviews/${id}`
      );

      await fetchReviews();

      if (openReview?._id === id) {
        setOpenReview(null);
      }
    } catch (error) {
      console.log(error);
      alert("Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     SAVE REPLY
  ========================================================== */

  const saveReply = async () => {
    if (!replyReview?._id) return;

    if (!replyText.trim()) {
      alert("Please enter a reply");
      return;
    }

    try {
      setSavingReply(true);

      await api.put(
        `/listings/${listingId}/reviews/${replyReview._id}/reply`,
        {
          reply: replyText,
        }
      );

      setReplyReview(null);
      setReplyText("");

      await fetchReviews();
    } catch (error) {
      console.log(error);
      alert("Failed to save reply");
    } finally {
      setSavingReply(false);
    }
  };

  /* =========================================================
     SUBMIT REVIEW
  ========================================================== */

  const submitReview = async () => {
    if (
      !reviewForm.firstName.trim() ||
      !reviewForm.lastName.trim()
    ) {
      alert("Please enter first and last name");
      return;
    }

    if (!reviewForm.title.trim()) {
      alert("Please enter review title");
      return;
    }

    if (!reviewForm.review.trim()) {
      alert("Please enter review");
      return;
    }

    if (!reviewForm.rating) {
      alert("Please select rating");
      return;
    }

    try {
      setSavingReview(true);

      await api.post(`/listings/${listingId}/reviews`, {
        name:
          reviewForm.firstName.trim() +
          " " +
          reviewForm.lastName.trim(),

        email: reviewForm.email,

        title: reviewForm.title,

        stayDate: reviewForm.stayDate,

        message: reviewForm.review,

        rating: reviewForm.rating,
      });

      alert("Review Added");

      setShowReviewModal(false);

      setReviewForm({
        firstName: "",
        lastName: "",
        title: "",
        email: "",
        stayDate: null,
        review: "",
        rating: 5,
      });

      await fetchReviews();
    } catch (error) {
      console.log(error);
      alert("Failed to add review");
    } finally {
      setSavingReview(false);
    }
  };

  /* =========================================================
     RESET REVIEW FORM
  ========================================================== */

  const closeReviewModal = () => {
    setShowReviewModal(false);

    setReviewForm({
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      stayDate: null,
      review: "",
      rating: 5,
    });
  };

  /* =========================================================
     STAR COMPONENT
  ========================================================== */

  const Stars = ({ rating = 0, size = 20 }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <IoMdStar
            key={star}
            size={size}
            className={
              Number(rating) >= star
                ? "text-[#FFD250]"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Property Reviews
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage guest reviews, ratings and responses.
          </p>
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="
            inline-flex items-center justify-center gap-2
            px-5 py-2.5 rounded-xl
            bg-blue-600 text-white
            text-sm font-semibold
            hover:bg-blue-700
            hover:shadow-md
            active:scale-[0.98]
            transition-all
            cursor-pointer
          "
        >
          <FaPlus size={13} />
          Add Review
        </button>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* TOTAL */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Total Reviews
          </p>

          <div className="flex items-end justify-between mt-2">

            <p className="text-3xl font-bold text-gray-900">
              {reviews.length}
            </p>

            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FaEye />
            </div>

          </div>

        </div>

        {/* RATING */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Average Rating
          </p>

          <div className="flex items-center gap-2 mt-2">

            <p className="text-3xl font-bold text-gray-900">
              {averageRating}
            </p>

            <IoMdStar
              size={27}
              className="text-[#FFD250]"
            />

          </div>

        </div>

        {/* PUBLISHED */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Published
          </p>

          <div className="flex items-end justify-between mt-2">

            <p className="text-3xl font-bold text-green-600">
              {publishedCount}
            </p>

            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <FaCheck />
            </div>

          </div>

        </div>

        {/* PENDING */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Pending
          </p>

          <div className="flex items-end justify-between mt-2">

            <p className="text-3xl font-bold text-yellow-600">
              {pendingCount}
            </p>

            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
              !
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          REVIEWS SECTION
      ====================================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* SECTION HEADER */}

        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

          <div>
            <h3 className="font-bold text-gray-900">
              Guest Reviews
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Review activity for this property.
            </p>
          </div>

          {reviews.length > 0 && (
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
              {reviews.length} Reviews
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
              Loading reviews...
            </p>

          </div>

        ) : reviews.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================== */

          <div className="py-16 text-center px-5">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
              ★
            </div>

            <h4 className="font-bold text-gray-800 mt-4">
              No reviews yet
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              Add the first guest review for this property.
            </p>

            <button
              onClick={() => setShowReviewModal(true)}
              className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
            >
              + Add Review
            </button>

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
                      Review
                    </th>

                    <th className="px-5 py-4 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Guest
                    </th>

                    <th className="px-5 py-4 text-center text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Rating
                    </th>

                    <th className="px-5 py-4 text-center text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {reviews.map((r) => (

                    <tr
                      key={r._id}
                      className="border-b last:border-b-0 border-gray-100 hover:bg-gray-50/70 transition"
                    >

                      {/* REVIEW */}

                      <td className="px-5 py-4 max-w-[280px]">

                        <p className="font-semibold text-gray-900 truncate">
                          {r.title || "Untitled Review"}
                        </p>

                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {r.message || "No review text"}
                        </p>

                      </td>

                      {/* GUEST */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {r.name
                              ?.charAt(0)
                              ?.toUpperCase() || "G"}
                          </div>

                          <div>

                            <p className="font-semibold text-gray-800">
                              {r.name || "Guest"}
                            </p>

                            <p className="text-xs text-gray-400">
                              {r.email || "No email"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* RATING */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-1.5">

                          <Stars
                            rating={r.rating}
                            size={18}
                          />

                          <span className="font-semibold text-gray-700">
                            {r.rating}/5
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4 text-center">

                        <span
                          className={`
                            inline-flex items-center gap-1.5
                            px-3 py-1.5 rounded-full
                            text-xs font-semibold
                            ${
                              r.published
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                            }
                          `}
                        >

                          <span
                            className={`
                              w-1.5 h-1.5 rounded-full
                              ${
                                r.published
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }
                            `}
                          />

                          {r.published
                            ? "Published"
                            : "Pending"}

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-center gap-2">

                          {/* VIEW */}

                          <button
                            onClick={() =>
                              setOpenReview(r)
                            }
                            title="View Review"
                            className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
                          >
                            <FaEye size={14} />
                          </button>

                          {/* PUBLISH */}

                          {!r.published && (

                            <button
                              onClick={() =>
                                publishReview(r._id)
                              }
                              disabled={
                                publishingId === r._id
                              }
                              title="Publish Review"
                              className="w-9 h-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                              {publishingId ===
                              r._id ? (
                                <span className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
                              ) : (
                                <FaCheck size={14} />
                              )}
                            </button>

                          )}

                          {/* REPLY */}

                          <button
                            onClick={() => {
                              setReplyReview(r);
                              setReplyText(
                                r.reply || ""
                              );
                            }}
                            title="Reply"
                            className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition flex items-center justify-center cursor-pointer"
                          >
                            <FaReply size={14} />
                          </button>

                          {/* DELETE */}

                          <button
                            onClick={() =>
                              deleteReview(r._id)
                            }
                            disabled={
                              deletingId === r._id
                            }
                            title="Delete Review"
                            className="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === r._id ? (
                              <span className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <FaTrash size={14} />
                            )}
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

              {reviews.map((r) => (

                <div
                  key={r._id}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                >

                  {/* TOP */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {r.name
                          ?.charAt(0)
                          ?.toUpperCase() || "G"}
                      </div>

                      <div>

                        <p className="font-semibold text-gray-900">
                          {r.name || "Guest"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {r.email || "No email"}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`
                        text-[11px] font-semibold
                        px-2.5 py-1 rounded-full
                        ${
                          r.published
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }
                      `}
                    >
                      {r.published
                        ? "Published"
                        : "Pending"}
                    </span>

                  </div>

                  {/* TITLE */}

                  <h4 className="font-bold text-gray-900 mt-4">
                    {r.title || "Untitled Review"}
                  </h4>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {r.message || "No review text"}
                  </p>

                  {/* RATING */}

                  <div className="flex items-center gap-2 mt-3">

                    <Stars
                      rating={r.rating}
                      size={18}
                    />

                    <span className="text-sm font-semibold text-gray-600">
                      {r.rating}/5
                    </span>

                  </div>

                  {/* ACTIONS */}

                  <div className="grid grid-cols-2 gap-2 mt-4">

                    <button
                      onClick={() =>
                        setOpenReview(r)
                      }
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
                    >
                      <FaEye size={13} />
                      View
                    </button>

                    {!r.published ? (

                      <button
                        onClick={() =>
                          publishReview(r._id)
                        }
                        disabled={
                          publishingId === r._id
                        }
                        className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition cursor-pointer disabled:opacity-50"
                      >
                        <FaCheck size={13} />
                        Publish
                      </button>

                    ) : (

                      <button
                        onClick={() => {
                          setReplyReview(r);
                          setReplyText(
                            r.reply || ""
                          );
                        }}
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition cursor-pointer"
                      >
                        <FaReply size={13} />
                        Reply
                      </button>

                    )}

                  </div>

                  <div className="mt-2">

                    <button
                      onClick={() =>
                        deleteReview(r._id)
                      }
                      disabled={
                        deletingId === r._id
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <FaTrash size={13} />
                      Delete Review
                    </button>

                  </div>

                </div>

              ))}

            </div>
          </>

        )}

      </div>

      {/* =====================================================
          VIEW REVIEW MODAL
      ====================================================== */}

      {openReview && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex items-start justify-between gap-4">

              <div className="min-w-0">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {openReview.name
                      ?.charAt(0)
                      ?.toUpperCase() || "G"}
                  </div>

                  <div>

                    <h3 className="text-xl font-bold text-gray-900">
                      {openReview.name || "Guest"}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {openReview.email ||
                        "No email provided"}
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={() => setOpenReview(null)}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
              >
                ✕
              </button>

            </div>

            {/* BODY */}

            <div className="p-6 overflow-y-auto space-y-5">

              {/* TITLE */}

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                  Review
                </p>

                <h4 className="text-2xl font-bold text-gray-900 mt-1">
                  {openReview.title ||
                    "Untitled Review"}
                </h4>

              </div>

              {/* RATING + DATE */}

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-2">

                  <Stars
                    rating={openReview.rating}
                    size={25}
                  />

                  <span className="font-bold text-gray-700">
                    {openReview.rating}/5
                  </span>

                </div>

                <div className="text-sm text-gray-500">

                  <span className="font-semibold text-gray-700">
                    Stay Date:
                  </span>{" "}

                  {openReview.stayDate
                    ? new Date(
                        openReview.stayDate
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "N/A"}

                </div>

              </div>

              {/* REVIEW MESSAGE */}

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">

                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                  Guest Comment
                </p>

                <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                  {openReview.message ||
                    "No review message."}
                </p>

              </div>

              {/* REPLY */}

              {openReview.reply && (

                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">

                  <div className="flex items-center gap-2 mb-3">

                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                      <FaReply size={13} />
                    </div>

                    <p className="text-sm font-bold text-green-700">
                      Admin Reply
                    </p>

                  </div>

                  <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                    {openReview.reply}
                  </p>

                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="border-t border-gray-200 p-4">

              <div className="flex gap-3">

                <button
                  onClick={() => {
                    setReplyReview(openReview);
                    setReplyText(
                      openReview.reply || ""
                    );
                    setOpenReview(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaReply size={14} />
                  {openReview.reply
                    ? "Edit Reply"
                    : "Reply"}
                </button>

                <button
                  onClick={() => setOpenReview(null)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition cursor-pointer"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          REPLY MODAL
      ====================================================== */}

      {replyReview && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">

          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-gray-900">
                    Reply to Review
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Respond to {replyReview.name || "guest"}'s review.
                  </p>

                </div>

                <button
                  onClick={() => {
                    setReplyReview(null);
                    setReplyText("");
                  }}
                  className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer"
                >
                  ✕
                </button>

              </div>

            </div>

            {/* BODY */}

            <div className="p-6">

              {/* REVIEW PREVIEW */}

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">

                <p className="font-semibold text-gray-800">
                  {replyReview.title ||
                    "Untitled Review"}
                </p>

                <div className="mt-2">

                  <Stars
                    rating={replyReview.rating}
                    size={17}
                  />

                </div>

              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Reply
              </label>

              <textarea
                rows={6}
                placeholder="Write your response..."
                className="w-full border border-gray-200 rounded-2xl p-4 text-sm outline-none resize-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition"
                value={replyText}
                onChange={(e) =>
                  setReplyText(e.target.value)
                }
              />

            </div>

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">

              <button
                onClick={() => {
                  setReplyReview(null);
                  setReplyText("");
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={saveReply}
                disabled={savingReply}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-purple-700 transition cursor-pointer disabled:opacity-50"
              >
                {savingReply
                  ? "Saving..."
                  : "Save Reply"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          ADD REVIEW MODAL
      ====================================================== */}

      {showReviewModal && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">

          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold text-gray-900">
                  Add Review
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Add a guest review manually.
                </p>

              </div>

              <button
                onClick={closeReviewModal}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer"
              >
                ✕
              </button>

            </div>

            {/* BODY */}

            <div className="p-6 overflow-y-auto">

              <div className="space-y-4">

                {/* NAME */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      First Name
                    </label>

                    <input
                      placeholder="First Name"
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                      value={reviewForm.firstName}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          firstName:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Last Name
                    </label>

                    <input
                      placeholder="Last Name"
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                      value={reviewForm.lastName}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          lastName:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>

                  <input
                    type="email"
                    placeholder="guest@example.com"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    value={reviewForm.email}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        email: e.target.value,
                      })
                    }
                  />

                </div>

                {/* TITLE */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Review Title
                  </label>

                  <input
                    placeholder="e.g. Amazing stay!"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        title: e.target.value,
                      })
                    }
                  />

                </div>

                {/* RATING */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rating
                  </label>

                  <div className="flex items-center gap-1">

                    {[1, 2, 3, 4, 5].map(
                      (star) => (

                        <button
                          type="button"
                          key={star}
                          onClick={() =>
                            setReviewForm({
                              ...reviewForm,
                              rating: star,
                            })
                          }
                          className="p-1 hover:scale-110 transition cursor-pointer"
                        >

                          <IoMdStar
                            size={32}
                            className={
                              reviewForm.rating >=
                              star
                                ? "text-[#FFD250]"
                                : "text-gray-300"
                            }
                          />

                        </button>

                      )
                    )}

                    <span className="ml-2 text-sm font-semibold text-gray-600">
                      {reviewForm.rating}/5
                    </span>

                  </div>

                </div>

                {/* STAY DATE */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Stay Date
                  </label>

                  <DatePicker
                    selected={
                      reviewForm.stayDate
                        ? new Date(
                            reviewForm.stayDate
                          )
                        : null
                    }
                    onChange={(date) =>
                      setReviewForm({
                        ...reviewForm,
                        stayDate: date,
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select stay date"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    isClearable
                    portalId="root"
                  />

                </div>

                {/* REVIEW */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Review
                  </label>

                  <textarea
                    placeholder="Write guest review..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-2xl p-4 text-sm outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    value={reviewForm.review}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        review:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">

              <div className="flex gap-3">

                <button
                  onClick={closeReviewModal}
                  className="flex-1 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={submitReview}
                  disabled={savingReview}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                >
                  {savingReview
                    ? "Submitting..."
                    : "Submit Review"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}