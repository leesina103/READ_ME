export function manualMessageDocument(suffix = '') {
  const p = (text, style = 'NORMAL_TEXT') => ({ paragraph: { paragraphStyle: { namedStyleType: style }, elements: [{ textRun: { content: text + '\n' } }] } });
  return { revisionId: suffix || '원본', tabs: [{ tabProperties: { tabId: 't.0' }, documentTab: { body: { content: [
    p('수동 문자 메시지', 'HEADING_1'), p('1. 인터뷰 예약 확정', 'HEADING_3'), p('발송: 예약 확인 후'),
    p('안녕하세요, [이름]님.' + suffix), p(''), p('READ ME 인터뷰 예약이 확정됐어요.'),
    p('[날짜·요일·시간]'), p('[예약자별 전용 링크]'), p('인터뷰는 구글 미트로 진행하며, 접속 링크는 인터뷰 시작 30분 전에 문자로 보내드릴게요.'),
    p('2. 인터뷰 30분 전', 'HEADING_3'), p('[이름]님, 30분 후 [시간]에 만나요.'), p('[인터뷰 참여 링크 - 구글 미트]'),
    p('3. 인터뷰 직후', 'HEADING_3'), p('[이름]님, 고맙습니다 :)'),
    p('작성·발송 참고', 'HEADING_3'), p('운영자 참고 문구'),
    p('10. 토의 후·후기 요청', 'HEADING_3'), p('발송: 모임 종료 후'), p(''),
    p('운영자 참고 · 회차 후기 링크 예시'),
    p('해당 회차 URL을 넣어 전달합니다. 이 참고 문구는 문자에 포함하지 않습니다.'),
    p('1회차 (1주차): https://example.com/review?event=session&session=1'),
    p('2회차 (3주차): https://example.com/review?event=session&session=2'),
    p('session은 주차가 아니라 모임 회차입니다.'), p(''),
    p('[이름]님, 오늘 함께 이야기 나눠주셔서 고맙습니다.'), p(''),
    p('[회차 후기 링크]'), p('편하게 들려주세요 :)'),
    p('12. 기수 마무리·전체 후기', 'HEADING_3'), p('발송: 8주차 기록 마감 다음 날'), p(''),
    p('운영자 참고 · 전체 기수 후기 링크 (아래 URL을 넣어 전달)'),
    p('https://example.com/review?event=cohort'), p(''),
    p('[이름]님, READ ME [기수]의 8주를 함께해 주셔서 고맙습니다.'), p(''), p('[전체 기수 후기 링크]'),
    p('13. 파티 후·후기 요청', 'HEADING_3'), p('발송: 파티 다음 날'), p(''),
    p('운영자 참고 · 파티 후기 링크 (아래 URL을 넣어 전달)'),
    p('https://example.com/review?event=party'), p(''),
    p('[이름]님, 파티에 함께해 주셔서 고맙습니다.'), p(''), p('[파티 후기 링크]'),
    p('인터뷰 직후 인사 · 이전 설계 문구', 'HEADING_1'), p('3. 예전 문구', 'HEADING_3'), p('사용하면 안 되는 문구')
  ] } } }] };
}
