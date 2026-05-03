import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, orderBy, getDocs, writeBatch, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.filter(n => !n.read).length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        const ref = doc(db, "users", user.uid, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const markAsRead = async (id) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'like': return <span className="text-pink-600 text-2xl">❤️</span>;
      case 'comment': return <span className="text-blue-500 text-2xl">💬</span>;
      case 'reply': return <span className="text-blue-500 text-2xl">💬</span>;
      case 'follow': return <span className="text-purple-500 text-2xl">👤</span>;
      default: return <span className="text-[#c30F45] text-2xl">🔔</span>;
    }
  };

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to view notifications.</div>;

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === 'comment' || n.type === 'reply');

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
        <div className="px-4 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold">Notifications</h2>
          <button 
            onClick={markAllAsRead}
            className="text-sm text-[#c30F45] hover:underline"
          >
            Mark all as read
          </button>
        </div>
        
        <div className="flex border-b border-[#2f3336]">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === 'all' ? 'text-white' : 'text-gray-500'}`}
          >
            All
            {activeTab === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#c30F45] rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('mentions')}
            className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === 'mentions' ? 'text-white' : 'text-gray-500'}`}
          >
            Mentions
            {activeTab === 'mentions' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#c30F45] rounded-full" />}
          </button>
        </div>
      </header>

      {/* Notifications List */}
      <div className="pb-20 lg:pb-0">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 px-8">
            <h3 className="text-2xl font-bold text-white mb-2">Nothing to see here — yet</h3>
            <p className="text-gray-500">From likes to follows and a whole lot more, this is where all the action happens.</p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => !notif.read && markAsRead(notif.id)}
              className={`px-4 py-3 border-b border-[#2f3336] flex gap-3 cursor-pointer hover:bg-[#080808] transition duration-200 ${!notif.read ? 'bg-[#c30F45]/5' : ''}`}
            >
              <div className="flex-shrink-0 w-10 flex justify-end">
                {renderIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/author/${notif.fromUserId}`} className="inline-block mb-2">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${notif.fromUserName}&background=random`} 
                    alt="" 
                    className="w-8 h-8 rounded-full border border-[#2f3336]" 
                  />
                </Link>
                <div className="text-[15px] leading-normal">
                  <span className="font-bold text-white">{notif.fromUserName}</span>
                  <span className="text-gray-300 ml-1">
                    {notif.type === 'like' && "liked your story"}
                    {notif.type === 'comment' && "commented on your story"}
                    {notif.type === 'reply' && "replied to your comment"}
                    {notif.type === 'follow' && "followed you"}
                  </span>
                  {notif.storyTitle && (
                    <Link to={`/story/${notif.storyId}`} className="block text-gray-500 mt-1 hover:text-[#c30F45] transition">
                      {notif.storyTitle}
                    </Link>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {notif.createdAt?.seconds 
                    ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) 
                    : 'just now'}
                </p>
              </div>
              {!notif.read && (
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-2 h-2 bg-[#c30F45] rounded-full"></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
