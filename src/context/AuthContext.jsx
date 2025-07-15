// // src/context/AuthContext.jsx
// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
// } from "react";
// import {
//   getAuth,
//   onAuthStateChanged,
//   signInWithPopup,
//   signInWithRedirect,
//   getRedirectResult,
//   GoogleAuthProvider,
//   signOut,
//   setPersistence,
//   browserLocalPersistence,
// } from "firebase/auth";

// import app from "../firebase/fireabase"; // ✅ Correct file name!
// const auth = getAuth(app); // ✅ create only once
// const provider = new GoogleAuthProvider();

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const init = async () => {
//       try {
//         await setPersistence(auth, browserLocalPersistence);

//         const result = await getRedirectResult(auth);
//         if (result?.user) setUser(result.user);

//         onAuthStateChanged(auth, (firebaseUser) => {
//           setUser(firebaseUser);
//           setLoading(false);
//         });
//       } catch (err) {
//         console.error("Auth init error:", err);
//         setLoading(false);
//       }
//     };

//     init();
//   }, []);

//   const login = () => {
//     const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
//     return isMobile
//       ? signInWithRedirect(auth, provider)
//       : signInWithPopup(auth, provider);
//   };

//   const logout = () => signOut(auth);

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);



// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/fireabase"; // ✅ make sure this path is correct

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password); // ✅ make sure this is defined

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, loading }} // ✅ include register here
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
