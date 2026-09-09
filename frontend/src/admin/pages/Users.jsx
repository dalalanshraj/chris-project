import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { FaCamera } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { RiLockPasswordLine } from "react-icons/ri";

export default function Users() {
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const isSuperAdmin = currentUser?.role === "superadmin";
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

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
  const [showClientPasswordModal, setShowClientPasswordModal] = useState(false);

  const [clientPasswordForm, setClientPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

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

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAllUsers(res.data.filter((u) => u.role === "admin"));
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      photo: URL.createObjectURL(file),
    }));

    try {
      const formData = new FormData();
      formData.append("photo", file);

      let res;

      if (isSuperAdmin && selectedUser) {
        // Upload selected client's photo
        res = await api.post(
          `/admin/users/${selectedUser._id}/photo`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        fetchUsers();
        setSelectedUser(res.data);
      } else {
        // Upload logged-in user's photo
        res = await api.post("/profile/photo", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const updatedUser = {
          ...JSON.parse(localStorage.getItem("user")),
          photo: res.data.photo,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));

        window.dispatchEvent(new Event("profileUpdated"));
      }

      setForm((prev) => ({
        ...prev,
        photo: res.data.photo,
      }));

      alert("Photo uploaded successfully");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Photo upload failed");
    }
  };

