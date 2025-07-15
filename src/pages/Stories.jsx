import React, { useEffect, useState, useRef } from "react";
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
const CACHE_REFRESH_INTERVAL = 1000 * 60 * 10; // 10 minutes

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
  const observer = useRef();

  const fetchStories = async (loadMore = false, reset = false) => {
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

      setStories((prev) => {
        const updated = loadMore ? [...prev, ...enrichedData] : enrichedData;
        const uniqueStories = Array.from(
          new Map(updated.map((story) => [story.id, story])).values()
        );
        localStorage.setItem("cachedStories", JSON.stringify(uniqueStories));
        localStorage.setItem("storiesCacheTime", Date.now().toString());
        return uniqueStories;
      });

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
    const cacheTime = parseInt(localStorage.getItem("storiesCacheTime"), 10);
    const now = Date.now();

    if (!cacheTime || now - cacheTime > CACHE_REFRESH_INTERVAL) {
      fetchStories(false, true);
    } else if (stories.length === 0) {
      fetchStories();
    }
  }, []);

  const lastStoryRef = useRef();
  useEffect(() => {
    if (loadingMore || !hasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchStories(true);
      }
    });
    if (lastStoryRef.current) observer.current.observe(lastStoryRef.current);
  }, [loadingMore, hasMore, lastDoc]);

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
          className="flex-1 p-3 rounded text-white bg-[#2c1b2f]"
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
          {filteredStories.map((story, idx) => (
            <div
              key={story.id}
              className="bg-[#2c1b2f] p-6 rounded shadow"
              ref={idx === filteredStories.length - 1 ? lastStoryRef : null}
            >
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

          {!hasMore && (
            <div className="text-center text-gray-500 pt-6">🎉 You’ve reached the end!</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Stories;
