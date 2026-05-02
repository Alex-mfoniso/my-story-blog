import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, getDocs, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const AuthorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [author, setAuthor] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    setLoading(true);

    // 1. Author Profile Listener
    const unsubAuthor = onSnapshot(doc(db, "users", id), (docSnap) => {
      if (docSnap.exists()) {
        setAuthor({ id: docSnap.id, ...docSnap.data() });
      }
    });

    // 2. Stories Listener
    const storiesQ = query(collection(db, "stories"), where("authorId", "==", id));
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
    });

    // 3. Followers Listener
    const unsubFollowers = onSnapshot(collection(db, "users", id, "followers"), (snap) => {
      setFollowerCount(snap.size);
      
      // Check if current user is in this list
      if (user) {
        setIsFollowing(snap.docs.some(d => d.id === user.uid));
      }
      setLoading(false);
    });

    return () => {
      unsubAuthor();
      unsubStories();
      unsubFollowers();
    };
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) return alert("You must be logged in to follow an author.");
    if (user.uid === id) return; // Can't follow yourself

    try {
      const followerRef = doc(db, "users", id, "followers", user.uid);
      const followingRef = doc(db, "users", user.uid, "following", id);

      if (isFollowing) {
        await deleteDoc(followerRef);
        await deleteDoc(followingRef);
        setFollowerCount(prev => Math.max(0, prev - 1));
        setIsFollowing(false);
      } else {
        await setDoc(followerRef, { followedAt: new Date() });
        await setDoc(followingRef, { followedAt: new Date() });
        setFollowerCount(prev => prev + 1);
        setIsFollowing(true);

        // TRIGGER NOTIFICATION
        const notifRef = doc(collection(db, "users", id, "notifications"));
        await setDoc(notifRef, {
          type: "follow",
          fromUserId: user.uid,
          fromUserName: user.displayName || "Someone",
          read: false,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to follow/unfollow. Security rules might need updating.");
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Loading profile...</div>;
  if (!author) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Author not found.</div>;

  return (
    <div className="min-h-screen bg-[#231123] text-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-[#2c1b2f] p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6 border border-[#3a2e4e] mb-10 relative">
          <img 
            src={author.photoURL || `https://ui-avatars.com/api/?name=${author.displayName}`} 
            alt={author.displayName} 
            className="w-32 h-32 rounded-full border-4 border-[#c30F45] object-cover"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-white mb-2">{author.displayName}</h1>
            <p className="text-gray-400 mb-4">Joined {author.createdAt?.seconds ? formatDistanceToNow(new Date(author.createdAt.seconds * 1000), { addSuffix: true }) : 'recently'}</p>
            <div className="flex justify-center md:justify-start gap-6 text-sm text-gray-300">
              <div className="text-center">
                <span className="block font-bold text-2xl text-[#c30F45]">{stories.length}</span>
                Stories
              </div>
              <div className="text-center">
                <span className="block font-bold text-2xl text-[#c30F45]">{followerCount}</span>
                Followers
              </div>
            </div>
          </div>
          
          {user && user.uid !== id && (
            <button 
              onClick={toggleFollow}
              className={`absolute top-8 right-8 px-6 py-2 rounded-full font-semibold transition shadow-lg ${
                isFollowing 
                  ? "bg-gray-700 text-white hover:bg-gray-600" 
                  : "bg-[#c30F45] text-white hover:bg-pink-600"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Stories Grid */}
        <h2 className="text-2xl font-bold mb-6 text-[#c30F45]">Published Works</h2>
        {stories.length === 0 ? (
          <p className="text-gray-400 text-center py-10">This author hasn't published any stories yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {stories.map(story => (
              <div key={story.id} className="bg-[#1f1f38]/80 border border-[#3a2e4e] rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 transition duration-300">
                {story.image && (
                  <img src={story.image} alt={story.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-1">{story.title}</h3>
                  <span className="text-xs bg-[#2c1b2f] px-2 py-1 rounded text-gray-300 mb-3 inline-block">{story.genre}</span>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">{story.excerpt}</p>
                  <Link to={`/story/${story.id}`} className="text-[#c30F45] hover:underline text-sm font-semibold">
                    Read Story →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorProfile;
