import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const Stories = () => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const fetchStories = async () => {
      const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStories(data);
    };

    fetchStories();
  }, []);

  return (
    <div className="min-h-screen bg-[#231123] text-white px-6 py-24">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-8">
        All Stories
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div
            key={story.id}
            className="bg-[#2e1c31] rounded shadow-md overflow-hidden"
          >
            <img
              src={story.coverImageURL}
              alt={story.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold text-[#c30F45]">
                {story.title}
              </h3>
              <p className="text-sm text-gray-300">{story.genre}</p>
              <p className="mt-2 text-gray-200 line-clamp-3">
                {story.content.slice(0, 120)}...
              </p>
              <a
                href={`/story/${story.id}`}
                className="mt-3 inline-block text-sm text-[#c30F45] hover:underline"
              >
                Read More →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
