// [Phase 6] 左サイドバーナビゲーション
// fantinel.dev を参考に、トップバーから左固定サイドバーへリデザイン。
// デスクトップ (md+): 常に表示される固定サイドバー (w-52 = 208px)
// モバイル (<md): ハンバーガーボタンで左からスライドインするオーバーレイ方式

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  clearAuthData,
  getAuthToken,
  getAuthUserName,
} from "../utils/authStorage";
import { getCurrentUser } from "../services/api/userApi";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
// アイコンライブラリを入れずに済むよう、必要な分だけ SVG を直書きする。
// viewBox="0 0 24 24" は Heroicons などの標準的なグリッドサイズ。
const HomeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const StatsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const CompareIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 16V4m0 0L3 8m4-4l4 4" />
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);
const MatchupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const LeagueIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);
const NewsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z" />
  </svg>
);
// お気に入りチーム（My Team）用の盾アイコン
const TeamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5z" />
  </svg>
);
const StarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ── Nav items ─────────────────────────────────────────────────────────────────
// 配列で定義しておくことで、ナビ項目の追加・削除が一箇所で管理できる
const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/search", label: "Search", Icon: SearchIcon },
  { to: "/stats", label: "Stats", Icon: StatsIcon },
  { to: "/league", label: "League", Icon: LeagueIcon },
  { to: "/news", label: "News", Icon: NewsIcon },
  { to: "/compare", label: "Compare", Icon: CompareIcon },
  { to: "/matchup", label: "Matchup", Icon: MatchupIcon },
];

// NavLink の isActive に応じてクラスを切り替えるヘルパー関数
// React Router の NavLink は className に関数を渡せる
const sidebarLinkClass = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150",
    isActive
      ? "bg-ctp-surface0 text-ctp-blue"
      : "text-ctp-subtext1 hover:bg-ctp-surface0/60 hover:text-ctp-text",
  ].join(" ");

