import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="home-kicker">MERN Portfolio Project</p>
        <h1>MLB Player Search App</h1>
        <p className="home-description">
          Search MLB players, view player details, and manage player data.
        </p>

        <div className="home-actions">
          <Link className="home-link" to="/players">
            View Players
          </Link>

          <Link className="home-link secondary" to="/login">
            Login
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
