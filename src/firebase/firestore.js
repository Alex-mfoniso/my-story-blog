import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment, writeBatch, setDoc, collection } from "firebase/firestore";
import { db } from "./fireabase";

export const addLikeToStory = async (storyId, userId) => {
  const storyRef = doc(db, "stories", storyId);
  try {
    await updateDoc(storyRef, {
      likedBy: arrayUnion(userId),
      likeCount: increment(1)
    });
  } catch (error) {
    console.error("Error adding like to story: ", error);
    throw error;
  }
};

export const removeLikeFromStory = async (storyId, userId) => {
  const storyRef = doc(db, "stories", storyId);
  try {
    await updateDoc(storyRef, {
      likedBy: arrayRemove(userId),
      likeCount: increment(-1)
    });
  } catch (error) {
    console.error("Error removing like from story: ", error);
    throw error;
  }
};

export const getStoryData = async (storyId) => {
  const storyRef = doc(db, "stories", storyId);
  try {
    const docSnap = await getDoc(storyRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No such story!");
      return null;
    }
  } catch (error) {
    console.error("Error getting story data: ", error);
    throw error;
  }
};

export const createStory = async (storyData) => {
  const storiesCollection = collection(db, "stories");
  const newStoryRef = doc(storiesCollection);
  try {
    await setDoc(newStoryRef, {
      ...storyData,
      createdAt: new Date(),
      likeCount: 0,
      likedBy: [],
      commentCount: 0,
    });
    return newStoryRef.id;
  } catch (error) {
    console.error("Error creating story: ", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
};