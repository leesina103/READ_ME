import type { Metadata } from "next";
import { OperationsDocument } from "@/components/OperationsDocument";

export const metadata: Metadata = {
  title: "운영 자동화 안내", description: "READ ME 운영자의 인터뷰 일정과 안내 업무를 돕는 자동화 도구를 소개합니다.",
  alternates: { canonical: "/operations" }
};

export default function OperationsPage() {
  return <OperationsDocument title="READ ME 운영 자동화" lead="인터뷰 일정을 준비하고, 필요한 안내와 기록을 놓치지 않도록 운영자의 업무를 돕는 도구입니다." path="/operations">
    <section><h2>READ ME 운영자를 위한 도구</h2><p>READ ME 운영 자동화는 독서모임 운영자가 사용하는 도구입니다. 이 페이지는 도구의 목적과 정보 처리 방식을 소개합니다. 일반 회원에게 Google 계정 연결을 요청하지 않습니다.</p></section>
    <section><h2>어떤 일을 돕나요?</h2><ul>
      <li>인터뷰 예약에 맞춰 운영자의 Google Calendar에 일정과 Google Meet 링크를 만들고, 예약 변경·취소를 반영합니다.</li>
      <li>노션에 사람별 할 일을 정리하고, 운영자에게 현재 행동·메시지 초안·다음 행동·다음 메시지 초안을 이메일로 전달합니다.</li>
      <li>운영자가 확인한 입금 정보를 노션 가계부에 기록하고, 미완료 업무와 서비스 점검 결과를 확인하도록 돕습니다.</li>
    </ul><p>현재 자동화는 연결 및 검증 단계입니다. 이 안내 페이지의 공개가 자동 알림 가동을 뜻하지는 않습니다.</p></section>
    <section><h2>운영자가 최종 확인합니다</h2><p>참여자에게 보내는 안내 메시지, 인터뷰 결과, 입금 확인은 운영자가 직접 확인합니다. 자동화가 참여 여부를 결정하거나 참여자에게 문자·알림톡을 직접 발송하지 않습니다.</p></section>
  </OperationsDocument>;
}
