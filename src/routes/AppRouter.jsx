// src/routes/AppRouter.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Header from "../components/Header";
import Upload from "../pages/Upload";
import Stories from "../pages/Stories";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import StoryDetail from "../pages/StoryDetail";
import MyBookmarks from "../pages/MyBookmarks";
import RegisterForm from "../components/RegisterForm";
import LoginForm from "../components/LoginForm";
// import other pages as you create them (e.g. Stories, Upload, Login)

const AppRouter = () => {
  return (
    <Router>
        <Header />
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/upload" element={<Upload />} />
         <Route path="/story/:id" element={<StoryDetail />} />
         <Route path="/bookmarks" element={<MyBookmarks />} />
<Route path="/register" element={<RegisterForm />} />
         <Route path="/stories" element={<Stories />} />
         <Route path="/login" element={<LoginForm />} />
         {/* <Route path="/login" element={<Login />} /> */}
         <Route path="/profile" element={<Profile />} />
        {/* Add more routes here as you build */}
      </Routes>
    </Router>
  );
};

export default AppRouter;
