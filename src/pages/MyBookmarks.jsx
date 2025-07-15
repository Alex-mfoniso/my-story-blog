import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/fireabase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  getCountFromServer,
  collectionGroup,
} from "firebase/firestore";
import { Link } from "react-router-dom";

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

            // Get actual story data
            const storyRef = doc(db, "stories", storyId);
            const storySnap = await getDoc(storyRef);
            if (!storySnap.exists()) return null;

            const storyData = storySnap.data();

            // Get like and comment counts
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

        // Filter out any null (non-existent) stories
        setBookmarkedStories(stories.filter(Boolean));
      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
        Please log in to view your bookmarks.
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
        My Bookmarked Stories
      </h2>

      {loading ? (
        <div className="text-center">Loading bookmarks...</div>
      ) : bookmarkedStories.length === 0 ? (
        <div className="text-center">You have no bookmarked stories yet.</div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {bookmarkedStories.map((story) => (
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
        </div>
      )}
    </div>
  );
};

export default MyBookmarks;
