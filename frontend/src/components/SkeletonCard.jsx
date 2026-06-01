// [Phase 10] Shimmer skeleton
// animate-pulse（透明度のフェード）から shimmer（光が流れるグラデーション）に変更。
// .skeleton-block クラスに CSS のアニメーションが定義されている（App.css 参照）。
function SkeletonCard() {
  return (
    // animate-pulse を削除 → skeleton-block が個別にアニメーションを持つ
    <div className="player-card">
      {/* プレイヤー画像プレースホルダー */}
      <div className="skeleton-block mx-auto mb-5 h-[340px] w-[min(100%,260px)] rounded-[10%]" />
      {/* 名前 */}
      <div className="skeleton-block mx-auto mb-3 h-5 w-3/4 rounded-md" />
      {/* チーム */}
      <div className="skeleton-block mx-auto mb-2 h-4 w-1/2 rounded-md" />
      {/* ポジション */}
      <div className="skeleton-block mx-auto mb-2 h-4 w-2/5 rounded-md" />
      <div className="mt-4 border-t border-ctp-surface1/50 pt-4">
        {/* スタッツ行 */}
        <div className="skeleton-block mx-auto mb-2 h-4 w-3/5 rounded-md" />
        <div className="skeleton-block mx-auto h-4 w-2/5 rounded-md" />
      </div>
    </div>
  );
}

export default SkeletonCard;
