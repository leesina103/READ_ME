import Link from "next/link";

export function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer__inner">
        <div><p className="site-footer__brand">READ ME</p><p>Read books. Read yourself.</p></div>
        <nav aria-label="하단 메뉴"><Link href="/about">소개</Link><Link href="/meeting">모임</Link><Link href="/my">나의 서재</Link><Link href="/login">로그인</Link></nav>
        <p className="site-footer__note">책을 읽고, 질문하고, 함께 사유하는 독서모임</p>
        <div className="site-footer__contact" aria-label="문의 채널">
          <span>문의 :</span>
          {/* 외부 채널 주소가 확정되면 각 href를 실제 URL로 교체합니다. */}
          <a href="#contact">카카오톡 채널</a>
          <a href="#contact">인스타그램</a>
        </div>
      </div>
    </footer>
  );
}
