import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";

function OnboardingFavoritesPage() {
  return (
    <div className="app">
      <AppNav />

      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Choose Favorite Players</h1>
      <p className="status-message">
        This page will later let users select at least three favorite players.
      </p>
    </div>
  );
}

export default OnboardingFavoritesPage;
