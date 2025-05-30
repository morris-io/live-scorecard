import { useState } from "react";
import axios from "axios";

const API_URL = "https://golf-scorecard-app-u07h.onrender.com";

export default function CreateUser({ setUser, groupFromURL, setGroup }) {
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name) return alert("Enter your name");

    try {
      const res = await axios.post(`${API_URL}/api/users`, {
        name,
        isTemporary: true
      });

      const createdUser = res.data;
      setUser(createdUser);

      if (groupFromURL) {
        const joinRes = await axios.post(`${API_URL}/api/groups/join`, {
          groupId: groupFromURL,
          userId: createdUser._id
        });
        setGroup(joinRes.data.group);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "14vh",
        zIndex: 0
      }}
    >
      {/* Bottom right name */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          right: 16,
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          padding: "4px 8px",
          borderRadius: "8px",
          zIndex: 1
        }}
      >
        Developed by Michael Morris
      </div>

      {/* Card */}
      <div
        style={{
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          padding: 20,
          borderRadius: 12,
          width: 260
        }}
      >
        <h2 style={{ margin: 0, color: "#2f6e43" }}>Enter Your Name</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: 24  // increased spacing here
          }}
        >
          <input
            type="text"
            placeholder="e.x., Mike"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #ccc"
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: "10px",
              fontSize: 16,
              background: "#2f6e43",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
