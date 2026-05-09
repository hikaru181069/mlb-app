const User = require("../models/User");

const createUserResponse = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    favoriteTeam: user.favoriteTeam,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
  };
};

const getMe = async (req, res) => {
  res.json(createUserResponse(req.user));
};

const updateFavoriteTeam = async (req, res) => {
  try {
    const { favoriteTeam } = req.body;

    if (!favoriteTeam || !favoriteTeam.id || !favoriteTeam.name) {
      return res.status(400).json({ message: "Favorite team is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        favoriteTeam: {
          id: Number(favoriteTeam.id),
          name: favoriteTeam.name,
          abbreviation: favoriteTeam.abbreviation || "",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    res.json(createUserResponse(user));
  } catch (error) {
    console.error("Update favorite team error:", error.message);
    res.status(400).json({ message: "Failed to update favorite team" });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        hasCompletedOnboarding: true,
      },
      {
        new: true,
      },
    ).select("-password");

    res.json(createUserResponse(user));
  } catch (error) {
    console.error("Complete onboarding error:", error.message);
    res.status(400).json({ message: "Failed to complete onboarding" });
  }
};

module.exports = {
  completeOnboarding,
  getMe,
  updateFavoriteTeam,
};
