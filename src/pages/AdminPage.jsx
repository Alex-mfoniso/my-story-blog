import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";

const AdminPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storyCount, setStoryCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  const isAdmin = useMemo(() => user?.uid === ADMIN_UID, [user]);

  useEffect(() => {
    const loadAdminStats = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const [storiesSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "stories")),
          getDocs(collection(db, "users")),
        ]);
        setStoryCount(storiesSnap.size);
        setUserCount(usersSnap.size);
      } catch (error) {
        console.error("Admin page stats error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminStats();
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="min-h-screen px-4 py-24 bg-[#231123] text-white text-center">
        <p>Please log in to access the admin page.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen px-4 py-24 bg-[#231123] text-white text-center">
        <p>Access denied. Admin only page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-24 bg-[#231123] text-white text-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-8">
        Admin Dashboard
      </h2>

      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        <div className="bg-[#2c1b2f] p-6 rounded-lg shadow">
          <p className="text-sm text-gray-300 mb-1">Total Stories</p>
          <p className="text-3xl font-bold">{storyCount}</p>
        </div>
        <div className="bg-[#2c1b2f] p-6 rounded-lg shadow">
          <p className="text-sm text-gray-300 mb-1">Total Users</p>
          <p className="text-3xl font-bold">{userCount}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 bg-[#2c1b2f] p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 text-[#c30F45]">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/upload" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Create Story
          </Link>
          <Link
            to="/manage-stories"
            className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
          >
            Manage Stories
          </Link>
          <Link to="/stories" className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
            View Public Stories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
