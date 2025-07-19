import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, setDoc,getDoc,deleteDoc } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import LikesAndComments from "../components/LikesAndComments";

 

const WORDS_PER_PAGE = 250;

const StoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmark, setBookmark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "stories", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setStory({ id: snap.id, ...snap.data() });
        }

        if (user) {
          const bookmarkSnap = await getDoc(
            doc(db, "users", user.uid, "bookmarks", id)
          );
          setBookmark(bookmarkSnap.exists());
        }
      } catch (err) {
        console.error("Failed to load story:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, user]);

 const toggleBookmark = async () => {
  if (!user) return alert("Login to bookmark.");
  const ref = doc(db, "users", user.uid, "bookmarks", id);
  try {
    if (bookmark) {
      await deleteDoc(ref);   // <- now recognized
      setBookmark(false);
    } else {
      await setDoc(ref, { savedAt: new Date() });  // <- now recognized
      setBookmark(true);
    }
  } catch (err) {
    console.error("Bookmark error:", err);
  }
};


  if (loading || !story) {
    return <div className="text-white text-center py-10">Loading story...</div>;
  }

  const words = story.content.split(" ");
  const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
  const pageWords = words.slice(
    (currentPage - 1) * WORDS_PER_PAGE,
    currentPage * WORDS_PER_PAGE
  );
  const pageContent = pageWords.join(" ");

  return (
    <div className="min-h-screen px-4 py-24 bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2e] to-[#1f1f38] text-white max-w-3xl mx-auto">
      <div className="bg-[#1f1f38]/80 backdrop-blur-sm border border-[#3a2e4e] p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#c30F45]">{story.title}</h1>
          <button
            onClick={toggleBookmark}
            className="text-2xl"
            title="Bookmark"
          >
            {bookmark ? "🔖" : "📑"}
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          {story.genre} • by {story.author?.name || "Anonymous"} •{" "}
          {formatDistanceToNow(new Date(story.createdAt?.seconds * 1000), {
            addSuffix: true,
          })}
        </p>

        {story.image && (
          <img
            src={story.image}
            alt="cover"
            className="rounded-lg w-full max-h-96 object-cover mb-6"
          />
        )}

        <div
          className="prose prose-invert max-w-none text-white mb-6"
          dangerouslySetInnerHTML={{ __html: pageContent }}
        />

        <div className="flex justify-between mb-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded disabled:opacity-40"
          >
            ← Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        <LikesAndComments storyId={id} user={user} />
      </div>
    </div>
  );
};

export default StoryDetail;
