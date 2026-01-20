module.exports = (io) => {
  const express   = require("express");
  const router    = express.Router();
  const Group     = require("../models/Group");
  const User      = require("../models/User");
  const Scorecard = require("../models/Scorecard");

  router.post("/", async (req, res) => {
    const { groupName, userId, gameType = "standard" } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newGroup = new Group({ groupName, users: [userId], gameType });
      const saved    = await newGroup.save();
      res.json(saved);
    } catch (err) {
      console.error("❌ Error creating group:", err);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  router.post("/join", async (req, res) => {
    const { groupId, userId } = req.body;
    try {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      let didJoin = false;
      if (!group.users.includes(userId)) {
        group.users.push(userId);
        await group.save();
        didJoin = true;
      }

      const populated = await Group.findById(groupId).populate("users");
      io.to(groupId).emit("groupUpdated", populated);

      if (populated.gameType === "standard" && didJoin) {
        const sc = await Scorecard.findOne({ groupId });
        if (sc && !sc.scores.has(userId.toString())) {
          sc.scores.set(userId.toString(), new Array(18).fill(0));
          await sc.save();
          io.to(groupId).emit("scorecardUpdated", sc);
        }
      }

      res.json({ group: populated });
    } catch (err) {
      console.error("❌ Error joining group:", err);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  /* join team best ball */
  router.post("/join-team", async (req, res) => {
    const { groupId, userId, team } = req.body;
    try {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (group.gameType !== "bestball")
        return res.status(400).json({ message: "Not a best‑ball game" });

      // Update the user's team
      const user = await User.findByIdAndUpdate(
        userId,
        { team },
        { new: true }
      );
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!group.users.map(String).includes(userId)) {
        group.users.push(userId);
        await group.save();
      }

      const populated = await Group.findById(groupId).populate("users");

      const sc = await Scorecard.findOne({ groupId });
      if (sc) {
        const teams = [...new Set(populated.users.map((u) => u.team).filter(Boolean))];
        teams.forEach((t) => {
          if (!sc.scores.has(t)) {
            sc.scores.set(t, new Array(18).fill(0));
          }
        });
        await sc.save();
      }

      io.to(groupId).emit("groupUpdated", populated);
      if (sc) io.to(groupId).emit("scorecardUpdated", sc);

      return res.json({ group: populated });
    } catch (err) {
      console.error("❌ Error joining team:", err);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  return router;
};
