import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import { collection, getDocs, query, orderBy, limit, doc, setDoc, deleteDoc, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StoryCard from "../components/StoryCard";

const STORIES_PER_PAGE = 10;

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'following'
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) return;
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "following"));
        setFollowingIds(snap.docs.map(d => d.id));
      } catch (err) {
        console.error("Error fetching following list:", err);
      }
    };
    fetchFollowing();
  }, [user]);

  const fetchStories = async () => {
    try {
      setLoading(true);

      if (activeTab === "following" && followingIds.length === 0) {
        setStories([]);
        setLoading(false);
        return;
      }

      let q;
      if (activeTab === "all") {
        q = query(
          collection(db, "stories"),
          orderBy("createdAt", "desc"),
          limit(30)
        );
      } else {
        const limitedFollowingIds = followingIds.slice(0, 30);
        q = query(
          collection(db, "stories"),
          where("authorId", "in", limitedFollowingIds),
          limit(30)
        );
      }

      const snapshot = await getDocs(q);
      const publishedDocs = snapshot.docs.filter(doc => doc.data().isDraft !== true);

      const enrichedData = await Promise.all(
        publishedDocs.map(async (docSnap) => {
          const likesSnap = await getDocs(collection(db, "stories", docSnap.id, "likes"));
          const commentsSnap = await getDocs(collection(db, "stories", docSnap.id, "comments"));
          return {
            id: docSnap.id,
            ...docSnap.data(),
            likeCount: likesSnap.size,
            commentCount: commentsSnap.size,
          };
        })
      );

      setStories(enrichedData);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [activeTab, followingIds]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;
      const snapshot = await getDocs(collection(db, "users", user.uid, "bookmarks"));
      setBookmarkIds(new Set(snapshot.docs.map((doc) => doc.id)));
    };
    fetchBookmarks();
  }, [user]);

  const toggleBookmark = async (storyId) => {
    if (!user) return alert("Login to bookmark stories");
    const ref = doc(db, "users", user.uid, "bookmarks", storyId);
    if (bookmarkIds.has(storyId)) {
      await deleteDoc(ref);
      setBookmarkIds(prev => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
    } else {
      await setDoc(ref, { savedAt: new Date() });
      setBookmarkIds(prev => new Set(prev).add(storyId));
    }
  };

  const filteredStories = stories.filter((story) => {
    const matchesTitle = story.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || story.genre === selectedGenre;
    return matchesTitle && matchesGenre;
  });

  const genres = ["All", ...new Set(stories.map((s) => s.genre))];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold">Explore</h2>
        </div>
        
        {user && (
          <div className="flex border-b border-[#2f3336]">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === 'all' ? 'text-white' : 'text-gray-500'}`}
            >
              All
              {activeTab === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#c30F45] rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-4 text-sm font-bold transition hover:bg-[#181818] relative ${activeTab === 'following' ? 'text-white' : 'text-gray-500'}`}
            >
              Following
              {activeTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#c30F45] rounded-full" />}
            </button>
          </div>
        )}
      </header>

      <div className="p-4 border-b border-[#2f3336] flex gap-2 overflow-x-auto no-scrollbar bg-[#080808]">
        <input 
          type="text" 
          placeholder="Search stories..." 
          className="bg-[#202327] border-none rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c30F45] flex-1"
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <select 
          value={selectedGenre} 
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="bg-[#202327] border-none rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c30F45]"
        >
          {genres.map((genre) => <option key={genre}>{genre}</option>)}
        </select>
      </div>

      <div className="pb-20 lg:pb-0">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {activeTab === "following" ? "You aren't following anyone yet." : "No stories found."}
          </div>
        ) : (
          filteredStories.map((story) => (
            <StoryCard 
              key={story.id} 
              story={story} 
              onBookmark={toggleBookmark}
              isBookmarked={bookmarkIds.has(story.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Stories;
