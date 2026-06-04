// チームロスタービューア（汎用）
// URL: /team-roster?teamId=147
//
// 任意のチームのロスターを表示する公開ページ。
// teamId クエリパラメータでチームを指定する（League / Home から遷移）。
// ロスターは MLB Stats API の公開データなのでログイン不要。

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PlayerCard from "../components/PlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { getExternalPlayersByTeam } from "../services/api/externalPlayerApi";
import { mlbTeams } from "../services/mlbTeams";
import { getApiErrorMessage } from "../services/api/apiError";

const SKELETON_COUNT = 12;

function RosterSection({ title, players, loading, skeletonCount }) {
  if (loading) {
    return (
      <section className="home-player-section">
        <div className="section-heading-row">
          <div className="section-heading">
            <h2>{title}</h2>
          </div>
        </div>
        <div className="player-list">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (players.length === 0) return null;

  return (
    <section className="home-player-section">
      <div className="section-heading-row">
        <div className="section-heading">
          <h2>
            {title}
            <span className="count-badge">{players.length}</span>
          </h2>
        </div>
      </div>
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId || player.mlbPlayerId}
            player={player}
          />
        ))}
      </div>
    </section>
  );
}

function TeamRosterPage() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // teamId から mlbTeams のチーム情報を引く（名前・略称の表示用）
  const team = useMemo(
    () => mlbTeams.find((t) => t.id === Number(teamId)),
    [teamId],
  );

  useEffect(() => {
    // teamId がなければ何もしない（下で「チーム未選択」を案内）
    if (!teamId) return;

    const fetchTeamRoster = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const teamPlayers = await getExternalPlayersByTeam(teamId);
        setPlayers(teamPlayers);
      } catch (error) {
        console.error("Team roster fetch error:", error);
        setErrorMessage(
          getApiErrorMessage(error, "Failed to load team roster."),
        );
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamRoster();
  }, [teamId]);

  const { pitchers, positionPlayers } = useMemo(() => {
    return {
      pitchers: players.filter((p) => p.playerType === "pitcher"),
      positionPlayers: players.filter((p) => p.playerType !== "pitcher"),
    };
  }, [players]);

  // teamId 未指定: チーム選択を促す
  if (!teamId) {
    return (
      <div className="home-page px-6 py-12">
        <div className="home-empty-state">
          <span className="empty-state-icon">⚾</span>
          <p className="empty-state-title">No team selected</p>
          <p className="empty-state-desc">
            Pick a team from the League standings to see its roster.
          </p>
          <Link className="home-link secondary" to="/league">
            Go to League
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page px-6 py-12">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Team Roster</p>
        <div className="flex items-center justify-center gap-3">
          <img
            src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`}
            alt={team?.name ?? "Team"}
            style={{ width: "48px", height: "48px" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {team?.name ?? "Team"}
          </h1>
          {!loading && players.length > 0 && (
            <span className="count-badge">{players.length}</span>
          )}
        </div>
        <p className="home-description mt-4 text-base">
          Full roster from the MLB Stats API.
        </p>
        <div className="home-actions mt-6">
          <Link className="home-link secondary" to="/league">
            ← Back to League
          </Link>
        </div>
      </section>

      <div className="home-content mt-2 w-full">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {!loading && !errorMessage && players.length === 0 && (
          <div className="home-empty-state">
            <span className="empty-state-icon">⚾</span>
            <p className="empty-state-title">No players found</p>
            <p className="empty-state-desc">
              Could not load the roster for this team.
            </p>
          </div>
        )}

        <RosterSection
          title="Pitchers"
          players={pitchers}
          loading={loading}
          skeletonCount={Math.ceil(SKELETON_COUNT / 2)}
        />

        <RosterSection
          title="Position Players"
          players={positionPlayers}
          loading={loading}
          skeletonCount={Math.ceil(SKELETON_COUNT / 2)}
        />
      </div>
    </div>
  );
}

export default TeamRosterPage;
