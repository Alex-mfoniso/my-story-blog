import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(email, password, username);

      alert("Account created successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to create account.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center px-6 py-12">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#c30F45]/20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 w-full max-w-md">
        
        {/* Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-3">
              Join{" "}
              <span className="text-[#c30F45]">
                Alex's Stories
              </span>
            </h1>

            <p className="text-gray-400 leading-relaxed">
              Create your account and start sharing stories,
              ideas, experiences, and moments that matter.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Username */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Username
              </label>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4">
                <User size={18} className="text-gray-500" />

                <input
                  type="text"
                  placeholder="alexmfoniso"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 py-4 outline-none text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Email Address
              </label>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4">
                <Mail size={18} className="text-gray-500" />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 py-4 outline-none text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Password
              </label>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4">
                <Lock size={18} className="text-gray-500" />

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 py-4 outline-none text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c30F45] hover:bg-[#a50a3b] py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-[1.02] shadow-[0_0_40px_rgba(195,15,69,0.35)] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Account"}

              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#c30F45] hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-gray-600 text-xs mt-6">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Register;