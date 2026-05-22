import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../services/api/authApi";
import { saveAuthData } from "../utils/authStorage";

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setErrorMessage("");
      const data = await registerUser(formData);

      saveAuthData(data);
      navigate("/onboarding/team");
    } catch (error) {
      console.error("Register error:", error);
      setErrorMessage(
        error.message || "Failed to register. Please check your input.",
      );
    }
  };

  return (
    <div className="app">
      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Register</h1>

      <form
        className="player-form mx-auto mt-8 w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="password123"
          />
        </label>

        <button type="submit">Create Account</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
}

export default RegisterPage;
