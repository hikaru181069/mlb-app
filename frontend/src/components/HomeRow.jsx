import { Link } from "react-router-dom";

import styles from "./HomeRow.module.css";

function HomeRow({
  title,
  viewAllTo,
  loading,
  items = [],
  renderItem,
  emptyMessage,
  skeletonCount = 4,
}) {
  // ローディング中でもなく、表示するアイテムも空状態メッセージも無いなら、セクションごと非表示にする
  if (!loading && items.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <section className={styles.row}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {viewAllTo && (
          <Link to={viewAllTo} className={styles.viewAll}>
            View all →
          </Link>
        )}
      </div>
      <div className={styles.scroll}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="skeleton-block" style={{ height: 210, borderRadius: 14 }} />
            ))
          : items.length > 0
          ? items.map(renderItem)
          : <p className={styles.empty}>{emptyMessage}</p>}
      </div>
    </section>
  );
}

export default HomeRow;
