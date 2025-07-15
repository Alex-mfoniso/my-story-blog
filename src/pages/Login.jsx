import React from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { user, login, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white">
      <div className="bg-[#2d1a2f] p-8 rounded-lg shadow-lg text-center">
        {user ? (
          <>
            <h2 className="text-2xl font-bold mb-2 text-[#c30F45]">Welcome, {user.displayName}</h2>
            <p className="mb-6 text-gray-300">{user.email}</p>
            <button
              onClick={logout}
              className="bg-[#c30F45] px-6 py-2 rounded hover:opacity-90 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-[#c30F45]">Login to Comment or Upload</h2>
            <button
              onClick={login}
              className="bg-[#c30F45] px-6 py-2 rounded hover:opacity-90 transition"
            >
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
