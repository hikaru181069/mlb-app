import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="home-page px-6 py-16">
      <section className="home-hero w-full max-w-4xl px-8 py-12 md:px-14 md:py-16">
        <p className="home-kicker text-sm">MERN Portfolio Project</p>
        <h1 className="text-4xl leading-tight font-black tracking-tight md:text-6xl">
          MLB Player Search App
        </h1>
        <p className="home-description mt-6 text-base md:text-lg">
          Search MLB players, view player details, and manage player data.
        </p>

        <div className="home-actions mt-7">
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
