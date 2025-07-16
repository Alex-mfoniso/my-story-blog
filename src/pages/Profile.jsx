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
      setMessage("Username cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, { displayName: newUsername });
      setMessage("Username updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update username.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload(); // Optional: redirect or refresh
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white bg-[#231123]">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#231123] text-white p-8 max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#c30F45]">👤 Profile</h2>

      <div className="bg-[#2c1b2f] p-6 rounded shadow">
        <p className="mb-3"><strong>Email:</strong> {user.email}</p>

        {editing ? (
          <>
            <label className="block mb-2 font-medium">Edit Username:</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-2 rounded text-black mb-4"
              placeholder="Enter a username"
            />
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-[#c30F45] px-4 py-2 rounded text-white mr-2"
            >
              {loading ? "Updating..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-600 px-4 py-2 rounded text-white"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="mb-3">
              <strong>Username:</strong>{" "}
              {user.displayName || (
                <span className="text-gray-400 italic">Not set</span>
              )}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="bg-[#c30F45] px-4 py-2 rounded text-white"
            >
              {user.displayName ? "Edit Username" : "Add Username"}
            </button>
          </>
        )}

        {message && (
          <p className="mt-4 text-sm text-green-400">
            {message}
          </p>
        )}

        <hr className="my-6 border-gray-600" />

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 py-2 rounded text-white font-bold hover:bg-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
