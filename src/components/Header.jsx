import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const { user } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <header className="w-full px-6 py-4 flex justify-between items-center bg-[#231123] text-white fixed top-0 z-50">
      <h1 className="text-xl font-bold" style={{ color: "#c30F45" }}>
        Alex's Stories
      </h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white text-2xl"
        >
          ☰
        </button>
      </div>

      <nav
        className={`${
          open ? "block" : "hidden"
        } absolute top-16 left-0 w-full bg-[#231123] md:static md:flex md:space-x-6 md:w-auto`}
      >
        <a href="/" className="block px-4 py-2 hover:text-[#c30F45]">
          Home
        </a>
        <a href="/stories" className="block px-4 py-2 hover:text-[#c30F45]">
          Stories
        </a>

        {user ? (
        <>
            <a href="/bookmarks" className="block px-4 py-2 hover:text-[#c30F45]">
              My Bookmarks
            </a>
            <a href="/profile" className="block px-4 py-2 hover:text-[#c30F45]">
              Profile
            </a>
          </>
        ) : (
          <>
            <a href="/login" className="block px-4 py-2 hover:text-[#c30F45]">
              Login
            </a>
            <a href="/register" className="block px-4 py-2 hover:text-[#c30F45]">
              Register
            </a>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
