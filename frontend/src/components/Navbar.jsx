import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  clearAuthData,
  getAuthToken,
  getAuthUserName,
} from "../utils/authStorage";

const navLinkClass = ({ isActive }) =>
  [
    "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150",
    isActive
      ? "text-ctp-blue bg-ctp-surface0"
      : "text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0/60",
  ].join(" ");

const mobileNavLinkClass = ({ isActive }) =>
  [
    "block w-full px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-150",
    isActive
      ? "text-ctp-blue bg-ctp-surface0"
      : "text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0/60",
  ].join(" ");

function Navbar() {
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = getAuthToken();
  const userName = getAuthUserName();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (trimmed) {
      navigate(`/search?keyword=${encodeURIComponent(trimmed)}`);
      setSearchText("");
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/login";
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-ctp-surface1/50 bg-ctp-mantle/85 backdrop-blur-lg">
      {/* ── デスクトップ / モバイル共通バー ── */}
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <NavLink
          to="/"
          onClick={closeMenu}
          className="flex flex-shrink-0 items-center gap-2 text-lg font-black tracking-tight text-ctp-lavender transition-colors hover:text-ctp-blue"
        >
          <img
            src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
            alt="MLB"
            className="h-7 w-auto"
          />
          MLB App
        </NavLink>

        {/* Search — sm以上のみ */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 items-center"
          style={{ maxWidth: "18rem" }}
        >
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search players…"
            style={{ margin: 0 }}
            className="w-full rounded-full border border-ctp-surface1 bg-ctp-surface0/70 px-4 py-1.5 text-sm text-ctp-text placeholder:text-ctp-subtext0/60 transition-all duration-200 focus:border-ctp-sapphire focus:ring-2 focus:ring-ctp-sapphire/20 focus:outline-none"
          />
        </form>

        <div className="flex-1" />

        {/* Nav links — sm以上のみ */}
        <nav className="hidden sm:flex items-center gap-0.5">
          <NavLink to="/" className={navLinkClass} end>Home</NavLink>
          <NavLink to="/search" className={navLinkClass}>Search</NavLink>
          <NavLink to="/stats" className={navLinkClass}>Stats</NavLink>
          <NavLink to="/compare" className={navLinkClass}>Compare</NavLink>
          {token && (
            <NavLink to="/favorites" className={navLinkClass}>Favorites</NavLink>
          )}
        </nav>

        {/* Auth — sm以上のみ */}
        <div className="hidden sm:flex items-center gap-2">
          {token ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  [
                    "text-xs font-semibold transition-colors",
                    isActive ? "text-ctp-blue" : "text-ctp-subtext0 hover:text-ctp-text",
                  ].join(" ")
                }
              >
                {userName}
              </NavLink>
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
                  ["rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
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
                  ["rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                    isActive ? "bg-ctp-sapphire text-ctp-base" : "bg-ctp-blue text-ctp-base hover:bg-ctp-sapphire",
                  ].join(" ")
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* ハンバーガーボタン — sm未満のみ */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="sm:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-md text-ctp-subtext1 hover:bg-ctp-surface0/60 transition-colors"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* ── モバイルメニュー ── */}
      {menuOpen && (
        <div className="sm:hidden border-t border-ctp-surface1/50 bg-ctp-mantle/95 backdrop-blur-lg px-4 pb-4 pt-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search players…"
              style={{ margin: 0 }}
              className="w-full rounded-full border border-ctp-surface1 bg-ctp-surface0/70 px-4 py-2 text-sm text-ctp-text placeholder:text-ctp-subtext0/60 focus:border-ctp-sapphire focus:ring-2 focus:ring-ctp-sapphire/20 focus:outline-none"
            />
          </form>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 mb-3">
            <NavLink to="/" className={mobileNavLinkClass} end onClick={closeMenu}>Home</NavLink>
            <NavLink to="/search" className={mobileNavLinkClass} onClick={closeMenu}>Search</NavLink>
            <NavLink to="/stats" className={mobileNavLinkClass} onClick={closeMenu}>Stats</NavLink>
            <NavLink to="/compare" className={mobileNavLinkClass} onClick={closeMenu}>Compare</NavLink>
            {token && (
              <NavLink to="/favorites" className={mobileNavLinkClass} onClick={closeMenu}>Favorites</NavLink>
            )}
          </nav>

          {/* Auth */}
          <div className="flex flex-col gap-2 pt-2 border-t border-ctp-surface1/40">
            {token ? (
              <>
                {userName && (
                  <NavLink
                    to="/profile"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      [
                        "text-xs font-semibold px-1 transition-colors",
                        isActive ? "text-ctp-blue" : "text-ctp-subtext0 hover:text-ctp-text",
                      ].join(" ")
                    }
                  >
                    {userName}
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-full border border-ctp-surface1 py-2 text-sm font-semibold text-ctp-subtext1 transition-colors hover:border-ctp-red/60 hover:bg-ctp-red/10 hover:text-ctp-red"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="block w-full rounded-full border border-ctp-surface1 py-2 text-center text-sm font-semibold text-ctp-subtext1 transition-colors hover:border-ctp-surface2 hover:text-ctp-text"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="block w-full rounded-full bg-ctp-blue py-2 text-center text-sm font-semibold text-ctp-base transition-colors hover:bg-ctp-sapphire"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
