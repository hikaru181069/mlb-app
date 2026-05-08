import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";

function OnboardingTeamPage() {
  return (
    <div className="app">
      <AppNav />

      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Choose Your Favorite Team</h1>
      <p className="status-message">
        This page will later save one favorite team for recommendations.
      </p>
    </div>
  );
}

export default OnboardingTeamPage;
