const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const playerRoutes = require("./routes/playerRoutes");
const authRoutes = require("./routes/authRoutes");
const externalPlayerRoutes = require("./routes/externalPlayerRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const userRoutes = require("./routes/userRoutes");
const similarPlayerRoutes = require("./routes/similarPlayerRoutes");
const statsRoutes = require("./routes/statsRoutes");
const matchupRoutes = require("./routes/matchupRoutes");
const leagueRoutes = require("./routes/leagueRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/players", playerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/external/players", externalPlayerRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/similar-players", similarPlayerRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/matchup", matchupRoutes);
app.use("/api/league", leagueRoutes);

app.get("/", (req, res) => {
  res.send("Backend server is running");
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
