import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase/fireabase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

const Home = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "stories"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);

        const storiesWithCounts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const storyData = { id: docSnap.id, ...docSnap.data() };

            const likesSnap = await getDocs(
              collection(db, "stories", docSnap.id, "likes")
            );
            const commentsSnap = await getDocs(
              collection(db, "stories", docSnap.id, "comments")
            );

            return {
              ...storyData,
              likes: likesSnap.size,
              commentsCount: commentsSnap.size,
            };
          })
        );

        setStories(storiesWithCounts);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
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
          Raw emotions. Real experiences. Explore stories that feel personal,
          because they actually are.
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

        {loading ? (
          <div className="flex justify-center items-center h-40">
            {/* customise the spiner with either of this border-indigo-500 border-rose-500 border-pink-500  */}
            <div className="w-12 h-12 border-4 border-rose-500  border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
                onClick={() => navigate(`/story/${story.id}`)}
                className="cursor-pointer bg-[#1f1f2e] hover:bg-[#2c2c3d] rounded-2xl overflow-hidden shadow-2xl transition duration-300 transform hover:-translate-y-1"
              >
                <img
                  src={
                    story.image ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt={story.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {story.excerpt
                      ? story.excerpt.slice(0, 100)
                      : story.content?.replace(/<[^>]+>/g, "").slice(0, 100) ||
                        "No excerpt available."}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>
                      {story.createdAt?.seconds &&
                        formatDistanceToNow(
                          new Date(story.createdAt.seconds * 1000)
                        )}{" "}
                      ago
                    </span>
                    <div className="flex gap-4 items-center">
                      <span className="flex items-center gap-1">
                        ❤️ {story.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {story.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-[#18182f] py-14 text-center px-6">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Don’t just scroll. Feel something real.
        </h3>
        <p className="text-gray-400 max-w-lg mx-auto mb-6">
          Join our intimate community of story lovers and get notified when
          fresh tales drop.
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
