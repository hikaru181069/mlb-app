import { useState } from "react";
import "./App.css";

const players = [
  {
    id: 1,
    name: "Shohei Ohtani",
    team: "Dodgers",
    position: "DH",
  },
  {
    id: 2,
    name: "Aaron Judge",
    team: "Yankees",
    position: "OF",
  },
  {
    id: 3,
    name: "Mookie Betts",
    team: "Dodgers",
    position: "SS",
  },
];

function App() {
  const [searchText, setSearchText] = useState("");

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="app">
      <h1>MLB Player Search App</h1>
      <p className="description">Search players with mock data</p>

      <input
        type="text"
        placeholder="Search player name"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      <div className="player-list">
        {filteredPlayers.map((player) => (
          <div className="player-card" key={player.id}>
            <h2>{player.name}</h2>
            <p>Team: {player.team}</p>
            <p>Position: {player.position}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
