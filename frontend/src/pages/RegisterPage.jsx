import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";

function RegisterPage() {
  return (
    <div className="app">
      <AppNav />

      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Register</h1>
      <p className="status-message">
        Registration page will be added after the favorites flow is stable.
      </p>
    </div>
  );
}

export default RegisterPage;
