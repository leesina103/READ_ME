export function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer__inner">
        <div><p className="site-footer__brand">READ ME</p><p>Read books. Read yourself.</p></div>
        <p className="site-footer__note">책을 읽고, 질문하고, 함께 사유하는 독서모임</p>
        <div className="site-footer__contact" aria-label="문의 채널">
          <span>문의 :</span>
          {/* 카카오톡 채널 개설 후 실제 주소를 연결하고 숨김을 해제합니다. */}
          <a href="#contact" style={{ display: "none" }}>카카오톡 채널</a>
          <a href="https://www.instagram.com/readmebook_kr/" target="_blank" rel="noopener noreferrer">인스타그램</a>
        </div>
      </div>
    </footer>
  );
}
