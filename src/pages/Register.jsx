// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(""); // added
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, password, username); // pass username
      navigate("/");
    } catch (err) {
      setError("Failed to create account. " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white">
      <form
        onSubmit={handleRegister}
        className="bg-[#2c1b2f] p-8 rounded shadow w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-[#c30F45]">Register</h2>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-3 rounded bg-gray-800 text-white"
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded bg-gray-800 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-gray-800 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-[#c30F45] py-2 rounded hover:opacity-90"
        >
          Create Account
        </button>

        <p className="text-sm text-center mt-2 text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-[#c30F45] underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
