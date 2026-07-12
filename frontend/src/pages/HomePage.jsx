import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/api/userApi";
import { getFavorites } from "../services/api/favoriteApi";
import {
  getForYouRecommendations,
  getFutureStars,
} from "../services/api/recommendationApi";
import { getOnboardingPlayers } from "../services/api/externalPlayerApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { isUnauthorizedError } from "../services/api/apiError";
import { getArchetypeColor } from "../services/archetypeColors";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";

import PlayerCard from "../components/PlayerCard";
import FavoritePlayerCard from "../components/FavoritePlayerCard";
import HomeRow from "../components/HomeRow";
import TodaysPick from "../components/TodaysPick";

import styles from "./HomePage.module.css";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

const ARCHETYPES = [
  { type: "power-hitter", label: "Power Hitter" },
  { type: "speedster", label: "Speedster" },
  { type: "contact-hitter", label: "Contact Hitter" },
  { type: "ace", label: "Ace" },
  { type: "power-pitcher", label: "Power Pitcher" },
  { type: "workhorse", label: "Workhorse" },
  { type: "elite-defender", label: "Elite Defender" },
];

const TILES = [
  {
    to: "/foryou",
    title: "For You",
    desc: "Players who play like your favorites",
    color: "var(--ctp-sapphire)",
    cta: "View picks →",
  },
  {
    to: "/recommendations",
    title: "Discovery Quiz",
    desc: "Answer 3 questions to find your next favorite player",
    color: "var(--ctp-lavender)",
    cta: "Start quiz →",
  },
  {
    to: "/compare",
    title: "Compare",
    desc: "Head-to-head stats for any two MLB players",
    color: "var(--ctp-blue)",
    cta: "Compare players →",
  },
  {
    to: "/matchup",
    title: "Matchup",
    desc: "Pitcher vs batter — career stats and AI prediction",
    color: "var(--ctp-red)",
    cta: "Simulate →",
  },
  {
    to: "/prospects",
    title: "Prospects",
    desc: "AAA & AA players on the verge of breaking through",
    color: "var(--ctp-green)",
    cta: "Explore →",
  },
  {
    to: "/stats",
    title: "MLB Stats",
    desc: "League leaders in hitting and pitching this season",
    color: "var(--ctp-peach)",
    cta: "View Leaders →",
  },
  {
    to: "/scout",
    title: "Scouting",
    desc: "Deep-dive any MLB player's stats and analytics",
    color: "var(--ctp-mauve)",
    cta: "Scout a player →",
  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── ホームページ ───────────────────────────────────────────────────────────
function HomePage() {
  const [user, setUser] = useState(null);
  const [forYouData, setForYouData] = useState(null);
  const [forYouLoading, setForYouLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [futureStars, setFutureStars] = useState([]);
  const [futureStarsLoading, setFutureStarsLoading] = useState(true);
  const [popularPlayers, setPopularPlayers] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const token = getAuthToken();
  const { recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    getCurrentUser(token)
      .then(setUser)
      .catch((err) => {
        if (isUnauthorizedError(err)) clearAuthData();
      });
  }, [token]);

  // 各行を独立したリクエストにする(Promise.allでまとめない)。
  // ForYou/Future StarsはFastAPI(コールドスタートで遅くなりうる)経由のため、
  // まとめて待つとFavorites/Popularなど速い行までブロックされてしまう。
  useEffect(() => {
    getForYouRecommendations(token)
      .catch(() => ({ groups: [], fallback: [] }))
      .then((data) => {
        setForYouData(data);
        setForYouLoading(false);
      });
  }, [token]);

  useEffect(() => {
    getFavorites(token)
      .catch(() => [])
      .then((data) => {
        setFavorites(data);
        setFavoritesLoading(false);
      });
  }, [token]);

  useEffect(() => {
    getFutureStars(token)
      .catch(() => [])
      .then((data) => {
        setFutureStars(data);
        setFutureStarsLoading(false);
      });
  }, [token]);

  useEffect(() => {
    getOnboardingPlayers()
      .catch(() => [])
      .then((data) => {
        setPopularPlayers(data);
        setPopularLoading(false);
      });
  }, []);

  // お気に入り未登録のユーザーには「本物のおすすめ」が存在しないため、
  // ForYou APIのfallback(=人気選手)は使わない。それを使うと「Popular Players」行と
  // 内容が重複して見えてしまうため、groupsが無い場合は空のまま(空状態メッセージを表示)にする。
  const recommendedItems = forYouData?.groups?.length
    ? forYouData.groups.flatMap((group) => group.matches).slice(0, 10)
    : [];

  // Today's Pick: 本物のパーソナライズ結果がある場合のみ表示する。
  // 無い場合(お気に入り0件など)は表示しない — Popular Playersと同じ選手が
  // 二重に強調表示されるのを避けるため。
  const todaysPick = forYouData?.groups?.[0]?.matches?.[0] || null;

  // ─── ログイン済み表示 ─────────────────────────────────────────────────────
  return (
    <div className="home-discovery">
      <header className="home-discovery-header">
        <p className="home-greeting">
          {getGreeting()}
          {user?.name ? `, ${user.name}` : ""}
        </p>
      </header>

      <TodaysPick player={todaysPick} loading={forYouLoading} />

      <HomeRow
        title="Recommended For You"
        viewAllTo="/foryou"
        loading={forYouLoading}
        items={recommendedItems}
        emptyMessage="Add players to your favorites to get personalized recommendations."
        renderItem={(match) => (
          <PlayerCard
            key={match.mlbPlayerId}
            player={{ ...match, imageUrl: HEADSHOT_URL(match.mlbPlayerId) }}
          />
        )}
      />

      <HomeRow
        title="Your Favorites"
        viewAllTo="/favorites"
        loading={favoritesLoading}
        items={favorites}
        emptyMessage="You haven't added any favorite players yet."
        renderItem={(favorite) => (
          <FavoritePlayerCard key={favorite._id} favorite={favorite} />
        )}
      />

      <HomeRow
        title="Future Stars"
        viewAllTo="/prospects"
        loading={futureStarsLoading}
        items={futureStars.slice(0, 10)}
        emptyMessage="Add favorites to see rising prospects picked for you."
        renderItem={(prospect) => (
          <PlayerCard
            key={prospect.playerId}
            player={{ ...prospect, imageUrl: HEADSHOT_URL(prospect.playerId) }}
          />
        )}
      />

      <HomeRow
        title="Popular Players"
        viewAllTo="/search"
        loading={popularLoading}
        items={popularPlayers.slice(0, 10)}
        emptyMessage="Couldn't load popular players right now."
        renderItem={(player) => (
          <PlayerCard
            key={player.mlbPlayerId}
            player={{ ...player, imageUrl: HEADSHOT_URL(player.mlbPlayerId) }}
          />
        )}
      />

      {/* 閲覧履歴はlocalStorage管理のため、無ければ行ごと非表示になる(emptyMessage未指定) */}
      <HomeRow
        title="Recently Viewed"
        loading={false}
        items={recentlyViewed}
        renderItem={(player) => <PlayerCard key={player.playerId} player={player} />}
      />

      {/* 機能タイル */}
      <h2 className={styles.toolsHeading}>Tools</h2>
      <div className={`home-tiles ${styles.tilesCompact}`}>
        {TILES.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="home-tile"
            style={{ "--tile-color": tile.color }}
          >
            <h3 className="home-tile-title">{tile.title}</h3>
            <p className="home-tile-desc">{tile.desc}</p>
            <span className="home-tile-cta">{tile.cta}</span>
          </Link>
        ))}
      </div>

      {/* プレースタイル別に探す */}
      <section className="discovery-section">
        <div className="discovery-section-header">
          <div className="discovery-section-title-row">
            <h2 className="discovery-section-title">Browse by Style</h2>
            <Link to="/positions" className="discovery-see-all">
              Browse by Position →
            </Link>
          </div>
          <p className="discovery-section-desc">
            Explore players by playing style
          </p>
        </div>
        <div className="discovery-archetypes">
          {ARCHETYPES.map((a) => (
            <Link
              key={a.type}
              to={`/archetype/${a.type}`}
              className="archetype-badge"
              style={{ background: getArchetypeColor(a.label), color: "var(--ctp-base)" }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
