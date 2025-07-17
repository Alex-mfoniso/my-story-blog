import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";

const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    if (!newUsername.trim()) {
      setMessage("❌ Username cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, { displayName: newUsername });
      setMessage("✅ Username updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update username.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload(); // or navigate to login
    } catch (err) {
      console.error("Logout failed:", err);
      setMessage("❌ Logout failed.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white bg-gradient-to-br from-[#231123] to-[#3a263e]">
        🔐 Please log in to view your profile.
      </div>
    );
  }

  return (
<div className="min-h-screen bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2e] to-[#1f1f38] text-white p-8 pt-20">
<div className="max-w-xl mx-auto bg-[#1f1f38]/80 backdrop-blur-sm p-6 rounded-xl shadow-inner border border-[#2a2a45]">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#c30F45]">👤 My Profile</h2>

        <p className="mb-4">
          <strong>Email:</strong>{" "}
          <span className="text-gray-300">{user.email}</span>
        </p>

        {editing ? (
          <>
            <label className="block mb-2 font-medium">Edit Username:</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-2 rounded text-black mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Enter a new username"
            />
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-[#c30F45] hover:bg-pink-600 px-4 py-2 rounded text-white"
              >
                {loading ? "Updating..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setNewUsername(user.displayName || "");
                }}
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4">
              <strong>Username:</strong>{" "}
              <span className="text-gray-200">
                {user.displayName || <span className="italic text-gray-400">Not set</span>}
              </span>
            </p>
            <button
              onClick={() => setEditing(true)}
              className="bg-[#c30F45] hover:bg-pink-600 px-4 py-2 rounded text-white"
            >
              {user.displayName ? "Edit Username" : "Add Username"}
            </button>
          </>
        )}

        {message && (
          <div className="mt-4 text-sm text-green-400">
            {message}
          </div>
        )}

        <hr className="my-6 border-gray-600" />

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-500 py-2 rounded text-white font-bold"
        >
          🔓 Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
