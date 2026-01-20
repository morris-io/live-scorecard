const mongoose = require("mongoose");

const ScorecardSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  scores: {
    type: Map,
    of: [Number]
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Scorecard", ScorecardSchema);