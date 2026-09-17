import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import {
  FaCamera,
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaKey,
  FaUserShield,
  FaSave,
  FaLock,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { RiLockPasswordLine } from "react-icons/ri";

export default function Users() {
  const token = localStorage.getItem("token");

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isSuperAdmin = currentUser?.role === "superadmin";

  const fileInputRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [myProfile, setMyProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClientPasswordModal, setShowClientPasswordModal] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    about: "",
    photo: "",
    imageFile: null,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    confirmCurrentPassword: "",
    newPassword: "",
  });

  const [clientPasswordForm, setClientPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // =========================================================
  // FETCH PROFILE
  // =========================================================

  useEffect(() => {
    fetchProfile();

    if (isSuperAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMyProfile(res.data);

      if (!isSuperAdmin) {
        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          about: res.data.about || "",
          photo: res.data.photo || "",
          imageFile: null,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH CLIENTS
  // =========================================================

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAllUsers(
        (res.data || []).filter(
          (user) => user.role === "admin"
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================================
  // SELECT CLIENT
  // =========================================================

  const handleSelectClient = (e) => {
    const user = allUsers.find(
      (u) => u._id === e.target.value
    );

    setSelectedUser(user || null);
    setEditingUser(user || null);

    if (!user) {
      setForm({
        name: "",
        email: "",
        about: "",
        photo: "",
        imageFile: null,
      });

      return;
    }

    setForm({
      name: user.name || "",
      email: user.email || "",
      about: user.about || "",
      photo: user.photo || "",
      imageFile: null,
    });
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // PHOTO UPLOAD
  // =========================================================

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    const preview = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      photo: preview,
    }));

    try {
      setUploadingPhoto(true);

      const formData = new FormData();

      formData.append("photo", file);

      let res;

      // SUPERADMIN → CLIENT PHOTO
      if (isSuperAdmin && selectedUser) {
        res = await api.post(
          `/admin/users/${selectedUser._id}/photo`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        await fetchUsers();

        setSelectedUser(res.data);
        setEditingUser(res.data);
      }

      // NORMAL ADMIN → OWN PHOTO
      else {
        res = await api.post(
          "/profile/photo",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const updatedUser = {
          ...JSON.parse(
            localStorage.getItem("user") || "{}"
          ),
          photo: res.data.photo,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        window.dispatchEvent(
          new Event("profileUpdated")
        );

        setMyProfile((prev) => ({
          ...prev,
          photo: res.data.photo,
        }));
      }

      setForm((prev) => ({
        ...prev,
        photo: res.data.photo,
        imageFile: null,
      }));

      alert("Photo uploaded successfully.");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
          "Photo upload failed."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // =========================================================
  // SAVE PROFILE / CLIENT
  // =========================================================

  const saveProfile = async () => {
    if (!form.name.trim()) {
      alert("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      alert("Email is required.");
      return;
    }

    try {
      setSaving(true);

      let res;

      // SUPERADMIN → UPDATE CLIENT
      if (isSuperAdmin && editingUser) {
        res = await api.put(
          `/admin/users/${editingUser._id}`,
          {
            name: form.name,
            email: form.email,
            about: form.about,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchUsers();

        setSelectedUser(res.data);
        setEditingUser(res.data);

        alert("Client updated successfully.");
      }

      // NORMAL ADMIN → UPDATE OWN PROFILE
      else {
        res = await api.put(
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
          }
        );

        const updatedUser = {
          ...currentUser,
          name: res.data.name,
          email: res.data.email,
          photo: res.data.photo,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        window.dispatchEvent(
          new Event("profileUpdated")
        );

        setMyProfile(res.data);

        alert("Profile updated successfully.");
      }
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CHANGE OWN PASSWORD
  // =========================================================

  const changePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.confirmCurrentPassword ||
      !passwordForm.newPassword
    ) {
      alert("All fields are required.");
      return;
    }

    if (
      passwordForm.currentPassword !==
      passwordForm.confirmCurrentPassword
    ) {
      alert("Current passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await api.put(
        "/profile/change-password",
        {
          currentPassword:
            passwordForm.currentPassword,

          confirmCurrentPassword:
            passwordForm.confirmCurrentPassword,

          newPassword:
            passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Password updated successfully.");

      setPasswordForm({
        currentPassword: "",
        confirmCurrentPassword: "",
        newPassword: "",
      });

      setShowPasswordModal(false);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
          "Password update failed."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================================================
  // CHANGE CLIENT PASSWORD
  // =========================================================

  const changeClientPassword = async () => {
    if (!selectedUser) {
      alert("Please select a client first.");
      return;
    }

    if (
      !clientPasswordForm.newPassword ||
      !clientPasswordForm.confirmPassword
    ) {
      alert("All fields are required.");
      return;
    }

    if (
      clientPasswordForm.newPassword !==
      clientPasswordForm.confirmPassword
    ) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await api.put(
        `/admin/users/${selectedUser._id}/change-password`,
        {
          newPassword:
            clientPasswordForm.newPassword,

          confirmPassword:
            clientPasswordForm.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Client password changed successfully."
      );

      setClientPasswordForm({
        newPassword: "",
        confirmPassword: "",
      });

      setShowClientPasswordModal(false);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
          "Unable to change client password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================================================
  // RESET CLIENT PASSWORD
  // =========================================================

  const handleResetPassword = async () => {
    if (!selectedUser) {
      alert("Select a client first.");
      return;
    }

    if (
      !window.confirm(
        `Reset ${selectedUser.name}'s password?`
      )
    ) {
      return;
    }

    try {
      const res = await api.put(
        `/admin/users/${selectedUser._id}/reset-password`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        res.data.message ||
          "Password reset successfully."
      );
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
          "Reset failed."
      );
    }
  };

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = () => {
    if (!form.photo) return "";

    if (form.photo.startsWith("blob:")) {
      return form.photo;
    }

    return `${import.meta.env.VITE_API_URL}${form.photo}`;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-sm text-slate-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EBE8FF] text-black flex items-center justify-center shadow-lg">
                <FaUserShield size={20} />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {isSuperAdmin
                    ? "User Management"
                    : "My Profile"}
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  {isSuperAdmin
                    ? "Manage client profiles and account security."
                    : "Manage your personal information and security."}
                </p>
              </div>
            </div>
          </div>

       
        </div>

        {/* =====================================================
            SUPERADMIN CLIENT SELECTOR
        ====================================================== */}

        {isSuperAdmin && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EBE8FF] flex items-center justify-center">
                  <FaUser size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Select Client
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Choose a client to manage their profile.
                  </p>
                </div>
              </div>

              <div className="w-full lg:max-w-md">
                <select
                  value={selectedUser?._id || ""}
                  onChange={handleSelectClient}
                  className="
                    w-full
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-2xl
                    px-4
                    py-3.5
                    text-sm
                    font-medium
                    text-slate-700
                    outline-none
                    cursor-pointer
                    focus:bg-white
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                    transition
                  "
                >
                  <option value="">
                    Select Client
                  </option>

                  {allUsers.map((user) => (
                    <option
                      key={user._id}
                      value={user._id}
                    >
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CLIENT ACTIONS */}

            {selectedUser && (
              <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-3">

                <button
                  onClick={() =>
                    setShowClientPasswordModal(true)
                  }
                  className="
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
                    shadow-lg
                    shadow-blue-200
                    transition
                  "
                >
                  <RiLockPasswordLine size={18} />
                  Change Password
                </button>

                <button
                  onClick={handleResetPassword}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-5
                    py-3
                    rounded-xl
                    bg-orange-500
                    hover:bg-orange-600
                    text-white
                    text-sm
                    font-semibold
                    shadow-lg
                    shadow-orange-100
                    transition
                  "
                >
                  <FaKey size={15} />
                  Reset Password
                </button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            PROFILE CARD
        ====================================================== */}

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_20px_70px_rgba(15,23,42,0.07)] overflow-hidden">

          {/* COVER */}

          <div className="relative h-44 md:h-52 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 overflow-hidden">

      

            <div className="absolute inset-0  bg-gradient-to-br from-[#90caf9] to-[#047edf]" />

            <div className="absolute left-6 top-6 md:left-8 md:top-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                <FaShieldAlt />
                Account Profile
              </div>
            </div>
          </div>

          {/* PROFILE */}

          <div className="px-5 md:px-8 lg:px-10 pb-10">

            <div className="-mt-20 md:-mt-24 flex flex-col items-center">

              {/* AVATAR */}

              <div className="relative group">

                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-[6px] border-white bg-white shadow-[0_15px_45px_rgba(15,23,42,0.20)]">

                  {getImageUrl() ? (
                    <img
                      src={getImageUrl()}
                      alt={form.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full   flex items-center justify-center text-black text-5xl md:text-6xl font-bold">
                      {form.name
                        ?.charAt(0)
                        ?.toUpperCase() || "A"}
                    </div>
                  )}

                  {uploadingPhoto && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* CAMERA */}

                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="
                    absolute
                    bottom-2
                    right-1
                    md:right-2
                    w-12
                    h-12
                    rounded-full
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:opacity-60
                    text-white
                    flex
                    items-center
                    justify-center
                    border-4
                    border-white
                    shadow-xl
                    transition
                  "
                  title="Change photo"
                >
                  <FaCamera size={17} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </div>

              {/* NAME */}

              <h2 className="mt-5 text-2xl md:text-3xl font-bold text-slate-900 text-center">
                {form.name || "Admin User"}
              </h2>

              {/* EMAIL */}

              <div className="flex items-center gap-2 mt-2 text-slate-500">
                <FaEnvelope size={13} />

                <span className="text-sm">
                  {form.email || "No email"}
                </span>
              </div>

              {/* ROLE */}

              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
                <FaShieldAlt size={11} />

                {isSuperAdmin
                  ? "Super Admin"
                  : "Admin"}
              </div>
            </div>

            {/* =================================================
                INFORMATION CARD
            ================================================== */}

            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50/70 overflow-hidden">

              {/* HEADER */}

              <div className="px-6 md:px-8 py-6 border-b border-slate-200 bg-white/70">
                <div className="flex items-center gap-4">

                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FaUser size={17} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Profile Information
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Update account information and profile details.
                    </p>
                  </div>
                </div>
              </div>

              {/* FORM */}

              <div className="p-6 md:p-8">

                <div className="grid md:grid-cols-2 gap-6">

                  {/* NAME */}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                      <FaUser
                        size={12}
                        className="text-blue-500"
                      />
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="
                        w-full
                        h-12
                        bg-white
                        border
                        border-slate-200
                        rounded-xl
                        px-4
                        text-sm
                        text-slate-800
                        outline-none
                        placeholder:text-slate-400
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                        transition
                      "
                    />
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                      <FaEnvelope
                        size={12}
                        className="text-blue-500"
                      />
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      className="
                        w-full
                        h-12
                        bg-white
                        border
                        border-slate-200
                        rounded-xl
                        px-4
                        text-sm
                        text-slate-800
                        outline-none
                        placeholder:text-slate-400
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                        transition
                      "
                    />
                  </div>
                </div>

                {/* ABOUT */}

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                    About
                  </label>

                  <textarea
                    rows={5}
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    placeholder="Tell something about yourself..."
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-xl
                      px-4
                      py-3.5
                      text-sm
                      text-slate-800
                      outline-none
                      resize-none
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                      transition
                    "
                  />
                </div>

                {/* SAVE */}

                <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <p className="text-xs text-slate-400">
                    Your changes will be saved securely.
                  </p>

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      px-7
                      py-3.5
                      rounded-xl
                       bg-blue-600
                      hover:from-blue-700
                      hover:to-indigo-700
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      text-white
                      text-sm
                      font-bold
                      shadow-lg
                      shadow-blue-200
                      transition
                    "
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave size={14} />
                        {isSuperAdmin
                          ? "Save Client"
                          : "Save Profile"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                SECURITY CARD
            ================================================== */}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                <div className="flex items-start gap-4">

                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                    <FaLock size={18} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Security Settings
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 max-w-xl">
                      Keep your account secure by updating your password regularly.
                    </p>
                  </div>
                </div>

                {/* NORMAL ADMIN */}

                {!isSuperAdmin && (
                  <button
                    onClick={() =>
                      setShowPasswordModal(true)
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      px-6
                      py-3
                      rounded-xl
                      bg-slate-900
                      hover:bg-slate-800
                      text-white
                      text-sm
                      font-semibold
                      transition
                    "
                  >
                    <RiLockPasswordLine size={18} />
                    Change Password
                  </button>
                )}

                {/* SUPERADMIN */}

                {isSuperAdmin && selectedUser && (
                  <button
                    onClick={() =>
                      setShowClientPasswordModal(true)
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      px-6
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
                    <RiLockPasswordLine size={18} />
                    Change Client Password
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
          OWN PASSWORD MODAL
      ======================================================== */}

      {!isSuperAdmin && showPasswordModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            bg-slate-950/70
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <RiLockPasswordLine size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Change Password
                  </h2>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your account password
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setShowPasswordModal(false)
                }
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <IoClose size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="p-6 space-y-5">

              <PasswordInput
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: value,
                  }))
                }
              />

              <PasswordInput
                label="Confirm Current Password"
                value={
                  passwordForm.confirmCurrentPassword
                }
                onChange={(value) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmCurrentPassword: value,
                  }))
                }
              />

              <PasswordInput
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: value,
                  }))
                }
              />

              <div className="flex gap-3 pt-2">

                <button
                  onClick={() =>
                    setShowPasswordModal(false)
                  }
                  className="
                    flex-1
                    py-3
                    rounded-xl
                    border
                    border-slate-200
                    text-slate-700
                    font-semibold
                    hover:bg-slate-50
                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={changePassword}
                  disabled={changingPassword}
                  className="
                    flex-1
                    py-3
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:opacity-60
                    text-white
                    font-semibold
                    transition
                  "
                >
                  {changingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          CLIENT PASSWORD MODAL
      ======================================================== */}

      {isSuperAdmin && showClientPasswordModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            bg-slate-950/70
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FaKey size={17} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Change Client Password
                  </h2>

                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedUser?.name || "Selected Client"}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setShowClientPasswordModal(false)
                }
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <IoClose size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="p-6">

              <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {selectedUser?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {selectedUser?.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {selectedUser?.email}
                    </p>
                  </div>

                </div>
              </div>

              <div className="space-y-5">

                <PasswordInput
                  label="New Password"
                  value={
                    clientPasswordForm.newPassword
                  }
                  onChange={(value) =>
                    setClientPasswordForm((prev) => ({
                      ...prev,
                      newPassword: value,
                    }))
                  }
                />

                <PasswordInput
                  label="Confirm Password"
                  value={
                    clientPasswordForm.confirmPassword
                  }
                  onChange={(value) =>
                    setClientPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: value,
                    }))
                  }
                />

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={() =>
                      setShowClientPasswordModal(false)
                    }
                    className="
                      flex-1
                      py-3
                      rounded-xl
                      border
                      border-slate-200
                      text-slate-700
                      font-semibold
                      hover:bg-slate-50
                      transition
                    "
                  >
                    Cancel
                  </button>

                  <button
                    onClick={changeClientPassword}
                    disabled={changingPassword}
                    className="
                      flex-1
                      py-3
                      rounded-xl
                      bg-blue-600
                      hover:bg-blue-700
                      disabled:opacity-60
                      text-white
                      font-semibold
                      transition
                    "
                  >
                    {changingPassword
                      ? "Updating..."
                      : "Update Password"}
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PASSWORD INPUT
// ============================================================

function PasswordInput({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <RiLockPasswordLine
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={17}
        />

        <input
          type="password"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={`Enter ${label.toLowerCase()}`}
          className="
            w-full
            h-12
            pl-11
            pr-4
            bg-slate-50
            border
            border-slate-200
            rounded-xl
            text-sm
            outline-none
            focus:bg-white
            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100
            transition
          "
        />
      </div>
    </div>
  );
}