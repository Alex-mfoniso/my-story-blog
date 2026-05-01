// src/pages/ManageStories.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";

const EDIT_WINDOW_MINUTES = 15;

const ManageStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) {
        setStories([]);
        return;
      }

      const storiesQuery = query(
        collection(db, "stories"),
        where("author.uid", "==", user.uid)
      );
      const snapshot = await getDocs(storiesQuery);
      const allStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStories(allStories);
    };

    fetchStories();
  }, [user]);

  const filtered = stories.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  const canEditStory = (story) => {
    const createdSeconds = story.createdAt?.seconds;
    if (!createdSeconds) return false;
    const createdMs = createdSeconds * 1000;
    return Date.now() - createdMs <= EDIT_WINDOW_MINUTES * 60 * 1000;
  };

  const handleDelete = async (storyId) => {
    const confirmed = window.confirm("Delete this story permanently?");
    if (!confirmed) return;

    try {
      setDeletingId(storyId);
      await deleteDoc(doc(db, "stories", storyId));
      setStories((prev) => prev.filter((story) => story.id !== storyId));
    } catch (error) {
      console.error("Delete story error:", error);
      alert("❌ Failed to delete story.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#231123] text-white px-4 py-24">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
        Manage Stories
      </h2>

      {!user && (
        <p className="text-gray-300 text-center mb-6">
          Please log in to manage your stories.
        </p>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title..."
        className="w-full max-w-md p-2 rounded mb-6 mx-auto block text-black"
      />

      {filtered.length === 0 ? (
        <p className="text-gray-300 text-center">No stories found.</p>
      ) : (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {filtered.map((story) => (
            <div
              key={story.id}
              className="bg-[#2c1b2f] rounded p-4 shadow-md"
            >
              <h3 className="text-xl font-semibold text-[#c30F45] mb-1">
                {story.title}
              </h3>
              <p className="text-gray-400 text-sm mb-2">{story.genre}</p>
              <p className="text-sm text-gray-400 mb-2">
                {story.createdAt?.seconds &&
                  formatDistanceToNow(new Date(story.createdAt.seconds * 1000), {
                    addSuffix: true,
                  })}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {canEditStory(story) ? (
                  <Link
                    to={`/edit/${story.id}`}
                    className="inline-block px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    ✏️ Edit Story
                  </Link>
                ) : (
                  <span className="inline-block px-4 py-1 bg-gray-600 text-gray-200 rounded cursor-not-allowed">
                    Edit closed after 15 mins
                  </span>
                )}
                <button
                  onClick={() => handleDelete(story.id)}
                  disabled={deletingId === story.id}
                  className="inline-block px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId === story.id ? "Deleting..." : "🗑 Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStories;
