import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";
import { collection, query, where, doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { Link } from "react-router-dom";
import StoryCard from "../components/StoryCard";

const Profile = () => {
  const { user, logout } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || "");
  const [updateMsg, setUpdateMsg] = useState("");
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [stories, setStories] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());

  const [activeTab, setActiveTab] = useState("stories"); // 'stories', 'followers'

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    const storiesQ = query(collection(db, "stories"), where("authorId", "==", user.uid));
    const unsubStories = onSnapshot(storiesQ, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStories(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    const unsubFollowing = onSnapshot(collection(db, "users", user.uid, "following"), (snap) => {
      setFollowingIds(new Set(snap.docs.map(d => d.id)));
    });

    const unsubFollowers = onSnapshot(collection(db, "users", user.uid, "followers"), async (snap) => {
      const profiles = await Promise.all(
        snap.docs.map(async (fDoc) => {
          const profileSnap = await getDoc(doc(db, "users", fDoc.id));
          return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null;
        })
      );
      setFollowers(profiles.filter(Boolean));
      setLoadingData(false);
    });

    const unsubBookmarks = onSnapshot(collection(db, "users", user.uid, "bookmarks"), (snap) => {
      setBookmarkIds(new Set(snap.docs.map(d => d.id)));
    });

    return () => {
      unsubStories();
      unsubFollowing();
      unsubFollowers();
      unsubBookmarks();
    };
  }, [user]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    setLoadingUpdate(true);
    try {
      await updateProfile(user, { displayName: newUsername });
      await setDoc(doc(db, "users", user.uid), { displayName: newUsername }, { merge: true });
      setUpdateMsg("✅ Profile updated!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setUpdateMsg("❌ Update failed.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const toggleBookmark = async (storyId) => {
    const ref = doc(db, "users", user.uid, "bookmarks", storyId);
    if (bookmarkIds.has(storyId)) await deleteDoc(ref);
    else await setDoc(ref, { savedAt: new Date() });
  };

  const toggleFollow = async (targetUserId) => {
    const followerRef = doc(db, "users", targetUserId, "followers", user.uid);
    const followingRef = doc(db, "users", user.uid, "following", targetUserId);
    if (followingIds.has(targetUserId)) {
      await deleteDoc(followerRef);
      await deleteDoc(followingRef);
    } else {
      await setDoc(followerRef, { followedAt: new Date() });
      await setDoc(followingRef, { followedAt: new Date() });
    }
  };

  if (!user) return <div className="text-center py-20">Please log in.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-2 flex items-center gap-6">
        <Link to="/" className="p-2 rounded-full hover:bg-[#181818] transition">
          <span>←</span>
        </Link>
        <div>
          <h2 className="text-xl font-bold">{user.displayName || "Profile"}</h2>
          <p className="text-xs text-gray-500">{stories.length} stories</p>
        </div>
      </header>

      {/* Banner & Avatar */}
      <div className="relative">
        <div className="h-32 bg-[#2f3336]" />
        <div className="absolute -bottom-16 left-4 border-4 border-black rounded-full overflow-hidden w-32 h-32 bg-black">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex justify-end p-4">
          <button 
            onClick={() => setEditing(!editing)}
            className="border border-[#2f3336] text-white px-4 py-2 rounded-full font-bold hover:bg-[#181818] transition"
          >
            {editing ? "Cancel" : "Edit profile"}
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 mt-8 mb-4">
        {editing ? (
          <div className="flex gap-2 items-center mb-2">
            <input 
              type="text" 
              value={newUsername} 
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-black border border-[#c30F45] rounded-lg px-3 py-1 text-white focus:outline-none"
            />
            <button 
              onClick={handleUpdateUsername}
              disabled={loadingUpdate}
              className="bg-[#c30F45] text-white px-4 py-1 rounded-full text-sm font-bold"
            >
              {loadingUpdate ? "..." : "Save"}
            </button>
          </div>
        ) : (
          <h2 className="text-2xl font-bold">{user.displayName || "Anonymous"}</h2>
        )}
        <p className="text-gray-500 mb-2">@{user.email?.split("@")[0]}</p>
        
        <div className="flex gap-4 text-sm">
          <div className="flex gap-1">
            <span className="font-bold text-white">{followingIds.size}</span>
            <span className="text-gray-500">Following</span>
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-white">{followers.length}</span>
            <span className="text-gray-500">Followers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2f3336]">
        <button 
          onClick={() => setActiveTab("stories")}
          className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === 'stories' ? 'text-white' : 'text-gray-500'}`}
        >
          Stories
          {activeTab === 'stories' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#c30F45] rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab("followers")}
          className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === 'followers' ? 'text-white' : 'text-gray-500'}`}
        >
          Followers
          {activeTab === 'followers' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#c30F45] rounded-full" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="pb-20 lg:pb-0">
        {loadingData ? (
          <div className="text-center py-10 text-gray-500 animate-pulse">Loading...</div>
        ) : activeTab === "stories" ? (
          stories.length > 0 ? (
            stories.map(s => <StoryCard key={s.id} story={s} onBookmark={toggleBookmark} isBookmarked={bookmarkIds.has(s.id)} />)
          ) : (
            <div className="text-center py-20 text-gray-500">No stories yet.</div>
          )
        ) : (
          followers.length > 0 ? (
            followers.map(f => (
              <div key={f.id} className="p-4 flex items-center justify-between border-b border-[#2f3336] hover:bg-[#080808] transition">
                <Link to={`/author/${f.id}`} className="flex items-center gap-3">
                  <img src={f.photoURL} className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <p className="font-bold text-white hover:underline">{f.displayName}</p>
                    <p className="text-xs text-gray-500">@{f.email?.split("@")[0]}</p>
                  </div>
                </Link>
                <button 
                  onClick={() => toggleFollow(f.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${followingIds.has(f.id) ? "border border-[#2f3336] text-white hover:text-red-500 hover:border-red-500" : "bg-white text-black hover:bg-gray-200"}`}
                >
                  {followingIds.has(f.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-500">No followers yet.</div>
          )
        )}
      </div>

      <div className="p-4 border-t border-[#2f3336] mt-auto">
        <button 
          onClick={logout}
          className="w-full py-2 bg-red-600/10 text-red-500 font-bold rounded-full hover:bg-red-600 hover:text-white transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Profile;
