// src/pages/ManageStories.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const ManageStories = () => {
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStories = async () => {
      const snapshot = await getDocs(collection(db, "stories"));
      const allStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStories(allStories);
    };

    fetchStories();
  }, []);

  const filtered = stories.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#231123] text-white px-4 py-24">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
        Manage Stories
      </h2>

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
              <Link
                to={`/edit/${story.id}`}
                className="inline-block mt-2 px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                ✏️ Edit Story
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStories;
