const mongoose = require("mongoose");

const favoritePlayerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mlbPlayerId: {
      type: Number,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    teamName: {
      type: String,
      default: "Unknown",
    },
    position: {
      type: String,
      default: "Unknown",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    playerType: {
      type: String,
      enum: ["hitter", "pitcher"],
      default: "hitter",
    },
    hitterStats: {
      battingAverage: {
        type: String,
        default: "",
      },
      homeRuns: {
        type: Number,
        default: 0,
      },
      rbis: {
        type: Number,
        default: 0,
      },
    },
    currentSeasonStats: {
      hitterStats: {
        battingAverage: {
          type: String,
          default: "",
        },
        homeRuns: {
          type: Number,
          default: 0,
        },
        rbis: {
          type: Number,
          default: 0,
        },
      },
      pitcherStats: {
        era: {
          type: String,
          default: "",
        },
        strikeouts: {
          type: Number,
          default: 0,
        },
        inningsPitched: {
          type: String,
          default: "",
        },
      },
    },
    careerStats: {
      hitterStats: {
        battingAverage: {
          type: String,
          default: "",
        },
        homeRuns: {
          type: Number,
          default: 0,
        },
        rbis: {
          type: Number,
          default: 0,
        },
      },
      pitcherStats: {
        era: {
          type: String,
          default: "",
        },
        strikeouts: {
          type: Number,
          default: 0,
        },
        inningsPitched: {
          type: String,
          default: "",
        },
      },
    },
    recentGames: {
      type: [
        {
          date: String,
          opponent: String,
          summary: String,
          result: String,
        },
      ],
      default: [],
    },
    baseballSavantUrl: {
      type: String,
      default: "",
    },
    pitcherStats: {
      era: {
        type: String,
        default: "",
      },
      strikeouts: {
        type: Number,
        default: 0,
      },
      inningsPitched: {
        type: String,
        default: "",
      },
    },
    note: {
      type: String,
      default: "",
    },
    favoriteReason: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: "MLB Stats API",
    },
  },
  {
    timestamps: true,
  },
);

favoritePlayerSchema.index({ user: 1, mlbPlayerId: 1 }, { unique: true });

module.exports = mongoose.model("FavoritePlayer", favoritePlayerSchema);
