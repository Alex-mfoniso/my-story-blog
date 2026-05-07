import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast, ToastContainer } from "react-toastify";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";
const COLORS = ["#c30F45", "#1d9bf0", "#10b981", "#f59e0b", "#8b5cf6"];

const AdminPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");

  const isAdmin = useMemo(() => user?.uid === ADMIN_UID, [user]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("createdAt", "desc")),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );

    const unsubStories = onSnapshot(
      query(collection(db, "stories"), orderBy("createdAt", "desc")),
      (snap) => {
        setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );

    return () => {
      unsubUsers();
      unsubStories();
    };
  }, [isAdmin]);

  const toggleUserStatus = async (userId, isDisabled) => {
    try {
      await updateDoc(doc(db, "users", userId), { isDisabled: !isDisabled });
      toast.info(
        `User ${isDisabled ? "reactivated" : "suspended"} successfully`,
      );
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error("Failed to update user status");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete user and all their stories?")) return;
    try {
      const userStories = stories.filter(
        (s) => s.authorId === userId || s.author?.uid === userId,
      );
      await Promise.all(
        userStories.map((s) => deleteDoc(doc(db, "stories", s.id))),
      );
      await deleteDoc(doc(db, "users", userId));
      toast.success("User and data deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete user");
    }
  };

  // Analytics
  const topAuthorsChartData = useMemo(() => {
    const counts = {};
    stories.forEach((s) => {
      const name = s.author?.name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, stories: count }))
      .sort((a, b) => b.stories - a.stories)
      .slice(0, 5);
  }, [stories]);

  const genreChartData = useMemo(() => {
    const counts = {};
    stories.forEach((s) => {
      const genre = s.genre || "General";
      counts[genre] = (counts[genre] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [stories]);

  if (!isAdmin) return <div className="text-center py-20">Access Denied.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <ToastContainer position="bottom-right" theme="dark" />
      {/* Admin Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <p className="text-xs text-gray-500">
            Platform Overview & Management
          </p>
        </div>

        <div className="flex border-b border-[#2f3336]">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === "stats" ? "text-white" : "text-gray-500"}`}
          >
            Statistics
            {activeTab === "stats" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#c30F45] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === "users" ? "text-white" : "text-gray-500"}`}
          >
            Users
            {activeTab === "users" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#c30F45] rounded-full" />
            )}
          </button>
        </div>
      </header>

      <div className="p-4 pb-20 lg:pb-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "stats" ? (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#16181c] p-4 rounded-2xl border border-[#2f3336]">
                <p className="text-gray-500 text-sm font-bold">STORIES</p>
                <p className="text-3xl font-extrabold text-white">
                  {stories.length}
                </p>
              </div>
              <div className="bg-[#16181c] p-4 rounded-2xl border border-[#2f3336]">
                <p className="text-gray-500 text-sm font-bold">USERS</p>
                <p className="text-3xl font-extrabold text-white">
                  {users.length}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-[#16181c] p-4 rounded-2xl border border-[#2f3336] h-80">
              <h3 className="font-bold mb-4">Top Authors</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={topAuthorsChartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #2f3336",
                    }}
                  />
                  <Bar dataKey="stories" fill="#c30F45" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#16181c] p-4 rounded-2xl border border-[#2f3336] h-80">
              <h3 className="font-bold mb-4">Genre Distribution</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={genreChartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genreChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #2f3336",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-[#16181c] rounded-2xl border border-[#2f3336] flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.photoURL}
                    className="w-12 h-12 rounded-full border border-[#2f3336]"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <p className="text-[10px] text-[#c30F45] font-bold mt-1 uppercase">
                      {u.isDisabled ? "Suspended" : "Active"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => toggleUserStatus(u.id, u.isDisabled)}
                    disabled={u.id === ADMIN_UID}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${u.isDisabled ? "bg-green-600 text-white" : "border border-[#2f3336] text-white hover:bg-[#c30F45]/10"}`}
                  >
                    {u.isDisabled ? "Reactivate" : "Suspend"}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={u.id === ADMIN_UID}
                    className="text-red-500 text-xs font-bold hover:underline disabled:opacity-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
