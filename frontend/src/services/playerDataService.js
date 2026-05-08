const players = [
  {
    playerId: "660271",
    fullName: "Shohei Ohtani",
    teamName: "Los Angeles Dodgers",
    position: "DH / SP",
    playerType: "hitter",
    imageUrl:
      "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/660271/headshot/67/current",
    shortBio: "Two-way superstar with elite power and pitching history.",
    seasonStats: {
      battingAverage: ".310",
      homeRuns: 54,
      rbis: 130,
    },
    recentGameStats: "2-for-4, HR, 2 RBI",
    tags: ["featured", "dodgers", "recommended"],
    similarPlayerIds: ["605141", "592450", "545361"],
  },
  {
    playerId: "605141",
    fullName: "Mookie Betts",
    teamName: "Los Angeles Dodgers",
    position: "SS / RF",
    playerType: "hitter",
    imageUrl:
      "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/605141/headshot/67/current",
    shortBio: "Dynamic defender and complete hitter.",
    seasonStats: {
      battingAverage: ".289",
      homeRuns: 39,
      rbis: 107,
    },
    recentGameStats: "1-for-3, BB, R",
    tags: ["dodgers", "recommended"],
    similarPlayerIds: ["660271", "592450", "545361"],
  },
  {
    playerId: "808967",
    fullName: "Yoshinobu Yamamoto",
    teamName: "Los Angeles Dodgers",
    position: "SP",
    playerType: "pitcher",
    imageUrl:
      "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/808967/headshot/67/current",
    shortBio: "Command-focused starter with a deep pitch mix.",
    seasonStats: {
      era: "3.00",
      strikeouts: 105,
      inningsPitched: "90.0",
    },
    recentGameStats: "6.0 IP, 2 ER, 7 SO",
    tags: ["featured", "dodgers"],
    similarPlayerIds: ["660271", "592450", "545361"],
  },
  {
    playerId: "592450",
    fullName: "Aaron Judge",
    teamName: "New York Yankees",
    position: "OF",
    playerType: "hitter",
    imageUrl:
      "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/592450/headshot/67/current",
    shortBio: "Power-hitting outfielder and lineup anchor.",
    seasonStats: {
      battingAverage: ".322",
      homeRuns: 58,
      rbis: 144,
    },
    recentGameStats: "1-for-4, HR",
    tags: ["recommended"],
    similarPlayerIds: ["660271", "605141", "545361"],
  },
  {
    playerId: "545361",
    fullName: "Mike Trout",
    teamName: "Los Angeles Angels",
    position: "OF",
    playerType: "hitter",
    imageUrl:
      "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/545361/headshot/67/current",
    shortBio: "All-around outfielder with elite career production.",
    seasonStats: {
      battingAverage: ".263",
      homeRuns: 18,
      rbis: 44,
    },
    recentGameStats: "0-for-3, BB",
    tags: ["recommended"],
    similarPlayerIds: ["660271", "605141", "592450"],
  },
];

const getPlayersByTag = (tag) => {
  return players.filter((player) => player.tags.includes(tag));
};

export const getHomePlayerSections = () => {
  return [
    {
      title: "Featured Players",
      description: "Players to explore first.",
      players: getPlayersByTag("featured"),
    },
    {
      title: "Players From Your Favorite Team",
      description: "This will later use onboarding team data.",
      players: getPlayersByTag("dodgers"),
    },
    {
      title: "Recommended Players",
      description: "This will later connect to a recommendation service.",
      players: getPlayersByTag("recommended"),
    },
  ];
};

export const getPlayerById = (playerId) => {
  return players.find((player) => player.playerId === playerId);
};

export const getSimilarPlayers = (playerId) => {
  const player = getPlayerById(playerId);

  if (!player) {
    return [];
  }

  return player.similarPlayerIds
    .map((similarPlayerId) => getPlayerById(similarPlayerId))
    .filter(Boolean)
    .slice(0, 3);
};
