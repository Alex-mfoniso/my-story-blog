import React from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";

const Home = () => {
  return (
    
    <main
      className="min-h-screen flex flex-col justify-center items-center text-center px-4"
      style={{ backgroundColor: "#231123", color: "white", paddingTop: "5rem" }}
    >
        <Header/>
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-6xl font-bold mb-4"
        style={{ color: "#c30F45" }}
      >
        Welcome to Alex's Story Blog
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="text-lg max-w-xl text-gray-200"
      >
        Dive into immersive fiction, real-life tales, and deep emotional journeys.
        All stories are written and shared from the heart.
      </motion.p>

      <motion.a
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        href="/stories"
        className="mt-8 px-6 py-3 rounded-full text-white hover:scale-105 hover:brightness-110 transition"
        style={{ backgroundColor: "#c30F45" }}
      >
        Explore Stories
      </motion.a>
    </main>
  );
};

export default Home;
