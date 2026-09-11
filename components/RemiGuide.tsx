import Image from "next/image";

type Props = { compact?: boolean; label?: string; priority?: boolean };

export function RemiGuide({ compact = false, label = "생각 사이를 천천히 걷는 안내자, 리미", priority = false }: Props) {
  return (
    <figure className={compact ? "remi remi--compact" : "remi"}>
      <div className="remi-scene">
        {/* 원본 브랜드 시트의 왼쪽 장면만 프레임으로 보여 원화를 훼손하지 않습니다. */}
        {/* 프레임보다 172% 크게 늘려 쓰므로 sizes도 프레임 폭이 아닌 실제 렌더 폭을 적습니다. */}
        <Image
          src="/remi-brand-sheet.png"
          alt="책상에서 책을 읽는 리미와 책 더미, 스탠드, 화분"
          width={1254}
          height={1254}
          sizes="750px"
          priority={priority}
        />
      </div>
      {!compact && <figcaption>{label}</figcaption>}
    </figure>
  );
}
