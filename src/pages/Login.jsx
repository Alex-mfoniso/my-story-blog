import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

const Login = () => {
  const { login } = useAuth();

  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);

      // ROUTE TO HOME AFTER LOGIN
      navigate("/home");
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to login. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      alert(
        "Password reset email sent successfully."
      );
    } catch (err) {
      console.error(err);

      alert(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white flex items-center justify-center px-6 py-12">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#c30F45]/20 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full" />

      {/* GRID OVERLAY */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-md">

        {/* CARD */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">

          {/* HEADER */}
          <div className="text-center mb-8">

            <h1 className="text-4xl font-black mb-3">
              Welcome Back
            </h1>

            <p className="text-gray-400 leading-relaxed">
              Continue reading, writing, and
              connecting with storytellers
              around the world.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-4 rounded-2xl mb-5">
              {error}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label className="text-sm text-gray-400 mb-2 block">
                Email Address
              </label>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4">

                <Mail
                  size={18}
                  className="text-gray-500"
                />

                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent px-3 py-4 outline-none text-white placeholder:text-gray-500"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>

              <label className="text-sm text-gray-400 mb-2 block">
                Password
              </label>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4">

                <Lock
                  size={18}
                  className="text-gray-500"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  className="w-full bg-transparent px-3 py-4 outline-none text-white placeholder:text-gray-500"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="text-gray-500 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}
            <div className="flex justify-end">

              <button
                type="button"
                onClick={
                  handleForgotPassword
                }
                className="text-sm text-[#c30F45] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c30F45] hover:bg-[#a50a3b] py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-[1.02] shadow-[0_0_40px_rgba(195,15,69,0.35)] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}

              {!loading && (
                <ArrowRight size={20} />
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-gray-400 text-sm mt-6">

            Don’t have an account?{" "}

            <Link
              to="/register"
              className="text-[#c30F45] hover:underline font-medium"
            >
              Create One
            </Link>
          </p>
        </div>

        {/* BOTTOM TEXT */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Secure authentication powered by
          Firebase.
        </p>
      </div>
    </div>
  );
};

export default Login;