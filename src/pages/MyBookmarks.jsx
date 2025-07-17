import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/fireabase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  getCountFromServer,
  deleteDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const MyBookmarks = () => {
  const { user } = useAuth();
  const [bookmarkedStories, setBookmarkedStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      try {
        const bookmarksRef = collection(db, "users", user.uid, "bookmarks");
        const snapshot = await getDocs(bookmarksRef);

        const stories = await Promise.all(
          snapshot.docs.map(async (bookmarkDoc) => {
            const storyId = bookmarkDoc.id;

            const storyRef = doc(db, "stories", storyId);
            const storySnap = await getDoc(storyRef);
            if (!storySnap.exists()) return null;

            const storyData = storySnap.data();

            const likesSnap = await getCountFromServer(
              collection(db, "stories", storyId, "likes")
            );
            const commentsSnap = await getCountFromServer(
              collection(db, "stories", storyId, "comments")
            );

            return {
              id: storyId,
              ...storyData,
              likeCount: likesSnap.data().count,
              commentCount: commentsSnap.data().count,
            };
          })
        );

        setBookmarkedStories(stories.filter(Boolean));
      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const handleRemoveBookmark = async (storyId) => {
    if (!user) return;

    const confirm = window.confirm(
      "Are you sure you want to remove this story from your bookmarks?"
    );

    if (!confirm) return;

    try {
      const bookmarkRef = doc(db, "users", user.uid, "bookmarks", storyId);
      await deleteDoc(bookmarkRef);
      setBookmarkedStories((prev) =>
        prev.filter((story) => story.id !== storyId)
      );

      toast.success("✅ Bookmark removed successfully!");
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
      toast.error("❌ Failed to remove bookmark. Try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#231123] to-[#3a263e] text-white">
        🔐 Please log in to view your bookmarks.
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20 bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2e] to-[#1f1f38]  text-white">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-10">
        📚 My Bookmarked Stories
      </h2>

      {loading ? (
        <div className="text-center text-gray-300 animate-pulse">
          Loading bookmarks...
        </div>
      ) : bookmarkedStories.length === 0 ? (
        <div className="text-center text-gray-400">
          You haven’t bookmarked any stories yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {bookmarkedStories.map((story) => (
            <div
              key={story.id}
className="bg-[#3a263e]/80 backdrop-blur-sm border border-[#4d3754] rounded-xl p-6 shadow-inner transition hover:shadow-pink-400/20"
            >
              <h3 className="text-xl font-semibold text-[#c30F45] mb-2">
                {story.title}
              </h3>
              <p className="text-sm text-gray-300 mb-2 italic">
                {story.genre} • by {story.author?.name || "Anonymous"}
              </p>
              <div
                className="text-gray-200 text-sm line-clamp-3 mb-4"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
              <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                <div>
                  <span>❤️ {story.likeCount} likes</span> •{" "}
                  <span>💬 {story.commentCount} comments</span>
                </div>
                <button
                  onClick={() => handleRemoveBookmark(story.id)}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  Remove ❌
                </button>
              </div>
              <Link
                to={`/story/${story.id}`}
                className="inline-block mt-2 text-sm text-[#c30F45] hover:text-pink-400 font-medium underline"
              >
                Read full story →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookmarks;
