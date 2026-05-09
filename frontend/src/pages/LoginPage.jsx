import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthData,
  getAuthToken,
  getAuthUserName,
  saveAuthData,
} from "../utils/authStorage";
import { loginUser } from "../services/api/authApi";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const token = getAuthToken();
  const userName = getAuthUserName();

  const handleLogout = () => {
    clearAuthData();
    setSuccessMessage("");
    setErrorMessage("");
    window.location.reload();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await loginUser({ email, password });

      saveAuthData(data);

      setErrorMessage("");
      setSuccessMessage("Login successful.");
      navigate(data.hasCompletedOnboarding ? "/" : "/onboarding/team");
    } catch (error) {
      console.error("Login error:", error);
      setSuccessMessage("");
      setErrorMessage(error.message || "Failed to login.");
    }
  };
  if (token) {
    return (
      <div className="app">
        <Link className="back-link" to="/">
          ← Back to Home
        </Link>

        <h1>Already logged in</h1>
        <p className="status-message">Logged in as {userName || "user"}</p>

        <Link className="add-player-link" to="/">
          Go to Home
        </Link>

        <button className="delete-button" type="button" onClick={handleLogout}>
          Logout and Login Again
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Login</h1>

      <form
        className="player-form mx-auto mt-8 w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <label>
          Email
          <input
            type="email"
            name="email"
            placeholder="test@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="password123"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit">Login</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="status-message">{successMessage}</p>}
    </div>
  );
}

export default LoginPage;
