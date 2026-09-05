import Image from "next/image";

type Props = {
  priority?: boolean;
};

export function MeetRemi({ priority = false }: Props) {
  return (
    <div className="intro-remi">
      <div>
        <p className="eyebrow">MEET REMI</p>
        <h3>질문 곁에서 함께 걷는 리미</h3>
        <p>책에서 시작한 질문이 나와 사람을 지나 삶으로 이어질 수 있도록, READ ME의 캐릭터 리미가 여정을 안내합니다.</p>
      </div>
      <Image
        src="/remi-brand-sheet-no-palette.png"
        alt="책을 읽고 질문하며 대화하는 READ ME 캐릭터 리미"
        width={1254}
        height={1254}
        sizes="(max-width: 820px) 100vw, 50vw"
        priority={priority}
      />
    </div>
  );
}
