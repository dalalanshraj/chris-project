import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      // ✅ SAVE TOKEN
      localStorage.setItem("token", res.data.token);

      // ✅ SAVE USER
     localStorage.setItem(
  "user",
  JSON.stringify({
    id: res.data.id,
    name: res.data.name,
    email: res.data.email,
    role: res.data.role,
  })
);

      // ✅ REDIRECT
      navigate("/admin/dashboard");

    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
        "Invalid email or password"
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">

      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >

        <h2 className="text-3xl font-bold mb-2 text-center">
          Owner Log In
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div className="mb-4">
          <label className="text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            className="w-full border rounded-lg p-3 mt-1"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-5">
          <label className="text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            className="w-full border rounded-lg p-3 mt-1"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold ${
            loading
              ? "bg-gray-400"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
        
        </p>

      </form>
    </div>
  );
};

export default Login;