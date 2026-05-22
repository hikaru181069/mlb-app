import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthData, getAuthToken, getAuthUserName } from "../utils/authStorage";

const navLinkClass = ({ isActive }) =>
  [
    "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150",
    isActive
      ? "text-ctp-blue bg-ctp-surface0"
      : "text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0/60",
  ].join(" ");

function Navbar() {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const token = getAuthToken();
  const userName = getAuthUserName();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (trimmed) {
      navigate(`/search?keyword=${encodeURIComponent(trimmed)}`);
      setSearchText("");
    }
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-16 border-b border-ctp-surface1/50 bg-ctp-mantle/85 backdrop-blur-lg">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-4 sm:px-6">

        {/* Logo */}
        <NavLink
          to="/"
          className="flex-shrink-0 text-lg font-black tracking-tight text-ctp-lavender transition-colors hover:text-ctp-blue"
        >
          ⚾ MLB App
        </NavLink>

        {/* Search — sm以上で表示 */}
        <form onSubmit={handleSearch} className="hidden flex-1 sm:flex" style={{ maxWidth: "18rem" }}>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search players…"
            className="w-full rounded-full border border-ctp-surface1 bg-ctp-surface0/70 px-4 py-1.5 text-sm text-ctp-text placeholder:text-ctp-subtext0/60 transition-all duration-200 focus:border-ctp-sapphire focus:ring-2 focus:ring-ctp-sapphire/20 focus:outline-none"
          />
        </form>

        <div className="flex-1" />

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          {token && (
            <NavLink to="/favorites" className={navLinkClass}>
              Favorites
            </NavLink>
          )}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {token ? (
            <>
              <span className="hidden text-xs text-ctp-subtext0 sm:block">
                {userName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-ctp-surface1 px-3 py-1.5 text-sm font-semibold text-ctp-subtext1 transition-colors hover:border-ctp-red/60 hover:bg-ctp-red/10 hover:text-ctp-red"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  [
                    "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "border-ctp-sapphire bg-ctp-sapphire/10 text-ctp-sapphire"
                      : "border-ctp-surface1 text-ctp-subtext1 hover:border-ctp-surface2 hover:text-ctp-text",
                  ].join(" ")
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-ctp-sapphire text-ctp-base"
                      : "bg-ctp-blue text-ctp-base hover:bg-ctp-sapphire",
                  ].join(" ")
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;
