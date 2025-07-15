import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  getCountFromServer,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Loading state

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
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

        setStories(enrichedData);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
        Stories
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-[#c30F45] border-dashed rounded-full animate-spin"></div>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center text-gray-300">No stories yet.</div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {stories.map((story) => (
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

export default Stories;
