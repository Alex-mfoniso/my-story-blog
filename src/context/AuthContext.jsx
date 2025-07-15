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
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔑 Handle redirect login result on page load
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.error("Redirect login error:", err);
      });
  }, []);

  const login = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      return signInWithRedirect(auth, provider);
    } else {
      return signInWithPopup(auth, provider);
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
