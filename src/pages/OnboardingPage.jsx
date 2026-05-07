import React from "react";
import { Link } from "react-router-dom";
import { PenSquare, BookOpen, Users } from "lucide-react";

const OnboardingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-6 py-12">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#c30F45]/20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 max-w-5xl w-full text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-[#c30F45] animate-pulse"></span>
          <p className="text-sm text-gray-300">
            A new home for storytellers
          </p>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Every Story
          <br />
          <span className="text-[#c30F45]">
            Deserves To Be Heard.
          </span>
        </h1>

        {/* Subtext */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed mb-10">
          Publish stories, follow writers, build an audience,
          and discover powerful voices from around the world.
          Whether you're writing fiction, experiences, confessions,
          or ideas, this is your space.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
          <Link
            to="/register"
            className="bg-[#c30F45] hover:bg-[#a50a3b] px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(195,15,69,0.4)]"
          >
            Start Writing Free
          </Link>

          <Link
            to="/login"
            className="border border-white/20 hover:border-[#c30F45] bg-white/5 backdrop-blur-md px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105"
          >
            Continue Reading
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 text-left hover:border-[#c30F45]/50 transition-all duration-300">
            <PenSquare className="text-[#c30F45] mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">
              Create Freely
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Write stories without limits and express yourself
              however you want.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 text-left hover:border-[#c30F45]/50 transition-all duration-300">
            <Users className="text-[#c30F45] mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">
              Build Community
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Follow writers, interact through comments,
              and grow your audience naturally.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 text-left hover:border-[#c30F45]/50 transition-all duration-300">
            <BookOpen className="text-[#c30F45] mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">
              Discover Stories
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Explore emotional, inspiring, funny, and unforgettable
              stories from real people.
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-16 text-gray-500 text-sm">
          © {new Date().getFullYear()} Alex's Stories. Built for storytellers.
        </footer>
      </div>
    </div>
  );
};

export default OnboardingPage;