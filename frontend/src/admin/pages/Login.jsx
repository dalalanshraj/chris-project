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

      // Save token
      localStorage.setItem("token", res.data.token);

      // Save user
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        })
      );

      // Redirect
      navigate("/admin/dashboard");
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-100 to-purple-100 px-4">

  <form
    onSubmit={submit}
    className="bg-white/60 backdrop-blur-xl border border-white/50 p-8 rounded-2xl shadow-2xl w-full max-w-md"
  >
    <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
      Owner Log In
    </h2>

    <p className="text-center text-gray-500 text-sm mb-6">
      Sign in to access your dashboard
    </p>

    {/* Error */}
    {error && (
      <div className="bg-red-100/80 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
        {error}
      </div>
    )}

    {/* Email */}
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700">
        Email
      </label>

      <input
        type="email"
        placeholder="Enter your email"
        className="w-full bg-white/70 border border-gray-300 rounded-lg p-3 mt-1 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>

    {/* Password */}
    <div className="mb-5">
      <label className="text-sm font-medium text-gray-700">
        Password
      </label>

      <input
        type="password"
        placeholder="Enter your password"
        className="w-full bg-white/70 border border-gray-300 rounded-lg p-3 mt-1 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className={`w-full py-3 rounded-xl text-white font-semibold transition ${
        loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700"
      }`}
    >
      {loading ? "Logging in..." : "Login"}
    </button>

    <p className="text-center text-sm text-gray-500 mt-6">
      Secure Owner Dashboard
    </p>
     <div className="mt-1 pt-1 border-t border-white/50 text-center">
  <p className="text-xs text-gray-500 mb-2">
    Admin Portal
  </p>

  <div className="flex justify-center">
    <img
      src="/blackLOGO.webp"
      alt="Digify America"
      className="h-10 w-auto object-contain"
    />
  </div>

  <p className="text-[11px] text-gray-400 mt-2">
    Powered by <a href="https://www.digifyamerica.com">Digify America</a> 
  </p>
</div>
  </form>
</div>
  );
};

export default Login;