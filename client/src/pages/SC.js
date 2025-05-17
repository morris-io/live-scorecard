import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "../scorecard-style-additions.css";

const API_URL = "https://golf-scorecard-app-u07h.onrender.com";
const FRONTEND_URL = "https://live-scorecard.com";

const socket = io(API_URL);

export default function Scorecard({ user, group, scorecard, setScorecard, setGroup }) {
  const [userNames, setUserNames] = useState({});

  // Join Socket.io room and listen for updates
  useEffect(() => {
    const join = () => socket.emit("joinGroup", group._id);
    join();
    socket.on("connect", join);
    socket.on("scorecardUpdated", (updated) => setScorecard(updated));
    socket.on("groupUpdated", (updatedGroup) => setGroup(updatedGroup));
    return () => {
      socket.off("connect", join);
      socket.off("scorecardUpdated");
      socket.off("groupUpdated");
    };
  }, [group._id, setScorecard, setGroup]);

  // Fetch player names only in standard mode
  useEffect(() => {
    if (!scorecard || !group) return;
    if (group.gameType === "standard") {
      const userIds = Object.keys(scorecard.scores);
      axios
        .post(`${API_URL}/api/users/names`, { userIds })
        .then((res) => setUserNames(res.data))
        .catch((err) => console.error("❌ Error fetching user names:", err));
    }
  }, [scorecard, group]);

  // Blur inputs on window focus (iOS fix)
  useEffect(() => {
    const handleFocus = () => {
      document.querySelectorAll("input[type='number']").forEach((i) => i.blur());
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Only render when this user or their team has a column
  const hasOwnColumn = () => {
    if (!scorecard || !user || !group) return false;
    if (group.gameType === "bestball") {
      return !!scorecard.scores[user.team];
    }
    return !!scorecard.scores[user._id];
  };
  if (!hasOwnColumn()) {
    return <p>Loading scorecard...</p>;
  }

  // Determine columns: team names in bestball, userIds in standard
  const columns =
    group.gameType === "bestball"
      ? [...new Set(group.users.map((u) => u.team).filter(Boolean))]
      : Object.keys(scorecard.scores);

  const updateScore = async (holeIndex, strokes) => {
    try {
      await axios.patch(`${API_URL}/api/scores/update`, {
        groupId: group._id,
        userId: user._id,
        holeIndex,
        strokes,
      });
    } catch (err) {
      console.error("❌ Error updating score:", err);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${FRONTEND_URL}?group=${group._id}`);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="container">
      <h2>{group.groupName}</h2>

      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <button
          onClick={copyInviteLink}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "8px 16px",
            fontSize: "14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          Copy Invite Link
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "center" }}>Hole</th>
            {columns.map((key) => {
              let label;
              if (group.gameType === "bestball") {
                const names = group.users
                  .filter((u) => u.team === key)
                  .map((u) => u.name)
                  .join(" & ");
                label = names;
              } else {
                label = key === user._id ? "You" : userNames[key] || "Player";
              }
              return <th key={key}>{label}</th>;
            })}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 18 }, (_, holeIndex) => (
            <tr key={holeIndex}>
              <td>{holeIndex + 1}</td>
              {columns.map((key) => {
                const value = scorecard.scores[key]?.[holeIndex] ?? 0;
                const isEditable =
                  group.gameType === "bestball"
                    ? key === user.team
                    : key === user._id;
                return (
                  <td key={key}>
                    {isEditable ? (
                      <input
                        type="number"
                        tabIndex={0}
                        value={value}
                        min={0}
                        className={value > 0 ? "filled score-animated" : ""}
                        style={{ fontSize: 16 }}
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") updateScore(holeIndex, 0);
                        }}
                        onChange={(e) => updateScore(holeIndex, Number(e.target.value))}
                      />
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td>Total</td>
            {columns.map((key) => (
              <td key={key}>{scorecard.scores[key].reduce((sum, s) => sum + s, 0)}</td>
            ))}
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          style={{
            backgroundColor: "#ccc",
            color: "#333",
            padding: "10px 16px",
            fontSize: 14,
            borderRadius: 10,
            border: "none",
            cursor: "pointer"
          }}
        >
          Leave Group
        </button>
      </div>
    </div>
  );
}