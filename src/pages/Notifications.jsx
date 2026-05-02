import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, orderBy, getDocs, writeBatch, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "notifications"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter(n => !n.read);
      
      unreadNotifs.forEach(n => {
        const ref = doc(db, "users", user.uid, "notifications", n.id);
        batch.update(ref, { read: true });
      });

      await batch.commit();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const markAsRead = async (id) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'reply': return '↩️';
      case 'follow': return '👤';
      default: return '🔔';
    }
  };

  if (!user) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">🔐 Please log in.</div>;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#231123] text-white pt-24 pb-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-[#3a2e4e] pb-4">
          <div>
            <h1 className="text-4xl font-bold text-[#c30F45]">Notifications</h1>
            <p className="text-gray-400 mt-2">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm bg-[#2c1b2f] hover:bg-[#3a2e4e] px-4 py-2 rounded-full border border-[#3a2e4e] transition text-gray-300">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-[#1f1f38]/50 rounded-2xl border border-[#3a2e4e]">
            <span className="text-6xl block mb-4">📭</span>
            <p className="text-xl text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-xl border flex items-start gap-4 transition duration-300 ${notif.read ? 'bg-[#1f1f38]/50 border-[#2a2a45]' : 'bg-[#2c1b2f] border-[#c30F45]/50 shadow-lg shadow-[#c30F45]/10'}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className="text-2xl mt-1">{renderIcon(notif.type)}</div>
                <div className="flex-1">
                  <p className="text-gray-200">
                    <Link to={`/author/${notif.fromUserId}`} className="font-bold text-white hover:text-[#c30F45] hover:underline">
                      {notif.fromUserName}
                    </Link>
                    {' '}
                    {notif.type === 'like' && "liked your story"}
                    {notif.type === 'comment' && "commented on your story"}
                    {notif.type === 'reply' && "replied to your comment on"}
                    {notif.type === 'follow' && "started following you"}
                    {' '}
                    {notif.storyId && (
                      <Link to={`/story/${notif.storyId}`} className="font-semibold text-pink-400 hover:text-pink-300 hover:underline">
                        "{notif.storyTitle}"
                      </Link>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notif.createdAt?.seconds ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) : 'just now'}
                  </p>
                </div>
                {!notif.read && <div className="w-3 h-3 bg-[#c30F45] rounded-full mt-2 animate-pulse"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
