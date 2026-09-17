import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { FaCamera } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { RiLockPasswordLine } from "react-icons/ri";

export default function Profile() {
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    about: "",
    photo: "",
    imageFile: null,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    confirmCurrentPassword: "",
    newPassword: "",
  });

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

      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        about: res.data.about || "",
        photo: res.data.photo || "",
        imageFile: null,
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setForm({
      ...form,
      imageFile: file,
      photo: URL.createObjectURL(file),
    });
  };

  const saveProfile = async () => {
    try {
      await api.put(
        "/profile",
        {
          name: form.name,
          email: form.email,
          about: form.about,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Profile updated successfully");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const changePassword = async () => {
    try {
      await api.put("/admin/change-password", passwordForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Password Updated Successfully");

      setPasswordForm({
        currentPassword: "",
        confirmCurrentPassword: "",
        newPassword: "",
      });

      setShowPasswordModal(false);
    } catch (err) {
      console.log(err);

      alert(err.response?.data?.message || "Unable to change password");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* HEADER */}

        <div className="h-36 bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* PROFILE IMAGE */}

        <div className="-mt-16 flex justify-center">
          <div className="relative">
            <div className="w-36 h-36 rounded-full border-4 border-white overflow-hidden shadow-xl">
              {form.photo ? (
                <img
                  src={form.photo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold">
                  {form.name?.charAt(0)}
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg"
            >
              <FaCamera />
            </button>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* BODY */}

        <div className="p-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

          {/* NAME */}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Full Name</label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* EMAIL */}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* ABOUT */}

          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">About</label>

            <textarea
              rows={5}
              name="about"
              value={form.about}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={saveProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium"
          >
            Save Changes
          </button>
          <div className="mt-10 border-t pt-8">
            <h2 className="text-xl font-semibold mb-5">Security</h2>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition"
            >
              <RiLockPasswordLine size={18} />
              Change Password
            </button>
          </div>
        </div>
      </div>
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-2xl w-[450px] p-8 relative shadow-2xl">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-5 top-5 text-2xl"
            >
              <IoClose />
            </button>

            <h2 className="text-2xl font-bold mb-6">Change Password</h2>

            <div className="space-y-5">
              <div>
                <label className="block mb-2">Current Password</label>

                <input
                  type="password"
                  className="w-full border rounded-xl px-4 py-3"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-2">Confirm Current Password</label>

                <input
                  type="password"
                  className="w-full border rounded-xl px-4 py-3"
                  value={passwordForm.confirmCurrentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmCurrentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-2">New Password</label>

                <input
                  type="password"
                  className="w-full border rounded-xl px-4 py-3"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-5">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-3 rounded-xl border"
                >
                  Cancel
                </button>

                <button
                  onClick={changePassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
