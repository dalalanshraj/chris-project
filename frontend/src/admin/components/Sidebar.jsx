import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MdDashboard,
  MdPeople,
  MdListAlt,
  MdAddBox,
  MdLogout,
} from "react-icons/md";

import api from "../../api/axios";  

const Sidebar = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:4015";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
      isActive
        ? "bg-[#EBE8FF] text-black"
        : "text-black hover:bg-gray-200 hover:text-black"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-[#F8F9FA] shadow-xl text-black p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

      <div className="mb-6 border-b border-gray-700 pb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 bg-gray-700">
          {user?.photo ? (
            <img
              src={`${API_URL}${user.photo}`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white text-black font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400">Logged in as</p>
          <h3 className="font-semibold text-sm">
            {user?.name}
          </h3>
        </div>
      </div>

      <nav className="space-y-2 flex flex-col flex-grow ">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <MdDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/admin/listings" end className={linkClass}>
          <MdListAlt size={20} />
          Listings
        </NavLink>

        <NavLink to="/admin/users" className={linkClass}>
          <MdPeople size={20} />
          My Profile
        </NavLink>

        {user?.role === "superadmin" && (
          <NavLink
            to="/admin/listings/property_add"
            className={linkClass}
          >
            <MdAddBox size={20} />
            Add Listing
          </NavLink>
        )}

        <NavLink to="/admin/gallery" className={linkClass}>
          <MdAddBox size={20} />
          Gallery
        </NavLink>
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 hover:text-red-500 text-black px-4 py-2 rounded-lg mt-6"
      >
        <MdLogout size={20} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;