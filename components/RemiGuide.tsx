type Props = { compact?: boolean; label?: string };

export function RemiGuide({ compact = false, label = "생각 사이를 천천히 걷는 안내자, 리미" }: Props) {
  return (
    <figure className={compact ? "remi remi--compact" : "remi"}>
      <div className="remi-scene">
        {/* 원본 브랜드 시트의 왼쪽 장면만 프레임으로 보여 원화를 훼손하지 않습니다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/remi-brand-sheet.png" alt="책상에서 책을 읽는 리미와 책 더미, 스탠드, 화분" />
      </div>
      {!compact && <figcaption>{label}</figcaption>}
    </figure>
  );
}
