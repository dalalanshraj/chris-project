import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import ListingCard from "../components/ListingDetails";
import { useSearchParams } from "react-router-dom";
// import ListingCard from "./ListingCard";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // ==========================
  // FETCH ALL LISTINGS
  // ==========================
  useEffect(() => {
    fetchListings();
  }, []);

   const fetchListings = async () => {
  try {
    const res = await api.get("/listings"); // 🔥 admin route
    
    setListings(res.data || []);
  } catch (err) {
    console.error("Fetch listings error:", err);
  } finally {
    setLoading(false);
  }
};

  // ==========================
  // TOGGLE STATUS (IMPORTANT)
  // ==========================
  const toggleStatus = async (id) => {
    try {
      const res = await api.put(
        `/listings/${id}/toggle-status`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      //  UPDATE ONLY THAT LISTING
      setListings((prev) =>
        prev.map((l) =>
          l._id === id ? { ...l, status: res.data.status } : l
        )
      );
    } catch (err) {
      console.error("Toggle error:", err);
      alert("Status update failed");
    }
  };

  // ==========================
  // DELETE LISTING
  // ==========================
  const deleteListing = async (id) => {
    if (!window.confirm("Delete this listing?")) return;

    try {
      await api.delete(
        `/listings/${id}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return <p className="p-10 text-gray-500">Loading listings...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Listings</h1>

      {listings.length === 0 && (
        <p className="text-gray-500">No listings found</p>
      )}

    <div className="flex flex-col gap-6">
        {listings.map((listing) => (
  <ListingCard
    key={listing._id}
    listing={listing}
    onToggleStatus={toggleStatus}
    onDelete={deleteListing}
  />
))}
{/* <ListingCard /> */}
      </div>
    </div>
  );
}