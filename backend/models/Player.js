const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  team: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  stats: {
    battingAverage: {
      type: String,
      required: true,
    },
    homeRuns: {
      type: Number,
      required: true,
    },
    rbis: {
      type: Number,
      required: true,
    },
  },
});

module.exports = mongoose.model("Player", playerSchema);
