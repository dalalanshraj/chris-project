import { useEffect, useRef, useState } from "react";
import api from "../../../api/axios.js";
import { FaCamera } from "react-icons/fa";

export default function ProfileTab({ user, setUser }) {
  const token = localStorage.getItem("token");

  const fileRef = useRef();
  const [passwordForm, setPasswordForm] = useState({
  currentPassword: "",
  confirmCurrentPassword: "",
  newPassword: "",
});

  const [form, setForm] = useState({
    name: "",
    email: "",
    about: "",
    photo: "",
  });

  useEffect(() => {
    setForm({
      name: user.name || "",
      email: user.email || "",
      about: user.about || "",
      photo: user.photo || "",
    });
  }, [user]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = async () => {
    try {
      const res = await api.put(
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

      setUser(res.data);

      alert("Profile Updated Successfully");
    } catch (err) {
      console.log(err);
      alert("Unable to update profile");
    }
  };
  const changePassword = async () => {
  try {
    await api.put(
      "/admin/change-password",
      passwordForm,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Password changed successfully");

    setPasswordForm({
      currentPassword: "",
      confirmCurrentPassword: "",
      newPassword: "",
    });

  } catch (err) {
    console.log(err);

    alert(
      err.response?.data?.message ||
      "Password change failed"
    );
  }
};

  return (
    <div className="px-10 pb-10">

      {/* PROFILE PHOTO */}

      <div className="-mt-16 flex justify-center">

        <div className="relative">

          <div className="w-36 h-36 rounded-full overflow-hidden border-[5px] border-white shadow-xl">

            {form.photo ? (
              <img
                src={form.photo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-5xl font-bold">
                {form.name?.charAt(0)}
              </div>
            )}

          </div>

          <button
            onClick={() => fileRef.current.click()}
            className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          >
            <FaCamera />
          </button>

          <input
            ref={fileRef}
            type="file"
            hidden
          />

        </div>

      </div>

      {/* PROFILE FORM */}

      <div className="mt-12 max-w-3xl mx-auto">

        <h2 className="text-2xl font-bold mb-8">
          Personal Information
        </h2>

        {/* NAME */}

        <div className="mb-6">

          <label className="block text-sm font-medium text-gray-600 mb-2">
            Full Name
          </label>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />

        </div>

        {/* EMAIL */}

        <div className="mb-6">

          <label className="block text-sm font-medium text-gray-600 mb-2">
            Email Address
          </label>

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />

        </div>

        {/* ABOUT */}

        <div className="mb-8">

          <label className="block text-sm font-medium text-gray-600 mb-2">
            About
          </label>

          <textarea
            rows={6}
            name="about"
            value={form.about}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Tell something about yourself..."
          />

        </div>

        {/* SAVE */}

        <button
          onClick={saveProfile}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition"
        >
          Save Profile
        </button>
        
<hr className="my-12" />

<h2 className="text-2xl font-bold mb-8">
  Change Password
</h2>

<div className="space-y-6">

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
      className="w-full border rounded-xl px-4 py-3"
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
      className="w-full border rounded-xl px-4 py-3"
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
      className="w-full border rounded-xl px-4 py-3"
    />

  </div>

  <button
    onClick={changePassword}
    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl"
  >
    Change Password
  </button>

</div>
      </div>
      

    </div>
  );
}