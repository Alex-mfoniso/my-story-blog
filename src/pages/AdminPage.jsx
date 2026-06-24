import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
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
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast, ToastContainer } from "react-toastify";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";
const COLORS = ["#c30F45", "#1d9bf0", "#10b981", "#f59e0b", "#8b5cf6"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const AdminPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [recipientMode, setRecipientMode] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  const isAdmin = useMemo(() => user?.uid === ADMIN_UID, [user]);
  const selectableUsers = useMemo(
    () => users.filter((u) => u.email && !u.isDisabled),
    [users],
  );

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

  useEffect(() => {
    if (recipientMode === "all") {
      setSelectedUserIds([]);
    }
  }, [recipientMode]);

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

  const toggleRecipient = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const selectAllRecipients = () => {
    setSelectedUserIds(selectableUsers.map((u) => u.id));
  };

  const clearRecipients = () => {
    setSelectedUserIds([]);
  };

  const sendEmail = async (event) => {
    event.preventDefault();

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Subject and message are required.");
      return;
    }

    if (recipientMode === "selected" && selectedUserIds.length === 0) {
      toast.error("Pick at least one recipient.");
      return;
    }

    if (!user?.getIdToken) {
      toast.error("You need to sign in again.");
      return;
    }

    setSendingEmail(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          target: recipientMode,
          recipientIds: selectedUserIds,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = data?.error || "Failed to send email.";
        const sourceInfo = data?.credentialsSource ? ` (Source: ${data.credentialsSource})` : "";
        throw new Error(`${errorMsg}${sourceInfo}`);
      }

      toast.success(`Email sent to ${data.sentCount} recipient(s).`);
      setEmailSubject("");
      setEmailMessage("");
      setRecipientMode("all");
      setSelectedUserIds([]);
    } catch (err) {
      console.error("Email send error:", err);
      toast.error(err.message || "Failed to send email.");
    } finally {
      setSendingEmail(false);
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
          <button
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === "email" ? "text-white" : "text-gray-500"}`}
          >
            Email
            {activeTab === "email" && (
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
        ) : activeTab === "email" ? (
          <div className="space-y-6">
            <div className="bg-[#16181c] p-4 rounded-2xl border border-[#2f3336]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-white">Send Email</h3>
                  <p className="text-xs text-gray-500">
                    Broadcast to all active users or choose specific recipients.
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{selectableUsers.length} active recipients available</p>
                  <p>{selectedUserIds.length} selected</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={sendEmail}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      Subject
                    </span>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-xl bg-black border border-[#2f3336] px-4 py-3 text-white outline-none focus:border-[#c30F45]"
                      placeholder="A note from Alex Stories"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      Recipients
                    </span>
                    <select
                      value={recipientMode}
                      onChange={(e) => setRecipientMode(e.target.value)}
                      className="w-full rounded-xl bg-black border border-[#2f3336] px-4 py-3 text-white outline-none focus:border-[#c30F45]"
                    >
                      <option value="all">All active users</option>
                      <option value="selected">Selected users</option>
                    </select>
                  </label>
                </div>

                <label className="space-y-2 block">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Message
                  </span>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    className="w-full rounded-xl bg-black border border-[#2f3336] px-4 py-3 text-white outline-none focus:border-[#c30F45] resize-y"
                    placeholder="Write the email body here..."
                  />
                </label>

                {recipientMode === "selected" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={selectAllRecipients}
                        className="px-4 py-2 rounded-full text-xs font-bold border border-[#2f3336] text-white hover:bg-[#c30F45]/10"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={clearRecipients}
                        className="px-4 py-2 rounded-full text-xs font-bold border border-[#2f3336] text-white hover:bg-[#181818]"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {selectableUsers.map((recipient) => (
                        <label
                          key={recipient.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#2f3336] bg-black/60 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(recipient.id)}
                            onChange={() => toggleRecipient(recipient.id)}
                            className="h-4 w-4 accent-[#c30F45]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {recipient.displayName || "Unnamed user"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {recipient.email}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full rounded-xl bg-[#c30F45] py-3 font-bold text-white disabled:opacity-60"
                >
                  {sendingEmail ? "Sending..." : "Send email"}
                </button>
              </form>
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
