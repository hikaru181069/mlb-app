import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuthToken,
  getAuthUserName,
  saveAuthData,
} from "../utils/authStorage";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const token = getAuthToken();
  const userName = getAuthUserName();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSuccessMessage("");
        setErrorMessage(data.message || "Failed to login.");
        return;
      }

      saveAuthData(data);

      setErrorMessage("");
      setSuccessMessage("Login successful.");
      navigate("/players");
    } catch (error) {
      console.error("Login error:", error);
      setSuccessMessage("");
      setErrorMessage("Failed to login.");
    }
  };
  if (token) {
    return (
      <div className="app">
        <Link className="back-link" to="/">
          Back to Home
        </Link>

        <h1>Already logged in</h1>
        <p className="status-message">Logged in as {userName || "user"}</p>

        <Link className="add-player-link" to="/players">
          Go to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="app">
      <Link className="back-link" to="/">
        Back to Home
      </Link>

      <h1>Login</h1>

      <form className="player-form" onSubmit={handleSubmit}>
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
