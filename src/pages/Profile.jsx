// import React from "react";
// import { useAuth } from "../context/AuthContext";

// const Profile = () => {
//   const { user, logout } = useAuth();

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white">
//         <p>Please log in to view your profile.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white px-6 py-20">
//       <div className="bg-[#2e1b31] p-6 rounded-lg shadow-lg text-center">
//         <img
//           src={user.photoURL}
//           alt="User"
//           className="w-24 h-24 rounded-full mx-auto mb-4"
//         />
//         <h2 className="text-2xl font-bold text-[#c30F45]">{user.displayName}</h2>
//         <p className="text-gray-300 mb-4">{user.email}</p>
//         <button
//           onClick={logout}
//           className="px-6 py-2 bg-[#c30F45] rounded hover:opacity-90 transition"
//         >
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Profile;


import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuth, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/fireabase";

const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageRef = ref(storage, `profile/${user.uid}-${file.name}`);
      await uploadBytes(imageRef, file);
      const photoURL = await getDownloadURL(imageRef);
      await updateProfile(getAuth().currentUser, { photoURL });
      window.location.reload();
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
      setEditing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#231123] text-white px-6 py-20">
      <div className="bg-[#2e1b31] p-6 rounded-lg shadow-lg text-center">
        <img
          src={user.photoURL}
          alt="User"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-[#c30F45]">{user.displayName}</h2>
        <p className="text-gray-300 mb-4">{user.email}</p>
        {editing ? (
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-4 block mx-auto"
            disabled={uploading}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2 bg-gray-600 rounded hover:opacity-90 transition mb-4"
          >
            Edit Profile Image
          </button>
        )}
        <button
          onClick={logout}
          className="px-6 py-2 bg-[#c30F45] rounded hover:opacity-90 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;

// after selecting the img cant i cant click on something like done then the pic upload and go back to the previous state of editimage