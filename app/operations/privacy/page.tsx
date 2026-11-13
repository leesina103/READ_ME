import type { Metadata } from "next";
import { OperationsDocument } from "@/components/OperationsDocument";

export const metadata: Metadata = {
  title: "운영 자동화 개인정보 처리 안내", description: "운영 자동화의 Google Calendar 권한, 정보 이용 목적, 보관 및 연결 해제 방법을 안내합니다.",
  alternates: { canonical: "/operations/privacy" }
};

export default function OperationsPrivacyPage() {
  return <OperationsDocument title="개인정보 처리 안내" lead="READ ME 운영 자동화에서 사용하는 정보와 연결 권한을 안내합니다. 이 안내는 운영 자동화 도구에 적용됩니다." path="/operations/privacy">
    <section><h2>사용하는 정보와 목적</h2><ul>
      <li>인터뷰 예약자의 이름, 예약 시각, 예약 상태와 예약 식별 정보를 이용해 일정과 운영 할 일을 관리합니다.</li>
      <li>운영자의 Google 계정 및 캘린더 정보를 확인하고, 인터뷰 일정의 제목·시작 및 종료 시각·Meet 링크·일정 식별 정보를 처리합니다.</li>
      <li>노션의 업무 상태와 운영자가 확인한 입금자명·실제 입금액·입금일을 이용해 미완료 업무를 알리고 가계부를 작성합니다.</li>
      <li>발송 및 동기화 이력을 보관해 같은 알림이나 기록이 중복 생성되는 것을 방지합니다.</li>
    </ul></section>
    <section><h2>Google 계정 연결 권한</h2><p>Google이 제공하는 권한 단위에 따라, 접근 가능한 캘린더의 제목·설명·시간대 등 속성 조회와 본인 소유 캘린더 일정의 조회·생성·변경·삭제 권한을 요청합니다.</p><p>자동화는 연결된 READ ME 운영 계정의 기본 캘린더를 사용하며, READ ME 자동화가 만든 인터뷰 일정을 예약에 맞춰 변경·취소하도록 구성합니다. Gmail 메일함, Google Drive 파일, Meet 녹화·음성·대화 내용에 대한 접근 권한은 요청하지 않습니다.</p></section>
    <section><h2>어디에 저장하고 전달하나요?</h2><ul>
      <li>Google Calendar·Meet: 인터뷰 일정과 화상회의 링크를 생성·관리합니다.</li>
      <li>Supabase: 예약 정보, 동기화·발송 이력을 저장하고 자동화를 실행합니다. Google 지속 인증 정보와 연결용 인증키는 서버 비밀 저장소에 보관합니다.</li>
      <li>Notion: 사람별 운영 할 일, 메시지 초안, Meet 링크와 확인된 입금 내역을 저장합니다.</li>
      <li>Resend: 필요한 업무 정보와 메시지 초안을 운영자 이메일로 전달합니다.</li>
    </ul><p>이 정보는 운영 업무를 위해 사용하며 광고, 판매 또는 AI 모델 학습 목적으로 사용하지 않습니다. 공개 안내 페이지에는 실제 회원 정보·일정·인증 정보를 표시하지 않습니다.</p></section>
    <section><h2>보관과 삭제</h2><p>연결 인증 정보는 자동화 연결을 유지하는 동안 보관합니다. 운영 기록은 업무 확인과 중복 처리 방지를 위해 보관하며, 현재 일괄 자동 삭제 주기는 설정되어 있지 않습니다. 삭제가 필요한 경우 아래 문의 주소로 요청하면 운영자가 해당 기록과 처리 범위를 확인합니다.</p><p>Google 연결 해제만으로 이미 생성된 캘린더 일정이나 노션·Supabase의 운영 기록이 자동으로 삭제되지는 않습니다. 인증 정보 삭제와 기존 기록 삭제는 각각 확인해야 합니다.</p></section>
    <section><h2>연결 해제 및 문의</h2><p>운영자는 <a href="https://myaccount.google.com/connections">Google 계정의 서드 파티 연결 관리</a>에서 ‘READ ME 운영 자동화’의 접근 권한을 해제할 수 있습니다. 이후 Google 일정 동기화와 Meet 생성은 중단되며, 다른 운영 알림까지 중지하려면 서버 자동화도 함께 중지해야 합니다.</p><p>정보 조회·정정·삭제 또는 연결 해제에 관한 문의는 <a href="mailto:readmebook.kr@gmail.com">readmebook.kr@gmail.com</a>으로 보내주세요.</p></section>
  </OperationsDocument>;
}
