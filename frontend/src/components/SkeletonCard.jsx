function SkeletonCard() {
  return (
    <div className="player-card animate-pulse">
      <div className="mx-auto mb-5 h-[340px] w-[min(100%,260px)] rounded-[10%] bg-ctp-surface1" />
      <div className="mx-auto mb-3 h-5 w-3/4 rounded-md bg-ctp-surface1" />
      <div className="mx-auto mb-2 h-4 w-1/2 rounded-md bg-ctp-surface1" />
      <div className="mx-auto mb-2 h-4 w-2/5 rounded-md bg-ctp-surface1" />
      <div className="mt-4 border-t border-ctp-surface1/50 pt-4">
        <div className="mx-auto mb-2 h-4 w-3/5 rounded-md bg-ctp-surface1" />
        <div className="mx-auto h-4 w-2/5 rounded-md bg-ctp-surface1" />
      </div>
    </div>
  );
}

export default SkeletonCard;
