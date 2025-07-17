// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Failed to login. Check your credentials.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white">
      <form
        onSubmit={handleLogin}
        className="bg-[#2c1b2f] p-8 rounded shadow w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-[#c30F45]">Login</h2>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded bg-gray-800 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-gray-800 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-[#c30F45] py-2 rounded hover:opacity-90"
        >
          Sign In
        </button>

        <p className="text-sm text-center mt-2 text-gray-300">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#c30F45] underline">
            Register
          </Link>
        </p>  

        
      </form>
    </div>
  );
};

export default Login;
