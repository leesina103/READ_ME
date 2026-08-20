import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div><p className="site-footer__brand">READ ME</p><p>Read books. Read yourself.</p></div>
        <nav aria-label="하단 메뉴"><Link href="/about">소개</Link><Link href="/meeting">모임</Link><Link href="/my">나의 서재</Link><Link href="/login">로그인</Link></nav>
        <p className="site-footer__note">책을 읽고, 질문하고, 함께 사유하는 독서모임</p>
      </div>
    </footer>
  );
}