const saveProfile = async () => {

  try {

    let res;

    // SUPER ADMIN
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

      alert("Client updated successfully.");

      fetchUsers();

      setSelectedUser(res.data);
      setEditingUser(res.data);

    }

    // MY PROFILE
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

  }

};

  const changePassword = async () => {
    
  try {
    await api.put(
      "/profile/change-password",
      {
        currentPassword: passwordForm.currentPassword,
        confirmCurrentPassword:
          passwordForm.confirmCurrentPassword,
        newPassword: passwordForm.newPassword,
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
      "Password update failed"
    );

  }
};

  const changeClientPassword = async () => {
 

  if (!selectedUser) {
    return alert("Please select a client first.");
  }

  if (
    !clientPasswordForm.newPassword ||
    !clientPasswordForm.confirmPassword
  ) {
    return alert("All fields are required.");
  }

  if (
    clientPasswordForm.newPassword !==
    clientPasswordForm.confirmPassword
  ) {
    return alert("Passwords do not match.");
  }

  try {

    await api.put(
      `/admin/users/${selectedUser._id}/change-password`,
      {
        newPassword: clientPasswordForm.newPassword,
        confirmPassword:
          clientPasswordForm.confirmPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Client password changed successfully.");

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

  }

};
  const handleResetPassword = async () => {
    if (!selectedUser) {
      return alert("Select a client first");
    }

    if (!window.confirm("Reset this client's password?")) {
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
        },
      );

      alert(res.data.message || "Password reset successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Reset failed");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* PROFILE CARD */}
        {isSuperAdmin && (
          <div className="max-w-4xl mx-auto mb-6 bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Select Client</h2>

            <select
              className="w-full border rounded-xl px-4 py-3"
              value={selectedUser?._id || ""}
             onChange={(e) => {

  const user = allUsers.find(
    (u) => u._id === e.target.value
  );

  setSelectedUser(user);
  setEditingUser(user);

  if (!user) return;

  setForm({
    name: user.name || "",
    email: user.email || "",
    about: user.about || "",
    photo: user.photo || "",
    imageFile: null,
  });

}}
            >
              <option value="">Select Client</option>

              {allUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* ACTION BUTTONS */}
            {selectedUser && (
              <div className="flex gap-3 justify-end mt-5">
                <button
                  onClick={() => setShowClientPasswordModal(true)}
                  className="
      px-5
      py-3
      rounded-xl
      bg-blue-600
      hover:bg-blue-700
      text-white
      font-semibold
    "
                >
                  Change Password
                </button>

                <button
                  onClick={handleResetPassword}
                  className="
      px-5
      py-3
      rounded-xl
      bg-orange-600
      hover:bg-orange-700
      text-white
      font-semibold
    "
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>
        )}
        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {/* COVER */}

          <div className="relative h-56 bg-blue-600">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* PROFILE SECTION */}

          <div className="px-8 pb-10">
            <div className="-mt-20 flex flex-col items-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden border-[6px] border-white bg-white shadow-2xl">
                  {form.photo ? (
                    <img
                      src={
                        form.photo?.startsWith("blob:")
                          ? form.photo
                          : `${import.meta.env.VITE_API_URL}${form.photo}`
                      }
                      alt={form.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold">
                      {form.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current.click()}
                  className="
                    absolute
                    bottom-3
                    right-3
                    w-12
                    h-12
                    rounded-full
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    flex
                    items-center
                    justify-center
                    shadow-xl
                    transition-all
                  "
                >
                  <FaCamera size={18} />
                </button>

                <input
                  hidden
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <h1 className="mt-5 text-3xl font-bold text-slate-800">
                {form.name || "Admin User"}
              </h1>

              <p className="text-slate-500 mt-1">{form.email}</p>
            </div>

            {/* FORM CARD */}

            <div className="mt-12 bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Profile Information
                  </h2>

                  <p className="text-slate-500 mt-1">
                    Manage your personal information.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* NAME */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-2xl
                      px-4
                      py-3
                      outline-none
                      focus:ring-4
                      focus:ring-blue-100
                      focus:border-blue-500
                    "
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-2xl
                      px-4
                      py-3
                      outline-none
                      focus:ring-4
                      focus:ring-blue-100
                      focus:border-blue-500
                    "
                  />
                </div>
              </div>

              {/* ABOUT */}

              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                    rounded-2xl
                    px-4
                    py-3
                    resize-none
                    outline-none
                    focus:ring-4
                    focus:ring-blue-100
                    focus:border-blue-500
                  "
                />
              </div>

              {/* SAVE BUTTON */}

              <div className="mt-8">
                <button
                  onClick={saveProfile}
                  className="
                    w-full
                    md:w-auto
                    px-10
                    py-4
                    rounded-2xl
                    font-semibold
                    text-white
                    bg-gradient-to-r
                    from-blue-600
                    to-indigo-600
                    hover:from-blue-700
                    hover:to-indigo-700
                    shadow-lg
                    transition-all
                  "
                >
               {isSuperAdmin
 ? "Save Client"
 : "Save Profile"}
                </button>
              </div>
            </div>

            {/* SECURITY CARD */}

            <div className="mt-8 bg-white border border-red-100 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Security Settings
                  </h3>

                  <p className="text-slate-500 mt-2">
                    Keep your account secure by updating your password
                    regularly.
                  </p>
                </div>

               {!isSuperAdmin && (
  <button
    onClick={() => setShowPasswordModal(true)}
    className="
      flex
      items-center
      justify-center
      gap-2
      px-6
      py-3
      rounded-2xl
      bg-red-600
      hover:bg-red-700
      text-white
      font-medium
      transition
    "
  >
    <RiLockPasswordLine size={18} />
    Change Password
  </button>
)}

{isSuperAdmin && selectedUser && (
  <button
    onClick={() => setShowClientPasswordModal(true)}
    className="
      flex
      items-center
      justify-center
      gap-2
      px-6
      py-3
      rounded-2xl
      bg-blue-600
      hover:bg-blue-700
      text-white
      font-medium
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

      {/* PASSWORD MODAL */}

     {!isSuperAdmin && showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="
                absolute
                right-5
                top-5
                w-10
                h-10
                rounded-full
                bg-slate-100
                hover:bg-slate-200
                flex
                items-center
                justify-center
              "
            >
              <IoClose size={22} />
            </button>

            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              Change Password
            </h2>

            <p className="text-slate-500 mb-6">Update your account password.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Password
                </label>

                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="
                    w-full
                    border
                    border-slate-200
                    rounded-2xl
                    px-4
                    py-3
                    outline-none
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Current Password
                </label>

                <input
                  type="password"
                  value={passwordForm.confirmCurrentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmCurrentPassword: e.target.value,
                    })
                  }
                  className="
                    w-full
                    border
                    border-slate-200
                    rounded-2xl
                    px-4
                    py-3
                    outline-none
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>

                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="
                    w-full
                    border
                    border-slate-200
                    rounded-2xl
                    px-4
                    py-3
                    outline-none
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="
                    flex-1
                    py-3
                    rounded-2xl
                    border
                    border-slate-200
                    font-medium
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={changePassword}
                  className="
                    flex-1
                    py-3
                    rounded-2xl
                    bg-gradient-to-r
                    from-blue-600
                    to-indigo-600
                    text-white
                    font-medium
                  "
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSuperAdmin && showClientPasswordModal && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">

      <button
        onClick={() => setShowClientPasswordModal(false)}
        className="absolute right-5 top-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
      >
        <IoClose size={22} />
      </button>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Change Client Password
      </h2>

      <p className="text-slate-500 mb-6">
        Update password for {selectedUser?.name}
      </p>

      <div className="space-y-5">

        <div>
          <label className="block text-sm font-medium mb-2">
            New Password
          </label>

          <input
            type="password"
            value={clientPasswordForm.newPassword}
            onChange={(e) =>
              setClientPasswordForm({
                ...clientPasswordForm,
                newPassword: e.target.value,
              })
            }
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirm Password
          </label>

          <input
            type="password"
            value={clientPasswordForm.confirmPassword}
            onChange={(e) =>
              setClientPasswordForm({
                ...clientPasswordForm,
                confirmPassword: e.target.value,
              })
            }
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-3 pt-4">

          <button
            onClick={() => setShowClientPasswordModal(false)}
            className="flex-1 py-3 rounded-2xl border border-slate-200 font-medium"
          >
            Cancel
          </button>

          <button
            onClick={changeClientPassword}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium"
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

// import { useEffect, useState } from "react";
// import api from "../../api/axios.js";

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [editUser, setEditUser] = useState(null);

//   // 🔥 PASSWORD MODAL
//   const [passwordOpen, setPasswordOpen] = useState(false);

//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: "",
//     confirmCurrentPassword: "",
//     newPassword: "",
//   });

//   // 🔥 USER FORM
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const token = localStorage.getItem("token");

//   const currentUser = JSON.parse(
//     localStorage.getItem("user")
//   );

//   // ================= FETCH USERS =================
//   const fetchUsers = () => {
//     api
//       .get("admin/users", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       })
//       .then((res) => {

//   // ✅ superadmin sees all
//   if (currentUser?.role === "superadmin") {
//     setUsers(res.data);
//   }

//   // ✅ normal admin sees only own account
//   else {
//     const mine = res.data.filter(
//       (u) => u.email === currentUser?.email
//     );

//     setUsers(mine);
//   }
// });
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // ================= CREATE / UPDATE USER =================
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (
//       !form.name ||
//       !form.email ||
//       (!editUser && !form.password)
//     ) {
//       alert("All fields are required");
//       return;
//     }

//     const payload = {
//       ...form,
//       role: "admin",
//     };

//     try {
//       if (editUser) {
//         await api.put(
//           `admin/users/${editUser._id}`,
//           payload,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//       } else {
//         await api.post(
//           `admin/users`,
//           payload,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//       }

//       setOpen(false);

//       setEditUser(null);

//       setForm({
//         name: "",
//         email: "",
//         password: "",
//       });

//       fetchUsers();

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//           "Something went wrong"
//       );
//     }
//   };

//   // ================= DELETE USER =================
//   const handleDelete = async (user) => {
//     if (user.email === currentUser?.email) {
//       alert("You cannot delete your own account");
//       return;
//     }

//     if (!confirm("Delete this user?")) return;

//     try {
//       await api.delete(
//         `admin/users/${user._id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       fetchUsers();

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//           "Delete failed"
//       );
//     }
//   };

//   // ================= CHANGE PASSWORD =================
//   const handlePasswordChange = async (e) => {
//     e.preventDefault();

//     try {
//       await api.put(
//         "/admin/change-password",
//         passwordForm,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert("Password changed successfully ✅");

//       setPasswordOpen(false);

//       setPasswordForm({
//         currentPassword: "",
//         confirmCurrentPassword: "",
//         newPassword: "",
//       });

//       fetchUsers();

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//           "Password change failed"
//       );
//     }
//   };

//   // ================= RESET PASSWORD =================
//   const handleResetPassword = async (userId) => {
//     if (!confirm("Reset this user's password?"))
//       return;

//     try {
//       const res = await api.put(
//         `/admin/users/${userId}/reset-password`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert(
//         `Temporary Password: ${res.data.tempPassword}`
//       );

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//           "Reset failed"
//       );
//     }
//   };

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">

//       {/* ================= HEADER ================= */}
//       <div className="flex justify-between items-center mb-8">

//         <h1 className="text-3xl font-bold text-gray-800">
//           User Management
//         </h1>

//         <div className="flex gap-3">

//           {/* CHANGE PASSWORD */}
//           <button
//             onClick={() => setPasswordOpen(true)}
//             className="bg-blue-600 text-white px-5 py-2 rounded-lg"
//           >
//             Change Password
//           </button>

//           {/* ADD USER */}
//           {/* <button
//             onClick={() => {
//               setEditUser(null);

//               setForm({
//                 name: "",
//                 email: "",
//                 password: "",
//               });

//               setOpen(true);
//             }}
//             className="bg-black text-white px-5 py-2 rounded-lg"
//           >
//             + Add User
//           </button> */}

//         </div>
//       </div>

//       {/* ================= USERS ================= */}
//       <div className="space-y-4">

//         {users.map((u) => (
//           <div
//             key={u._id}
//             className="bg-white p-5 rounded-xl shadow flex justify-between items-center"
//           >

//             {/* LEFT */}
//             <div>
//               <p className="font-semibold">
//                 {u.name}
//               </p>

//               <p className="text-sm text-gray-500">
//                 {u.email}
//               </p>

//               <p className="text-xs text-purple-600 mt-1">
//                 {u.role}
//               </p>

//               <p className="text-xs text-gray-400 mt-1">
//                 Password Changed:
//                 {" "}
//                 {u.lastPasswordChanged
//                   ? new Date(
//                       u.lastPasswordChanged
//                     ).toLocaleString()
//                   : "Never"}
//               </p>
//             </div>

//             {/* RIGHT */}
//             <div className="flex gap-3 items-center">

//               {/* RESET PASSWORD */}
//               {currentUser?.role ===
//                 "superadmin" && (
//                 <button
//                   onClick={() =>
//                     handleResetPassword(u._id)
//                   }
//                   className="bg-purple-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-purple-700"
//                 >
//                   Reset
//                 </button>
//               )}

//               {/* EDIT */}
//               <button
//                 onClick={() => {
//                   setEditUser(u);

//                   setForm({
//                     name: u.name || "",
//                     email: u.email,
//                     password: "",
//                   });

//                   setOpen(true);
//                 }}
//                 className="bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600"
//               >
//                 Edit
//               </button>

//               {/* DELETE */}
//               <button
//                 onClick={() => handleDelete(u)}
//                 disabled={
//                   u.email === currentUser?.email
//                 }
//                 className={`bg-red-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-red-600 ${
//                   u.email === currentUser?.email
//                     ? "opacity-40 cursor-not-allowed"
//                     : ""
//                 }`}
//               >
//                 Delete
//               </button>

//             </div>
//           </div>
//         ))}

//       </div>

//       {/* ================= ADD / EDIT MODAL ================= */}
//       {open && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

//           <div className="bg-white p-6 rounded-xl w-[350px]">

//             <h2 className="text-xl mb-4">
//               {editUser
//                 ? "Edit User"
//                 : "Add User"}
//             </h2>

//             <form
//               onSubmit={handleSubmit}
//               className="space-y-3"
//             >

//               <input
//                 placeholder="Name"
//                 className="w-full border p-2 rounded"
//                 value={form.name}
//                 onChange={(e) =>
//                   setForm({
//                     ...form,
//                     name: e.target.value,
//                   })
//                 }
//               />

//               <input
//                 placeholder="Email"
//                 className="w-full border p-2 rounded"
//                 value={form.email}
//                 onChange={(e) =>
//                   setForm({
//                     ...form,
//                     email: e.target.value,
//                   })
//                 }
//               />

//               {!editUser && (
//                 <input
//                   placeholder="Password"
//                   type="password"
//                   className="w-full border p-2 rounded"
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       password: e.target.value,
//                     })
//                   }
//                 />
//               )}

//               <div className="text-sm text-gray-500">
//                 Role:
//                 {" "}
//                 <span className="font-semibold text-purple-600">
//                   Admin
//                 </span>
//               </div>

//               <button className="w-full bg-black text-white py-2 rounded">
//                 Save
//               </button>

//             </form>

//             <button
//               onClick={() => setOpen(false)}
//               className="mt-3 text-sm text-gray-500"
//             >
//               Cancel
//             </button>

//           </div>
//         </div>
//       )}

//       {/* ================= CHANGE PASSWORD MODAL ================= */}
//       {passwordOpen && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

//           <div className="bg-white p-6 rounded-2xl w-[400px]">

//             <h2 className="text-2xl font-bold mb-5">
//               Change Password
//             </h2>

//             <form
//               onSubmit={handlePasswordChange}
//               className="space-y-4"
//             >

//               <input
//                 type="password"
//                 placeholder="Current Password"
//                 className="w-full border p-3 rounded-lg"
//                 onChange={(e) =>
//                   setPasswordForm({
//                     ...passwordForm,
//                     currentPassword:
//                       e.target.value,
//                   })
//                 }
//               />

//               <input
//                 type="password"
//                 placeholder="Confirm Current Password"
//                 className="w-full border p-3 rounded-lg"
//                 onChange={(e) =>
//                   setPasswordForm({
//                     ...passwordForm,
//                     confirmCurrentPassword:
//                       e.target.value,
//                   })
//                 }
//               />

//               <input
//                 type="password"
//                 placeholder="New Password"
//                 className="w-full border p-3 rounded-lg"
//                 onChange={(e) =>
//                   setPasswordForm({
//                     ...passwordForm,
//                     newPassword:
//                       e.target.value,
//                   })
//                 }
//               />

//               <button className="w-full bg-black text-white py-3 rounded-lg">
//                 Update Password
//               </button>

//             </form>

//             <button
//               onClick={() =>
//                 setPasswordOpen(false)
//               }
//               className="mt-4 text-sm text-gray-500"
//             >
//               Cancel
//             </button>

//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default Users;
