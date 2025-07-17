import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/fireabase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
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

  const fetchStories = async (loadMore = false) => {
    try {
      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      let q = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc"),
        limit(STORIES_PER_PAGE)
      );

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);

      const enrichedData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const likesSnap = await getCountFromServer(
            collection(db, "stories", doc.id, "likes")
          );
          const commentsSnap = await getCountFromServer(
            collection(db, "stories", doc.id, "comments")
          );

          return {
            id: doc.id,
            ...doc.data(),
            likeCount: likesSnap.data().count,
            commentCount: commentsSnap.data().count,
          };
        })
      );

      const updatedStories = loadMore
        ? [...stories, ...enrichedData.filter(s => !stories.some(st => st.id === s.id))]
        : enrichedData;

      setStories(updatedStories);

      const last = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(last);

      if (snapshot.docs.length < STORIES_PER_PAGE) {
        setHasMore(false);
      }
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
    const ids = new Set(snapshot.docs.map(doc => doc.id));
    setBookmarkIds(ids);
  }, [user]);

  const toggleBookmark = async (storyId) => {
    if (!user) return alert("Login to bookmark stories");
    const ref = doc(db, "users", user.uid, "bookmarks", storyId);
    const isBookmarked = bookmarkIds.has(storyId);
    if (isBookmarked) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { savedAt: new Date() });
    }
    fetchBookmarks();
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

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
      <h2 className="text-4xl font-bold text-center text-[#c30F45] mb-10">📚 Explore Stories</h2>

      <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by title..."
className="flex-1 p-3 rounded-lg bg-[#1f1f38]/70 text-white placeholder-gray-400 border border-[#3a2e4e] focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
className="p-3 rounded-lg bg-[#1f1f38]/70 text-white border border-[#3a2e4e] focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          {genres.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-[#c30F45] border-dashed rounded-full animate-spin"></div>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center text-gray-300">No stories found.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredStories.map((story) => (
            <div key={story.id} className="bg-[#1f1f38]/80 backdrop-blur-sm border border-[#3a2e4e] rounded-lg overflow-hidden shadow-lg hover:shadow-pink-400/20 transition duration-300"
>
              {story.image && (
                <img src={story.image} alt="cover" className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#c30F45] mb-1">{story.title}</h3>
                <p className="text-sm text-gray-400 mb-2">
                  {story.genre} • by {story.author?.name || "Anonymous"}
                </p>
                <p
                  className="text-gray-200 text-sm line-clamp-3 mb-4"
                  dangerouslySetInnerHTML={{ __html: story.content }}
                />
                <div className="flex items-center text-xs text-gray-400 gap-4">
                  <span>❤️ {story.likeCount}</span>
                  <span>💬 {story.commentCount}</span>
                  <button
                    onClick={() => toggleBookmark(story.id)}
                    className="ml-auto text-[#c30F45] hover:text-pink-400"
                  >
                    {bookmarkIds.has(story.id) ? "🔖" : "📑"}
                  </button>
                </div>
                <Link
                  to={`/story/${story.id}`}
                  className="mt-4 inline-block text-sm text-[#c30F45] underline hover:text-pink-400"
                >
                  Read more →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => fetchStories(true)}
            disabled={loadingMore}
            className="bg-[#c30F45] px-6 py-2 rounded hover:opacity-90 transition"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Stories;
