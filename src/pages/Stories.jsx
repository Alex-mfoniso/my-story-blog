import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const STORIES_PER_PAGE = 5;

const Stories = () => {
  const [stories, setStories] = useState(() => {
    const cached = localStorage.getItem("cachedStories");
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(stories.length === 0);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

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
        ? [...stories, ...enrichedData]
        : enrichedData;

      setStories(updatedStories);
      localStorage.setItem("cachedStories", JSON.stringify(updatedStories));

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

  useEffect(() => {
    if (stories.length === 0) fetchStories();
  }, []);

  const filteredStories = stories.filter((story) => {
    const matchesTitle = story.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || story.genre === selectedGenre;
    return matchesTitle && matchesGenre;
  });

  const genres = ["All", ...new Set(stories.map((s) => s.genre))];

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">Stories</h2>

      <div className="max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by title..."
          className="flex-1 p-3 rounded text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="p-3 rounded text-black"
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
        <div className="space-y-6 max-w-3xl mx-auto">
          {filteredStories.map((story) => (
            <div key={story.id} className="bg-[#2c1b2f] p-6 rounded shadow">
              <h3 className="text-2xl font-bold text-[#c30F45]">{story.title}</h3>
              <p className="text-sm text-gray-300 mb-2">
                {story.genre} • by {story.author?.name || "Anonymous"}
              </p>
              <p
                className="text-gray-200 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
              <div className="flex items-center text-sm text-gray-400 mt-3 gap-4">
                <span>❤️ {story.likeCount} likes</span>
                <span>💬 {story.commentCount} comments</span>
              </div>
              <Link
                to={`/story/${story.id}`}
                className="mt-4 inline-block text-[#c30F45] underline hover:text-pink-400"
              >
                Read more →
              </Link>
            </div>
          ))}

          {hasMore && (
            <div className="text-center mt-6">
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
      )}
    </div>
  );
};

export default Stories;
