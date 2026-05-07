import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StoryCardSkeleton from "../components/StoryCardSkeleton"; // Import the skeleton
import StoryCard from "../components/StoryCard";

const Home = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "stories"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);

        // Client-side filtering to avoid composite index requirement for drafts
        const publishedDocs = snapshot.docs.filter(doc => doc.data().isDraft !== true).slice(0, 10);

        const storiesWithCounts = await Promise.all(
          publishedDocs.map(async (docSnap) => {
            const storyData = { id: docSnap.id, ...docSnap.data() };
            const likesSnap = await getDocs(collection(db, "stories", docSnap.id, "likes"));
            const commentsSnap = await getDocs(collection(db, "stories", docSnap.id, "comments"));

            return {
              ...storyData,
              likes: likesSnap.size,
              commentCount: commentsSnap.size,
            };
          }),
        );

        setStories(storiesWithCounts);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBookmarks = async () => {
      if (!user) return;
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "bookmarks"),
      );
      setBookmarkIds(new Set(snapshot.docs.map((doc) => doc.id)));
    };

    fetchStories();
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

  return (
    <div className="flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
        <h2 className="text-xl font-bold">Home</h2>
      </header>

      {/* Stories Feed */}
      <div className="pb-20 lg:pb-0">
        {loading ? (
          <>
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </>
        ) : stories.length > 0 ? (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onBookmark={toggleBookmark}
              isBookmarked={bookmarkIds.has(story.id)}
            />
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            No stories yet. Be the first to post!
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
