import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, logout } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || "");
  const [updateMsg, setUpdateMsg] = useState("");
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Dashboard Data
  const [stories, setStories] = useState([]);
  const [followers, setFollowers] = useState([]); // Array of rich user objects
  const [followingIds, setFollowingIds] = useState(new Set()); // Set of IDs the user follows
  const [loadingData, setLoadingData] = useState(true);

  const activeTabDefault = "stories";
  const [activeTab, setActiveTab] = useState(activeTabDefault); // 'stories', 'followers'

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    // 1. Stories Listener
    const storiesQ = query(collection(db, "stories"), where("authorId", "==", user.uid));
    const unsubStories = onSnapshot(storiesQ, (snap) => {
      const publishedDocs = snap.docs
        .filter(d => d.data().isDraft !== true)
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
      setStories(publishedDocs);
    }, (error) => {
      console.error("Error fetching stories:", error);
    });

    // 2. Following Listener
    const unsubFollowing = onSnapshot(collection(db, "users", user.uid, "following"), (snap) => {
      setFollowingIds(new Set(snap.docs.map(d => d.id)));
    });

    // 3. Followers Listener
    const unsubFollowers = onSnapshot(collection(db, "users", user.uid, "followers"), async (snap) => {
      const followerProfiles = await Promise.all(
        snap.docs.map(async (fDoc) => {
          const profileSnap = await getDoc(doc(db, "users", fDoc.id));
          return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data(), followDoc: fDoc.data() } : null;
        })
      );
      setFollowers(followerProfiles.filter(Boolean));
      setLoadingData(false);
    });

    return () => {
      unsubStories();
      unsubFollowing();
      unsubFollowers();
    };
  }, [user]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setUpdateMsg("❌ Username cannot be empty.");
      return;
    }
    setLoadingUpdate(true);
    try {
      await updateProfile(user, { displayName: newUsername });
      await setDoc(doc(db, "users", user.uid), { displayName: newUsername }, { merge: true });
      setUpdateMsg("✅ Username updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setUpdateMsg("❌ Failed to update username.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
      setUpdateMsg("❌ Logout failed.");
    }
  };

  const toggleFollow = async (targetUserId) => {
    try {
      const followerRef = doc(db, "users", targetUserId, "followers", user.uid);
      const followingRef = doc(db, "users", user.uid, "following", targetUserId);

      const newFollowingIds = new Set(followingIds);
      if (followingIds.has(targetUserId)) {
        await deleteDoc(followerRef);
        await deleteDoc(followingRef);
        newFollowingIds.delete(targetUserId);
      } else {
        await setDoc(followerRef, { followedAt: new Date() });
        await setDoc(followingRef, { followedAt: new Date() });
        newFollowingIds.add(targetUserId);

        // TRIGGER NOTIFICATION
        const notifRef = doc(collection(db, "users", targetUserId, "notifications"));
        await setDoc(notifRef, {
          type: "follow",
          fromUserId: user.uid,
          fromUserName: user.displayName || "Someone",
          read: false,
          createdAt: new Date()
        });
      }
      setFollowingIds(newFollowingIds);
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to follow/unfollow user.");
    }
  };

  if (!user) return <div className="min-h-screen flex justify-center items-center text-white bg-[#231123]">🔐 Please log in.</div>;

  return (
    <div className="min-h-screen bg-[#231123] text-white pt-24 pb-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Profile Details & Settings */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-[#2c1b2f] p-6 rounded-2xl border border-[#3a2e4e] shadow-xl text-center">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Avatar" 
              className="w-32 h-32 mx-auto rounded-full border-4 border-[#c30F45] object-cover mb-4"
            />
            
            {editing ? (
              <div className="mb-4 text-left">
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full p-2 rounded text-black mb-2 border focus:ring-2 focus:ring-[#c30F45] outline-none" placeholder="New username" />
                <div className="flex gap-2">
                  <button onClick={handleUpdateUsername} disabled={loadingUpdate} className="flex-1 bg-[#c30F45] hover:bg-pink-600 py-1 rounded text-white text-sm font-semibold">{loadingUpdate ? "Saving..." : "Save"}</button>
                  <button onClick={() => setEditing(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-1 rounded text-white text-sm font-semibold">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-1">{user.displayName || "Anonymous"}</h2>
                <button onClick={() => setEditing(true)} className="text-[#c30F45] hover:text-pink-400 text-sm font-semibold hover:underline">Edit Username</button>
              </div>
            )}

            <p className="text-gray-400 text-sm mb-6">{user.email}</p>

            <div className="flex justify-around text-center border-t border-[#3a2e4e] pt-6">
              <div>
                <span className="block text-2xl font-bold text-white">{stories.length}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Stories</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">{followers.length}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Followers</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">{followingIds.size}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Following</span>
              </div>
            </div>

            {updateMsg && <p className="mt-4 text-sm text-green-400">{updateMsg}</p>}
          </div>

          <div className="bg-[#2c1b2f] p-4 rounded-2xl border border-[#3a2e4e] shadow-xl">
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white py-3 rounded-lg font-bold transition">
              🔓 Log Out
            </button>
          </div>
        </div>

        {/* Right Main Content: Tabs */}
        <div className="w-full md:w-2/3">
          <div className="flex border-b border-[#3a2e4e] mb-6">
            <button 
              onClick={() => setActiveTab('stories')} 
              className={`pb-3 px-6 font-semibold transition ${activeTab === 'stories' ? 'text-[#c30F45] border-b-2 border-[#c30F45]' : 'text-gray-400 hover:text-white'}`}
            >
              My Stories
            </button>
            <button 
              onClick={() => setActiveTab('followers')} 
              className={`pb-3 px-6 font-semibold transition ${activeTab === 'followers' ? 'text-[#c30F45] border-b-2 border-[#c30F45]' : 'text-gray-400 hover:text-white'}`}
            >
              My Followers
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-10 text-gray-400 animate-pulse">Loading data...</div>
          ) : (
            <div>
              {/* Tab: Stories */}
              {activeTab === 'stories' && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {stories.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-400 py-10 bg-[#1f1f38]/80 border border-[#3a2e4e] rounded-xl">
                      <p className="mb-4">You haven't published any stories yet.</p>
                      <Link to="/upload" className="px-6 py-2 bg-[#c30F45] text-white rounded font-semibold hover:bg-pink-600 transition">Write a Story</Link>
                    </div>
                  ) : (
                    stories.map(story => (
                      <div key={story.id} className="bg-[#1f1f38]/80 border border-[#3a2e4e] rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 transition duration-300">
                        {story.image && <img src={story.image} alt={story.title} className="w-full h-32 object-cover" />}
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-1 truncate">{story.title}</h3>
                          <span className="text-xs bg-[#2c1b2f] px-2 py-1 rounded text-gray-300 mb-2 inline-block">{story.genre}</span>
                          <div className="mt-2 flex justify-between items-center">
                            <Link to={`/story/${story.id}`} className="text-sm text-[#c30F45] hover:underline font-semibold">View Story →</Link>
                            <Link to={`/edit/${story.id}`} className="text-sm text-gray-400 hover:text-white">Edit</Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Followers */}
              {activeTab === 'followers' && (
                <div className="space-y-4">
                  {followers.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 bg-[#1f1f38]/80 border border-[#3a2e4e] rounded-xl">
                      <p>You don't have any followers yet.</p>
                    </div>
                  ) : (
                    followers.map(follower => {
                      const isMutual = followingIds.has(follower.id);
                      return (
                        <div key={follower.id} className="bg-[#1f1f38]/80 border border-[#3a2e4e] p-4 rounded-xl flex items-center justify-between shadow">
                          <div className="flex items-center gap-4">
                            <Link to={`/author/${follower.id}`}>
                              <img src={follower.photoURL} alt={follower.displayName} className="w-12 h-12 rounded-full border-2 border-[#c30F45] hover:scale-105 transition" />
                            </Link>
                            <div>
                              <Link to={`/author/${follower.id}`} className="font-bold text-white hover:text-[#c30F45] transition">{follower.displayName}</Link>
                              <p className="text-xs text-gray-400">Followed you recently</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleFollow(follower.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${isMutual ? "bg-[#2c1b2f] text-white border border-[#3a2e4e] hover:bg-red-900/50 hover:border-red-500 hover:text-red-400" : "bg-[#c30F45] text-white hover:bg-pink-600"}`}
                          >
                            {isMutual ? "Following" : "Follow Back"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
