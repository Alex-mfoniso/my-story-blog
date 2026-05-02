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
  sendEmailVerification,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase/fireabase"; 
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user to Firestore if document doesn't exist
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "User",
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}`,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              isDisabled: false,
            });
          } else {
            const userData = userSnap.data();
            if (userData.isDisabled) {
              await signOut(auth);
              alert("Your account has been disabled by an administrator.");
              setUser(null);
              setLoading(false);
              return;
            }
            // Update last login
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          }
        } catch (error) {
          console.error("Error syncing user to Firestore:", error);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const register = async (email, password, username) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, {
      displayName: username,
    });

    // Create Firestore document immediately
    const userRef = doc(db, "users", res.user.uid);
    await setDoc(userRef, {
      uid: res.user.uid,
      email: res.user.email,
      displayName: username,
      photoURL: `https://ui-avatars.com/api/?name=${username}`,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    await sendEmailVerification(res.user);
  };
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
