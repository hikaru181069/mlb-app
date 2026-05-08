import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AppNav from "../components/AppNav";
import PlayerSection from "../components/PlayerSection";
import { getHomePlayerSections } from "../services/playerDataService";

function HomePage() {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const playerSections = getHomePlayerSections();

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!searchText.trim()) {
      navigate("/search");
      return;
    }

    navigate(`/search?keyword=${encodeURIComponent(searchText)}`);
  };

  return (
    <div className="home-page px-6 py-16">
      <AppNav />

      <section className="home-hero w-full max-w-4xl px-8 py-12 md:px-14 md:py-16">
        <p className="home-kicker text-sm">MERN Portfolio Project</p>
        <h1 className="text-4xl leading-tight font-black tracking-tight md:text-6xl">
          MLB Favorite Player Hub
        </h1>
        <p className="home-description mt-6 text-base md:text-lg">
          Search MLB players, open player details, and build your own favorite
          player list.
        </p>

        <div className="home-tech-stack">
          <span>MERN</span>
          <span>JWT Auth</span>
          <span>MLB API Ready</span>
          <span>Tailwind CSS</span>
        </div>

        <form className="home-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search players later..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <button className="home-link" type="submit">
            Go to Search
          </button>
        </form>

        <div className="home-actions mt-7">
          <Link className="home-link" to="/favorites">
            View Favorites
          </Link>

          <Link className="home-link secondary" to="/search">
            Search MLB Players
          </Link>

          <Link className="home-link secondary" to="/login">
            Login
          </Link>

          <Link className="home-link secondary" to="/onboarding/team">
            Start Onboarding
          </Link>
        </div>
      </section>

      <div className="home-content">
        {playerSections.map((section) => (
          <PlayerSection
            key={section.title}
            title={section.title}
            description={section.description}
            players={section.players}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
