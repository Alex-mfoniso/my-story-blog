// import React from "react";
// import { motion } from "framer-motion";
// import Header from "../components/Header";

// const Home = () => {
//   return (
    
//     <main
//       className="min-h-screen flex flex-col justify-center items-center text-center px-4"
//       style={{ backgroundColor: "#231123", color: "white", paddingTop: "5rem" }}
//     >
//         <Header/>
//       <motion.h1
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//         className="text-4xl md:text-6xl font-bold mb-4"
//         style={{ color: "#c30F45" }}
//       >
//         Welcome to Alex's Story Blog
//       </motion.h1>

//       <motion.p
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.6, duration: 0.8 }}
//         className="text-lg max-w-xl text-gray-200"
//       >
//         Dive into immersive fiction, real-life tales, and deep emotional journeys.
//         All stories are written and shared from the heart.
//       </motion.p>

//       <motion.a
//         initial={{ scale: 0.9 }}
//         animate={{ scale: 1 }}
//         transition={{ delay: 1, duration: 0.5 }}
//         href="/stories"
//         className="mt-8 px-6 py-3 rounded-full text-white hover:scale-105 hover:brightness-110 transition"
//         style={{ backgroundColor: "#c30F45" }}
//       >
//         Explore Stories
//       </motion.a>

      
//     </main>
//   );
// };

// export default Home;


import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import { db } from "../firebase/fireabase"; // your firebase config file
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

const Home = () => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const q = query(
          collection(db, "stories"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(q);
        const storiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStories(storiesData);
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2e] to-[#1f1f38] text-white">
      <Header />

      {/* HERO */}
      <main className="text-center px-6 pt-28 pb-20">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-500 to-rose-500 mb-4"
        >
          Stories That Stay With You
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-xl mx-auto text-gray-300 text-lg"
        >
          Raw emotions. Real experiences. Explore stories that feel personal — because they are.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8"
        >
          <Link
            to="/stories"
            className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold transition shadow-lg"
          >
            Start Reading
          </Link>
        </motion.div>
      </main>

      {/* STORY CARDS */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold mb-6 text-white">Latest Stories</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {stories.length === 0 ? (
            <p className="text-gray-400">Loading stories...</p>
          ) : (
            stories.map((story) => (
             <motion.div
  key={story.id}
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5 }}
  className="bg-[#1f1f2e] hover:bg-[#2c2c3d] rounded-2xl overflow-hidden shadow-2xl transition duration-300 transform hover:-translate-y-1"
>
  <img
    src={story.image || "https://via.placeholder.com/600x400"}
    alt={story.title}
    className="w-full h-48 object-cover"
  />
  <div className="p-5">
    <h3 className="text-xl font-semibold text-white mb-2">
      {story.title}
    </h3>
    <p className="text-gray-400 text-sm mb-4">
      {story.excerpt?.slice(0, 100) || "No excerpt available."}
    </p>
    <span className="text-sm text-gray-500 italic">
      {story.createdAt?.seconds &&
        formatDistanceToNow(new Date(story.createdAt.seconds * 1000))}{" "}
      ago
    </span>
  </div>
</motion.div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#18182f] py-14 text-center px-6">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Don’t just scroll. Feel something real.
        </h3>
        <p className="text-gray-400 max-w-lg mx-auto mb-6">
          Join our intimate community of story lovers and get notified when fresh tales drop.
        </p>
        <Link
          to="/register"
          className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full font-semibold transition shadow-lg"
        >
          Join the Community
        </Link>
      </section>
    </div>
  );
};

export default Home;
