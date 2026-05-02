import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";
const COLORS = ['#c30F45', '#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];

const AdminPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);

  const isAdmin = useMemo(() => user?.uid === ADMIN_UID, [user]);

  const loadData = async () => {
    if (!isAdmin) return;
    try {
      const [usersSnap, storiesSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "stories"), orderBy("createdAt", "desc")))
      ]);
      
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStories(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const toggleUserStatus = async (userId, isDisabled) => {
    try {
      await updateDoc(doc(db, "users", userId), { isDisabled: !isDisabled });
      setUsers(users.map(u => u.id === userId ? { ...u, isDisabled: !isDisabled } : u));
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Failed to update user status.");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure? This will delete the user and ALL their stories.")) return;
    
    try {
      // 1. Delete user's stories
      const userStories = stories.filter(s => s.authorId === userId || s.author?.uid === userId);
      await Promise.all(userStories.map(s => deleteDoc(doc(db, "stories", s.id))));
      
      // 2. Delete user document
      await deleteDoc(doc(db, "users", userId));
      
      // 3. Update state
      setUsers(users.filter(u => u.id !== userId));
      setStories(stories.filter(s => s.authorId !== userId && s.author?.uid !== userId));
      alert("User and their stories deleted successfully.");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  // --- Derived Analytics Data ---

  const mostActiveUser = useMemo(() => {
    if (users.length === 0 || stories.length === 0) return null;
    const counts = {};
    stories.forEach(s => {
      const uid = s.authorId || s.author?.uid;
      if (uid) counts[uid] = (counts[uid] || 0) + 1;
    });
    const topUid = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, null);
    if (!topUid) return null;
    const topUser = users.find(u => u.id === topUid);
    return topUser ? { ...topUser, storyCount: counts[topUid] } : null;
  }, [users, stories]);

  const topAuthorsChartData = useMemo(() => {
    const counts = {};
    stories.forEach(s => {
      const name = s.author?.name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, stories: count }))
      .sort((a, b) => b.stories - a.stories)
      .slice(0, 5); // Top 5
  }, [stories]);

  const genreChartData = useMemo(() => {
    const counts = {};
    stories.forEach(s => {
      const genre = s.genre || "Uncategorized";
      counts[genre] = (counts[genre] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [stories]);


  if (!user) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Please log in to access the admin page.</div>;
  if (!isAdmin) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Access denied. Admin only page.</div>;
  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Loading advanced dashboard...</div>;

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-extrabold text-[#c30F45]">Admin Dashboard</h2>
          <div className="flex gap-3">
            <Link to="/upload" className="px-4 py-2 bg-blue-600 rounded shadow hover:bg-blue-500 transition">Create Story</Link>
            <Link to="/manage-stories" className="px-4 py-2 bg-yellow-600 rounded shadow hover:bg-yellow-500 transition">Manage Stories</Link>
          </div>
        </div>

        {/* --- Top Stats Cards --- */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <div className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a45] p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400 font-medium tracking-wider uppercase mb-2">Total Stories</p>
            <p className="text-4xl font-bold text-white">{stories.length}</p>
          </div>
          <div className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a45] p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400 font-medium tracking-wider uppercase mb-2">Total Users</p>
            <p className="text-4xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a45] p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400 font-medium tracking-wider uppercase mb-2">🏆 Most Active User</p>
            {mostActiveUser ? (
              <div>
                <p className="text-xl font-bold text-yellow-400 truncate">{mostActiveUser.displayName}</p>
                <p className="text-sm text-gray-300 mt-1">{mostActiveUser.storyCount} stories published</p>
              </div>
            ) : (
              <p className="text-gray-500">No data yet</p>
            )}
          </div>
        </div>

        {/* --- Analytics Charts --- */}
        <div className="grid gap-6 md:grid-cols-2 mb-10">
          <div className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a45] p-6 rounded-2xl shadow-lg h-96">
            <h3 className="text-xl font-semibold mb-6 text-white">Top Authors</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAuthorsChartData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} allowDecimals={false} />
                <Tooltip cursor={{fill: '#2a2a45'}} contentStyle={{backgroundColor: '#231123', borderColor: '#c30F45', color: '#fff'}} />
                <Bar dataKey="stories" fill="#c30F45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a45] p-6 rounded-2xl shadow-lg h-96">
            <h3 className="text-xl font-semibold mb-6 text-white">Stories by Genre</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genreChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {genreChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#231123', borderColor: '#c30F45', color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- User Management Table --- */}
        <div className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a45] rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#2a2a45]">
            <h3 className="text-2xl font-bold text-white">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2c1b2f] text-gray-300 text-sm uppercase tracking-wide">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a45]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#2a2a45] transition duration-150">
                    <td className="p-4 flex items-center gap-3">
                      <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#c30F45]" />
                      <span className="font-medium">{u.displayName}</span>
                    </td>
                    <td className="p-4 text-gray-400">{u.email}</td>
                    <td className="p-4 text-gray-400">
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="p-4">
                      {u.isDisabled ? (
                         <span className="px-3 py-1 bg-red-900/50 text-red-400 text-xs rounded-full border border-red-800">Disabled</span>
                      ) : (
                         <span className="px-3 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-800">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button 
                        onClick={() => toggleUserStatus(u.id, u.isDisabled)}
                        className={`text-sm hover:underline ${u.isDisabled ? 'text-green-400' : 'text-yellow-500'}`}
                        disabled={u.id === ADMIN_UID}
                      >
                        {u.isDisabled ? 'Enable' : 'Disable'}
                      </button>
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="text-sm text-red-500 hover:text-red-400 hover:underline"
                        disabled={u.id === ADMIN_UID}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;