// ── Component ─────────────────────────────────────────────────────────────────
function Navbar() {
  // open: モバイル時のサイドバー開閉状態
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const token = getAuthToken();
  const userName = getAuthUserName();

  // ログイン中はお気に入りチームを取得し、"My Team" リンクを出す。
  // favoriteTeam は localStorage に無く User ドキュメント側にあるため API で取得する。
  const [favoriteTeam, setFavoriteTeam] = useState(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const fetchFavoriteTeam = async () => {
      try {
        const user = await getCurrentUser(token);
        if (active) setFavoriteTeam(user.favoriteTeam ?? null);
      } catch {
        // ナビは補助的なので失敗しても黙って無視する（リンクを出さないだけ）
        if (active) setFavoriteTeam(null);
      }
    };
    fetchFavoriteTeam();
    return () => {
      active = false;
    };
  }, [token]);

  // ナビリンクをクリックしたらサイドバーを閉じる（モバイル用）
  const close = () => setOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    if (q) {
      navigate(`/search?keyword=${encodeURIComponent(q)}`);
      setSearchText("");
      close();
    }
  };

  const handleLogout = () => {
    clearAuthData();
    // navigate() ではなく location.href を使う理由:
    // JWT をクリアした後、React のメモリ上に残っている認証状態も
    // 強制的にリセットするためにフルリロードが必要
    window.location.href = "/login";
  };

  // サイドバーの中身（デスクトップとモバイルオーバーレイで共用）
  const sidebarContent = (
    <div className="flex h-full flex-col px-3 py-6">
      {/* ロゴ */}
      <NavLink
        to="/"
        onClick={close}
        className="mb-8 flex items-center gap-2.5 px-3 text-ctp-lavender transition-colors duration-150 hover:text-ctp-blue"
      >
        <img
          src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
          alt="MLB"
          className="h-7 w-7 flex-shrink-0"
        />
        <span className="text-base font-black tracking-tight">MLB App</span>
      </NavLink>

      {/* ナビリンク */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={sidebarLinkClass}
            onClick={close}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
        {/* My Team はログイン済み & お気に入りチーム設定済みの場合のみ表示 */}
        {token && favoriteTeam?.id && (
          <NavLink
            to={`/team/${favoriteTeam.id}`}
            className={sidebarLinkClass}
            onClick={close}
          >
            <TeamIcon />
            My Team
          </NavLink>
        )}
        {/* Favorites はログイン済みの場合のみ表示 */}
        {token && (
          <NavLink to="/favorites" className={sidebarLinkClass} onClick={close}>
            <StarIcon />
            Favorites
          </NavLink>
        )}
      </nav>

      {/* 検索フォーム */}
      <div className="mt-6 border-t border-ctp-surface1/50 pt-5">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search players…"
            style={{ margin: 0 }}
            className="w-full rounded-full border border-ctp-surface1 bg-ctp-surface0/70 px-4 py-2 text-sm text-ctp-text placeholder:text-ctp-subtext0/60 transition-all duration-200 focus:border-ctp-sapphire focus:ring-2 focus:ring-ctp-sapphire/20 focus:outline-none"
          />
        </form>
      </div>

      {/* 認証エリア（mt-auto でサイドバー下端に固定） */}
      {/* mt-auto: Flexbox で残りのスペースをすべてマージンとして消費し、要素を最下部に押し下げる */}
      <div className="mt-auto flex flex-col gap-1 border-t border-ctp-surface1/50 pt-5">
        {token ? (
          <>
            <NavLink
              to="/profile"
              onClick={close}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150",
                  isActive
                    ? "bg-ctp-surface0 text-ctp-blue"
                    : "text-ctp-subtext0 hover:bg-ctp-surface0/60 hover:text-ctp-text",
                ].join(" ")
              }
            >
              <UserIcon />
              {userName || "Profile"}
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-ctp-subtext1 transition-all duration-150 hover:bg-ctp-red/10 hover:text-ctp-red"
            >
              <LogoutIcon />
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              onClick={close}
              className="flex w-full items-center justify-center rounded-lg border border-ctp-surface2 px-3 py-2 text-sm font-semibold text-ctp-subtext1 transition-all duration-150 hover:border-ctp-sapphire hover:text-ctp-sapphire"
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              onClick={close}
              className="flex w-full items-center justify-center rounded-lg border border-ctp-surface2 px-3 py-2 text-sm font-semibold text-ctp-subtext1 transition-all duration-150 hover:border-ctp-sapphire hover:text-ctp-sapphire"
            >
              Register
            </NavLink>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── モバイル用トップバー (md 未満のみ表示) ── */}
      {/* デスクトップではサイドバーがあるのでトップバーは不要 */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-ctp-surface1/50 bg-ctp-mantle/85 px-4 backdrop-blur-lg md:hidden">
        {/* ハンバーガーボタン: 3本線 → X への CSS トランスフォームで表現 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md text-ctp-subtext1 transition-colors hover:bg-ctp-surface0/60"
        >
          <span
            className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
        <NavLink
          to="/"
          onClick={close}
          className="flex items-center gap-2 text-ctp-lavender transition-colors hover:text-ctp-blue"
        >
          <img
            src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
            alt="MLB"
            className="h-6 w-6"
          />
          <span className="text-base font-black tracking-tight">MLB App</span>
        </NavLink>
      </div>

      {/* ── サイドバー本体 ── */}
      {/* translate-x の仕組み:
          - モバイル・閉じた状態: -translate-x-full (画面左外に隠れる)
          - モバイル・開いた状態: translate-x-0 (画面内に表示)
          - デスクトップ: md:translate-x-0 が常に上書きするので常に表示 */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 h-full w-52 border-r border-ctp-surface1/50 bg-ctp-mantle",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {sidebarContent}
      </aside>

      {/* ── モバイル用バックドロップ（背景を暗くしてクリックで閉じる） ── */}
      {/* pointer-events-none/auto でクリック判定を on/off する
          opacity で表示/非表示を切り替え（display:none と違いアニメーションが効く） */}
      <div
        className={[
          "fixed inset-0 z-40 bg-ctp-crust/60 backdrop-blur-sm md:hidden",
          "transition-opacity duration-300",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={close}
      />
    </>
  );
}

export default Navbar;
