// import React, { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext";

// const Header = () => {
//   const [open, setOpen] = useState(false);
//   const [darkMode, setDarkMode] = useState(() => {
//     return localStorage.getItem("theme") === "dark";
//   });

//   const { user } = useAuth();

//   useEffect(() => {
//     const root = document.documentElement;
//     if (darkMode) {
//       root.classList.add("dark");
//       localStorage.setItem("theme", "dark");
//     } else {
//       root.classList.remove("dark");
//       localStorage.setItem("theme", "light");
//     }
//   }, [darkMode]);

//   return (
//     <header className="w-full px-6 py-4 flex justify-between items-center bg-[#231123] text-white fixed top-0 z-50">
//       <h1 className="text-xl font-bold" style={{ color: "#c30F45" }}>
//         Alex's Stories
//       </h1>

//       <div className="flex items-center gap-4">
//         <button
//           onClick={() => setOpen(!open)}
//           className="md:hidden text-white text-2xl"
//         >
//           ☰
//         </button>
//       </div>

//       <nav
//         className={`${
//           open ? "block" : "hidden"
//         } absolute top-16 left-0 w-full bg-[#231123] md:static md:flex md:space-x-6 md:w-auto`}
//       >
//         <a href="/" className="block px-4 py-2 hover:text-[#c30F45]">
//           Home
//         </a>
//         <a href="/stories" className="block px-4 py-2 hover:text-[#c30F45]">
//           Stories
//         </a>

//         {user ? (
//         <>
//             <a href="/bookmarks" className="block px-4 py-2 hover:text-[#c30F45]">
//               My Bookmarks
//             </a>
//             <a href="/profile" className="block px-4 py-2 hover:text-[#c30F45]">
//               Profile
//             </a>
//           </>
//         ) : (
//           <>
//             <a href="/login" className="block px-4 py-2 hover:text-[#c30F45]">
//               Login
//             </a>
//             <a href="/register" className="block px-4 py-2 hover:text-[#c30F45]">
//               Register
//             </a>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// };

// export default Header;

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

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
    <header className="w-full px-6 py-4 flex justify-between items-center bg-[#0c0c0c] text-white fixed top-0 z-50 shadow-md">
      <Link to="/">
        <h1 className="text-xl font-extrabold tracking-wide text-[#c30F45]">
          Alex's Stories
        </h1>
      </Link>

      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-white focus:outline-none"
      >
        <motion.div
          initial={false}
          animate={open ? "open" : "closed"}
          className="w-6 h-6 flex flex-col justify-between"
        >
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: 7 },
            }}
            className="block h-0.5 w-full bg-white"
          />
          <motion.span
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            className="block h-0.5 w-full bg-white"
          />
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: -7 },
            }}
            className="block h-0.5 w-full bg-white"
          />
        </motion.div>
      </button>

      {/* Desktop Nav */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium">
        <Link to="/" className="hover:text-[#c30F45]">Home</Link>
        <Link to="/stories" className="hover:text-[#c30F45]">Stories</Link>
        {user ? (
          <>
            <Link to="/bookmarks" className="hover:text-[#c30F45]">My Bookmarks</Link>
            <Link to="/profile" className="hover:text-[#c30F45]">Profile</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-[#c30F45]">Login</Link>
            <Link to="/register" className="hover:text-[#c30F45]">Register</Link>
          </>
        )}
      </nav>

      {/* Mobile Nav */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 w-full bg-[#0c0c0c] shadow-lg md:hidden flex flex-col items-start px-6 py-4 space-y-4 text-sm z-40"
            style={{ top: "100%" }} // fix the mobile menu to stick to bottom of header without space
          >
            <Link to="/" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Home</Link>
            <Link to="/stories" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Stories</Link>
            {user ? (
              <>
                <Link to="/bookmarks" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">My Bookmarks</Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Register</Link>
              </>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
