const { fetchPlayersByArchetype } = require("../services/mlb/archetypeService");

const getPlayersByArchetype = async (req, res) => {
  const { type } = req.params;
  try {
    const players = await fetchPlayersByArchetype(type);
    res.json(players);
  } catch (error) {
    console.error("Archetype players error:", error.message);
    res.status(500).json({ message: "Failed to fetch players by archetype." });
  }
};

module.exports = { getPlayersByArchetype };
