import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ExternalPlayerCard from "../components/ExternalPlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { getAuthToken } from "../utils/authStorage";
import { getFavorites } from "../services/api/favoriteApi";
import {
  searchExternalPlayers as fetchExternalPlayers,
  fetchPlayerSuggestions, // [Suggestions] 候補取得用の軽量API関数
} from "../services/api/externalPlayerApi";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const [searchText, setSearchText] = useState(keyword);
  const [players, setPlayers] = useState([]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // [Suggestions] 候補リストと表示フラグ
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // [Suggestions] debounce用タイマーID / 外クリック検知用ラッパー要素
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleSearchExternalPlayers = async (nextSearchText) => {
    if (!nextSearchText.trim()) {
      setPlayers([]);
      setErrorMessage("Please enter a player name.");
      setHasSearched(false);
      return;
    }

    // MLB Stats API は1文字では結果を返さないため最低2文字必要
    if (nextSearchText.trim().length < 2) {
      setPlayers([]);
      setErrorMessage("Please enter at least 2 characters.");
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setShowSuggestions(false); // [Suggestions] 検索実行時にドロップダウンを閉じる

      const token = getAuthToken();
      const data = await fetchExternalPlayers(nextSearchText);
      const savedPlayersData = token ? await getFavorites(token) : [];

      setPlayers(data);
      setSavedPlayers(savedPlayersData);
      setHasSearched(true);
    } catch (error) {
      console.error("External player search error:", error);
      setPlayers([]);
      setErrorMessage("Failed to search external players.");
    } finally {
      setLoading(false);
    }
  };

  // URLのkeywordが変わったら検索を実行（ブラウザ履歴・直リンク対応）
  useEffect(() => {
    if (keyword) {
      handleSearchExternalPlayers(keyword);
    }
  }, [keyword]);

  // [Suggestions] 入力中に300msのdebounceをかけて候補を取得する
  // debounce: キー入力のたびにAPIを叩かず、入力が止まってから発火させる仕組み
  useEffect(() => {
    const text = searchText.trim();

    // 2文字未満は候補を出さない（APIが結果を返さないため）
    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 前回のタイマーをキャンセルしてから新しいタイマーをセット
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchPlayerSuggestions(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300); // 300ms待ってからAPI呼び出し

    // クリーンアップ: コンポーネントが再レンダリングされたらタイマーをキャンセル
    return () => clearTimeout(debounceRef.current);
  }, [searchText]);

  // [Suggestions] フォームの外をクリックしたらドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      // wrapperRef の外側がクリックされたか判定
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    // クリーンアップ: コンポーネントがアンマウントされたらイベントリスナーを解除
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchText.trim()) {
      setSearchParams({ keyword: searchText.trim() });
    } else {
      handleSearchExternalPlayers(searchText);
    }
  };

  // [Suggestions] 候補をクリックしたら選手名をセットして即検索
  const handleSuggestionClick = (suggestion) => {
    setSearchText(suggestion.name);
    setShowSuggestions(false);
    setSearchParams({ keyword: suggestion.name });
  };

  const isAlreadySaved = (player) => {
    return savedPlayers.some((savedPlayer) => {
      if (savedPlayer.mlbPlayerId && player.externalId) {
        return savedPlayer.mlbPlayerId === player.externalId;
      }
      return savedPlayer.fullName.toLowerCase() === player.name.toLowerCase();
    });
  };

  return (
    <div className="home-page px-6 py-12">

      {/* Search Hero */}
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">MLB Stats API</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Search Players
        </h1>
        <p className="home-description mt-4 text-base">
          Search any MLB player by name from the official Stats API.
        </p>

        {/* [Suggestions] wrapperRef は「フォーム外クリック」の検知範囲 */}
        <div className="search-form-wrapper" ref={wrapperRef}>
          <form className="flex w-full gap-3" onSubmit={handleSearch}>

            {/* [Suggestions] position: relative でドロップダウンを input に揃える */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. Shohei Ohtani"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
                style={{ margin: 0 }}
                className="w-full rounded-full border border-ctp-surface1 bg-ctp-surface0/70 px-5 py-2.5 text-base text-ctp-text placeholder:text-ctp-subtext0/60 transition-all duration-200 focus:border-ctp-sapphire focus:ring-2 focus:ring-ctp-sapphire/20 focus:outline-none"
              />

              {/* [Suggestions] onMouseDown: onBlur より先に発火させてドロップダウンを閉じさせない */}
              {showSuggestions && (
                <ul className="search-suggestions">
                  {suggestions.map((s) => (
                    <li
                      key={s.id}
                      className="search-suggestion-item"
                      onMouseDown={() => handleSuggestionClick(s)}
                    >
                      <span className="suggestion-name">{s.name}</span>
                      <span className="suggestion-meta">
                        {s.position && <span>{s.position}</span>}
                        {s.team && <span>{s.team}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              className="home-link flex-shrink-0"
              type="submit"
              disabled={loading}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      <div className="home-content mt-2">

        {/* Status messages */}
        {!loading && errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        {!loading && !errorMessage && players.length > 0 && (
          <p className="status-message">
            <span className="count-badge count-badge--leading">
              {players.length}
            </span>
            {players.length === 1 ? "player" : "players"} found
          </p>
        )}

        {!loading && !errorMessage && hasSearched && players.length === 0 && (
          <div className="home-empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="empty-state-title">No players found</p>
            <p className="empty-state-desc">
              Try a different name or check the spelling.
            </p>
          </div>
        )}

        {/* Skeleton or results grid */}
        {loading ? (
          <div className="player-list">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="player-list">
            {players.map((player) => (
              <ExternalPlayerCard
                key={player.externalId}
                player={player}
                alreadySaved={isAlreadySaved(player)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default SearchPage;
