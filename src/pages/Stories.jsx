import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/fireabase";
import { collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer, doc, setDoc, deleteDoc, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STORIES_PER_PAGE = 5;

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  
  // Feed Tabs
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'following'
  const [followingIds, setFollowingIds] = useState([]);

  // Fetch who the user is following
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

  const fetchStories = async (loadMore = false) => {
    try {
      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      // If on 'following' tab and not following anyone, return empty early
      if (activeTab === "following" && followingIds.length === 0) {
        setStories([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      let q;
      if (activeTab === "all") {
        q = query(
          collection(db, "stories"),
          orderBy("createdAt", "desc"),
          limit(STORIES_PER_PAGE * 3) // Fetch more to allow client filtering
        );
      } else {
        const limitedFollowingIds = followingIds.slice(0, 30);
        q = query(
          collection(db, "stories"),
          where("authorId", "in", limitedFollowingIds),
          limit(STORIES_PER_PAGE * 3)
        );
      }

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      // Client-side filter to remove drafts
      const publishedDocs = snapshot.docs.filter(doc => doc.data().isDraft !== true).slice(0, STORIES_PER_PAGE);

      const enrichedData = await Promise.all(
        publishedDocs.map(async (docSnap) => {
          const likesSnap = await getCountFromServer(collection(db, "stories", docSnap.id, "likes"));
          const commentsSnap = await getCountFromServer(collection(db, "stories", docSnap.id, "comments"));
          return {
            id: docSnap.id,
            ...docSnap.data(),
            likeCount: likesSnap.data().count,
            commentCount: commentsSnap.data().count,
          };
        })
      );

      const updatedStories = loadMore
        ? [...stories, ...enrichedData.filter((s) => !stories.some((st) => st.id === s.id))]
        : enrichedData;

      // Client-side sort
      updatedStories.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setStories(updatedStories);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length >= STORIES_PER_PAGE);

    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    const snapshot = await getDocs(collection(db, "users", user.uid, "bookmarks"));
    setBookmarkIds(new Set(snapshot.docs.map((doc) => doc.id)));
  }, [user]);

  const toggleBookmark = async (storyId) => {
    if (!user) return alert("Login to bookmark stories");
    const ref = doc(db, "users", user.uid, "bookmarks", storyId);
    if (bookmarkIds.has(storyId)) await deleteDoc(ref);
    else await setDoc(ref, { savedAt: new Date() });
    fetchBookmarks();
  };

  // Re-fetch stories when the active tab changes or followingIds loads
  useEffect(() => {
    // Only fetch if followingIds is populated (or empty and we know it's empty)
    // To avoid flashing, we can just fetch.
    setLastDoc(null);
    setStories([]);
    fetchStories(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, followingIds]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const filteredStories = stories.filter((story) => {
    const matchesTitle = story.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || story.genre === selectedGenre;
    return matchesTitle && matchesGenre;
  });

  const genres = ["All", ...new Set(stories.map((s) => s.genre))];

  return (
    <div className="min-h-screen px-4 py-24 bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2e] to-[#1f1f38] text-white">
      <h2 className="text-4xl font-bold text-center text-[#c30F45] mb-6">📚 Explore Stories</h2>

      {/* Feed Tabs */}
      {user && (
        <div className="max-w-5xl mx-auto flex justify-center mb-8 border-b border-[#3a2e4e]">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-semibold transition ${activeTab === 'all' ? 'text-[#c30F45] border-b-2 border-[#c30F45]' : 'text-gray-400 hover:text-white'}`}
          >
            All Stories
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`px-6 py-3 font-semibold transition ${activeTab === 'following' ? 'text-[#c30F45] border-b-2 border-[#c30F45]' : 'text-gray-400 hover:text-white'}`}
          >
            Following
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
        <input type="text" placeholder="Search by title..." className="flex-1 p-3 rounded-lg bg-[#1f1f38]/70 text-white placeholder-gray-400 border border-[#3a2e4e] focus:outline-none focus:ring-2 focus:ring-pink-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="p-3 rounded-lg bg-[#1f1f38]/70 text-white border border-[#3a2e4e] focus:outline-none focus:ring-2 focus:ring-pink-500">
          {genres.map((genre) => <option key={genre}>{genre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-[#c30F45] border-dashed rounded-full animate-spin"></div>
        </div>
      ) : activeTab === "following" && followingIds.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-xl mb-4">You aren't following anyone yet.</p>
          <button onClick={() => setActiveTab('all')} className="px-6 py-2 bg-[#2c1b2f] border border-[#3a2e4e] rounded-full hover:bg-[#3a2e4e] transition">Discover Authors</button>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center text-gray-300">No stories found.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredStories.map((story) => (
            <div key={story.id} className="bg-[#1f1f38]/80 backdrop-blur-sm border border-[#3a2e4e] rounded-lg overflow-hidden shadow-lg hover:shadow-pink-400/20 transition duration-300 flex flex-col">
              {story.image && <img src={story.image} alt="cover" className="w-full h-48 object-cover" />}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-[#c30F45] mb-1">{story.title}</h3>
                
                {/* Link to Author Profile */}
                <p className="text-sm text-gray-400 mb-2">
                  {story.genre} • by{' '}
                  <Link to={`/author/${story.authorId || story.author?.uid}`} className="font-semibold text-gray-300 hover:text-white hover:underline">
                    {story.author?.name || "Anonymous"}
                  </Link>
                </p>
                
                <p className="text-gray-200 text-sm line-clamp-3 mb-4 flex-1" dangerouslySetInnerHTML={{ __html: story.content }} />
                
                <div className="flex items-center text-xs text-gray-400 gap-4 mt-auto border-t border-[#3a2e4e] pt-4">
                  <span>❤️ {story.likeCount}</span>
                  <span>💬 {story.commentCount}</span>
                  <button onClick={() => toggleBookmark(story.id)} className="ml-auto text-[#c30F45] hover:text-pink-400">
                    {bookmarkIds.has(story.id) ? "🔖" : "📑"}
                  </button>
                </div>
                <Link to={`/story/${story.id}`} className="mt-4 block text-center py-2 bg-[#2c1b2f] rounded text-[#c30F45] hover:bg-[#3a2e4e] transition text-sm font-semibold">
                  Read Story
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center mt-10">
          <button onClick={() => fetchStories(true)} disabled={loadingMore} className="bg-[#c30F45] px-6 py-2 rounded hover:opacity-90 transition">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Stories;
