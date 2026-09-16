import Image from "next/image";
import { bookCovers } from "@/data/bookCovers";
import type { ThemeSession } from "@/data/themes";

export default function ThemeSessionBook({ session }: { session: ThemeSession }) {
  const cover = bookCovers[session.book];

  return (
    <div className="theme-session-book-row">
      {cover && (
        <div className="theme-session-book__cover">
          <Image src={cover} alt={`${session.book} 책 표지`} fill sizes="(max-width: 430px) 144px, 172px" />
        </div>
      )}
      <div className="theme-session-book">
        <div className="theme-session-book__details">
          <span>함께 읽는 책</span>
          <strong>『{session.book}』</strong>
          <small>{session.author}</small>
        </div>
      </div>
    </div>
  );
}
