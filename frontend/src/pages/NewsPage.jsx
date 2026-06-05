// ニュースページ
// URL: /news
// MLB 公式 RSS フィードを Express 経由で取得して一覧表示する。

import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import NewsList from "../components/NewsList";
import { getNews } from "../services/api/newsApi";

function NewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchNews = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getNews(24);
        if (active) setItems(data.items);
      } catch {
        if (active) setError("Failed to load news.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchNews();
    return () => { active = false; };
  }, []);

  return (
    <div className="app-screen">
      <PageHeader
        kicker="MLB.com"
        title="News"
        subtitle="Latest news and stories from around Major League Baseball."
      />
      <div className="screen-body px-6 py-6 w-full">
        {loading && <p className="compare-loading">Loading news…</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && <NewsList items={items} />}
      </div>
    </div>
  );
}

export default NewsPage;
