import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  collection,
  query,
  where,
  deleteDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const AuthorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [author, setAuthor] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    setLoading(true);

    const unsubAuthor = onSnapshot(doc(db, "users", id), (snap) => {
      if (snap.exists()) {
        setAuthor({ id: snap.id, ...snap.data() });
      }
    });

    const storiesQ = query(
      collection(db, "stories"),
      where("authorId", "==", id)
    );

    const unsubStories = onSnapshot(storiesQ, (snap) => {
      const data = snap.docs
        .filter((d) => d.data().isDraft !== true)
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) -
            (a.createdAt?.seconds || 0)
        );

      setStories(data);
    });

    const unsubFollowers = onSnapshot(
      collection(db, "users", id, "followers"),
      (snap) => {
        setFollowerCount(snap.size);

        if (user) {
          setIsFollowing(
            snap.docs.some((d) => d.id === user.uid)
          );
        }

        setLoading(false);
      }
    );

    return () => {
      unsubAuthor();
      unsubStories();
      unsubFollowers();
    };
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) return alert("Login required");
    if (user.uid === id) return;

    const followerRef = doc(
      db,
      "users",
      id,
      "followers",
      user.uid
    );

    const followingRef = doc(
      db,
      "users",
      user.uid,
      "following",
      id
    );

    if (isFollowing) {
      await deleteDoc(followerRef);
      await deleteDoc(followingRef);
      setFollowerCount((p) => Math.max(0, p - 1));
      setIsFollowing(false);
    } else {
      await setDoc(followerRef, {
        followedAt: new Date(),
      });

      await setDoc(followingRef, {
        followedAt: new Date(),
      });

      setFollowerCount((p) => p + 1);
      setIsFollowing(true);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );

  if (!author)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Author not found
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">

      {/* TOP BANNER (X style) */}
      <div className="h-40 bg-[#16181c] relative" />

      {/* PROFILE SECTION */}
      <div className="max-w-3xl mx-auto px-4">

        {/* AVATAR OVERLAP */}
        <div className="flex justify-between items-start -mt-12">

          <img
            src={
              author.photoURL ||
              `https://ui-avatars.com/api/?name=${author.displayName}`
            }
            className="w-24 h-24 rounded-full border-4 border-black object-cover"
          />

          {user && user.uid !== id && (
            <button
              onClick={toggleFollow}
              className={`mt-14 px-5 py-2 rounded-full font-bold text-sm transition ${
                isFollowing
                  ? "bg-white text-black"
                  : "bg-white text-black hover:opacity-80"
              }`}
            >
              {isFollowing
                ? "Following"
                : "Follow"}
            </button>
          )}
        </div>

        {/* NAME + INFO */}
        <div className="mt-3">
          <h1 className="text-2xl font-bold">
            {author.displayName}
          </h1>

          <p className="text-gray-500 text-sm">
            @{author.email?.split("@")[0]}
          </p>

          <p className="text-gray-400 text-sm mt-2">
            Joined{" "}
            {author.createdAt?.seconds
              ? formatDistanceToNow(
                  new Date(
                    author.createdAt.seconds *
                      1000
                  ),
                  { addSuffix: true }
                )
              : "recently"}
          </p>

          {/* STATS */}
          <div className="flex gap-6 mt-3 text-sm">
            <span>
              <b>{stories.length}</b>{" "}
              <span className="text-gray-500">
                Posts
              </span>
            </span>

            <span>
              <b>{followerCount}</b>{" "}
              <span className="text-gray-500">
                Followers
              </span>
            </span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-b border-[#2f3336] mt-6" />

        {/* STORIES */}
        <div className="mt-4">

          {stories.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No posts yet.
            </p>
          ) : (
            stories.map((story) => (
              <div
                key={story.id}
                className="border-b border-[#2f3336] py-5 hover:bg-[#0d0d0d] transition px-2"
              >
                <h3 className="font-bold text-white">
                  {story.title}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  {story.excerpt}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <span>{story.genre}</span>
                  <span>•</span>
                  <Link
                    to={`/story/${story.id}`}
                    className="text-[#1d9bf0] hover:underline"
                  >
                    Read
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorProfile;