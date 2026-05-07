import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/fireabase";
import { Link } from "react-router-dom";
import StoryCard from "../components/StoryCard";

const Profile = () => {
  const { user, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(
    user?.displayName || ""
  );

  const [updateMsg, setUpdateMsg] = useState("");
  const [loadingUpdate, setLoadingUpdate] =
    useState(false);

  const [stories, setStories] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followingIds, setFollowingIds] = useState(
    new Set()
  );

  const [loadingData, setLoadingData] =
    useState(true);

  const [bookmarkIds, setBookmarkIds] = useState(
    new Set()
  );

  const [activeTab, setActiveTab] =
    useState("stories");

  useEffect(() => {
    if (!user) return;

    setLoadingData(true);

    // STORIES
    const storiesQ = query(
      collection(db, "stories"),
      where("authorId", "==", user.uid)
    );

    const unsubStories = onSnapshot(
      storiesQ,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort(
            (a, b) =>
              (b.createdAt?.seconds || 0) -
              (a.createdAt?.seconds || 0)
          );

        setStories(docs);
      }
    );

    // FOLLOWING
    const unsubFollowing = onSnapshot(
      collection(db, "users", user.uid, "following"),
      (snap) => {
        setFollowingIds(
          new Set(snap.docs.map((d) => d.id))
        );
      }
    );

    // FOLLOWERS
    const unsubFollowers = onSnapshot(
      collection(db, "users", user.uid, "followers"),
      async (snap) => {
        const profiles = await Promise.all(
          snap.docs.map(async (fDoc) => {
            const profileSnap = await getDoc(
              doc(db, "users", fDoc.id)
            );

            return profileSnap.exists()
              ? {
                  id: profileSnap.id,
                  ...profileSnap.data(),
                }
              : null;
          })
        );

        setFollowers(profiles.filter(Boolean));
        setLoadingData(false);
      }
    );

    // BOOKMARKS
    const unsubBookmarks = onSnapshot(
      collection(db, "users", user.uid, "bookmarks"),
      (snap) => {
        setBookmarkIds(
          new Set(snap.docs.map((d) => d.id))
        );
      }
    );

    return () => {
      unsubStories();
      unsubFollowing();
      unsubFollowers();
      unsubBookmarks();
    };
  }, [user]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;

    setLoadingUpdate(true);

    try {
      await updateProfile(user, {
        displayName: newUsername,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: newUsername,
        },
        { merge: true }
      );

      setUpdateMsg("✅ Profile updated!");
      setEditing(false);
    } catch (err) {
      console.error(err);

      setUpdateMsg("❌ Update failed.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const toggleBookmark = async (storyId) => {
    const ref = doc(
      db,
      "users",
      user.uid,
      "bookmarks",
      storyId
    );

    if (bookmarkIds.has(storyId)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        savedAt: new Date(),
      });
    }
  };

  const toggleFollow = async (targetUserId) => {
    const followerRef = doc(
      db,
      "users",
      targetUserId,
      "followers",
      user.uid
    );

    const followingRef = doc(
      db,
      "users",
      user.uid,
      "following",
      targetUserId
    );

    if (followingIds.has(targetUserId)) {
      await deleteDoc(followerRef);
      await deleteDoc(followingRef);
    } else {
      await setDoc(followerRef, {
        followedAt: new Date(),
      });

      await setDoc(followingRef, {
        followedAt: new Date(),
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Please log in.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">

        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-5">

          {/* <Link
            to="/"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#181818] transition"
          >
            ←
          </Link> */}

          <div>
            <h2 className="text-xl md:text-2xl font-black">
              {user.displayName || "Profile"}
            </h2>

            <p className="text-sm text-gray-500">
              {stories.length} stories
            </p>
          </div>
        </div>
      </header>

      {/* COVER */}
      <div className="relative">

        <div className="h-44 bg-[#16181c]" />

        {/* PROFILE CARD */}
        <div className="max-w-5xl mx-auto px-4">

          <div className="relative -mt-20">

            {/* AVATAR */}
            <div className="w-36 h-36 rounded-full border-4 border-black overflow-hidden bg-black shadow-2xl">
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?name=${user.displayName}`
                }
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* EDIT BUTTON */}
            <div className="absolute top-4 right-0">
              <button
                onClick={() =>
                  setEditing(!editing)
                }
                className="border border-[#2f3336] bg-black/60 backdrop-blur-md px-5 py-2 rounded-full font-semibold hover:bg-[#181818] transition"
              >
                {editing
                  ? "Cancel"
                  : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* PROFILE INFO */}
          <div className="mt-6">

            {editing ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">

                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) =>
                    setNewUsername(
                      e.target.value
                    )
                  }
                  className="bg-[#111] border border-[#c30F45] rounded-2xl px-4 py-3 text-white focus:outline-none w-full sm:w-[300px]"
                />

                <button
                  onClick={
                    handleUpdateUsername
                  }
                  disabled={loadingUpdate}
                  className="bg-[#c30F45] hover:bg-pink-700 transition px-6 py-3 rounded-2xl font-semibold"
                >
                  {loadingUpdate
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            ) : (
              <div>
                <h1 className="text-4xl font-black mb-2">
                  {user.displayName ||
                    "Anonymous"}
                </h1>

                <p className="text-gray-500 mb-4">
                  @
                  {user.email?.split(
                    "@"
                  )[0]}
                </p>
              </div>
            )}

            {/* UPDATE MESSAGE */}
            {updateMsg && (
              <p className="text-sm mb-4 text-gray-300">
                {updateMsg}
              </p>
            )}

            {/* STATS */}
            <div className="flex gap-8 mb-8">

              <div>
                <p className="text-2xl font-black">
                  {followingIds.size}
                </p>

                <p className="text-gray-500 text-sm">
                  Following
                </p>
              </div>

              <div>
                <p className="text-2xl font-black">
                  {followers.length}
                </p>

                <p className="text-gray-500 text-sm">
                  Followers
                </p>
              </div>

              <div>
                <p className="text-2xl font-black">
                  {stories.length}
                </p>

                <p className="text-gray-500 text-sm">
                  Stories
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-[#2f3336] mt-8">

        <div className="max-w-5xl mx-auto flex">

          <button
            onClick={() =>
              setActiveTab("stories")
            }
            className={`flex-1 py-5 text-sm font-bold transition relative hover:bg-[#111] ${
              activeTab === "stories"
                ? "text-white"
                : "text-gray-500"
            }`}
          >
            Stories

            {activeTab ===
              "stories" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#c30F45] rounded-full" />
            )}
          </button>

          <button
            onClick={() =>
              setActiveTab("followers")
            }
            className={`flex-1 py-5 text-sm font-bold transition relative hover:bg-[#111] ${
              activeTab === "followers"
                ? "text-white"
                : "text-gray-500"
            }`}
          >
            Followers

            {activeTab ===
              "followers" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#c30F45] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto pb-24">

        {loadingData ? (
          <div className="text-center py-20 text-gray-500 animate-pulse">
            Loading...
          </div>
        ) : activeTab === "stories" ? (
          stories.length > 0 ? (
            <div className="space-y-4 mt-6">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onBookmark={
                    toggleBookmark
                  }
                  isBookmarked={bookmarkIds.has(
                    story.id
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">

              <h3 className="text-2xl font-bold mb-3">
                No stories yet
              </h3>

              <p className="text-gray-500">
                Start publishing your
                first story.
              </p>
            </div>
          )
        ) : followers.length > 0 ? (
          <div className="mt-6 border border-[#2f3336] rounded-3xl overflow-hidden">

            {followers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-5 border-b border-[#2f3336] hover:bg-[#080808] transition"
              >

                <Link
                  to={`/author/${follower.id}`}
                  className="flex items-center gap-4"
                >

                  <img
                    src={
                      follower.photoURL ||
                      `https://ui-avatars.com/api/?name=${follower.displayName}`
                    }
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div>
                    <p className="font-bold hover:underline">
                      {
                        follower.displayName
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      @
                      {follower.email?.split(
                        "@"
                      )[0]}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() =>
                    toggleFollow(
                      follower.id
                    )
                  }
                  className={`px-5 py-2 rounded-full text-sm font-bold transition ${
                    followingIds.has(
                      follower.id
                    )
                      ? "border border-[#2f3336] text-white hover:border-red-500 hover:text-red-500"
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                >
                  {followingIds.has(
                    follower.id
                  )
                    ? "Following"
                    : "Follow"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">

            <h3 className="text-2xl font-bold mb-3">
              No followers yet
            </h3>

            <p className="text-gray-500">
              Build your audience by
              publishing stories.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="border-t border-[#2f3336] bg-black/80 backdrop-blur-xl sticky bottom-0">

        <div className="max-w-5xl mx-auto p-4">

          <button
            onClick={logout}
            className="w-full py-4 bg-red-600/10 text-red-500 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;