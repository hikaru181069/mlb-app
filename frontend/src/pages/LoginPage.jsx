import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
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

  const navigate = useNavigate();
  const token = getAuthToken();
  const userName = getAuthUserName();

  const handleLogout = () => {
    clearAuthData();
    window.location.reload();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await loginUser({ email, password });
      saveAuthData(data);
      navigate(data.hasCompletedOnboarding ? "/" : "/onboarding/favorites");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(
        error.message || "Failed to login. Please check your email and password.",
      );
    }
  };

  if (token) {
    return (
      <div className="home-page px-6 py-16">
        <div className="home-empty-state">
          <span className="empty-state-icon"><CheckCircle size={36} strokeWidth={1.5} /></span>
          <p className="empty-state-title">Already logged in as {userName || "user"}</p>
          <div className="home-actions">
            <Link className="home-link" to="/">Go to Home</Link>
            <button className="home-link danger" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page px-6 py-16">
      <section className="home-hero w-full max-w-md px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Welcome Back</p>
        <h1 className="text-4xl font-black tracking-tight">Login</h1>
        <p className="home-description mt-3 text-base">
          Sign in to access your favorites and recommendations.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ margin: 0 }}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ margin: 0 }}
            />
          </label>

          {errorMessage && <p className="error-message" style={{ margin: 0 }}>{errorMessage}</p>}

          <button className="home-link" type="submit">Login</button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Register →</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
