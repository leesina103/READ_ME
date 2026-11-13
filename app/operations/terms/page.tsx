import type { Metadata } from "next";
import { OperationsDocument } from "@/components/OperationsDocument";

export const metadata: Metadata = {
  title: "운영 자동화 이용 안내", description: "READ ME 운영 자동화의 사용 대상, 운영자 확인 범위와 이용 중단 방법을 안내합니다.",
  alternates: { canonical: "/operations/terms" }
};

export default function OperationsTermsPage() {
  return <OperationsDocument title="이용 안내" lead="READ ME 운영 자동화는 독서모임 운영 업무를 보조하기 위한 도구입니다." path="/operations/terms">
    <section><h2>사용 대상과 범위</h2><p>READ ME 운영자가 승인된 계정과 자료를 연결하여 인터뷰 일정, 안내 준비, 업무 기록 및 확인된 입금 내역을 관리하는 용도로 사용합니다. 일반 회원에게 계정 연결 기능을 제공하거나 별도 자동화 이용 요금을 청구하지 않습니다.</p></section>
    <section><h2>운영자의 확인</h2><p>운영자는 일정과 수신 대상, 메시지 초안, 인터뷰 기록 및 입금 정보를 확인한 뒤 필요한 행동을 수행합니다. 초안이 생성되거나 이메일 알림이 왔다는 사실만으로 참여자 안내나 입금 확인이 완료된 것은 아닙니다.</p><p>참여 승인·거절, 참여자에게 보내는 메시지, 금전 거래는 자동화가 대신 결정하거나 실행하지 않습니다.</p></section>
    <section><h2>오류와 중단 시 처리</h2><p>Google, Notion, 이메일 발송 서비스 또는 서버의 장애, 권한 해제 등에 따라 일정 생성이나 알림이 지연·실패할 수 있습니다. 운영자는 중요한 인터뷰 일정을 직접 확인하고, 오류가 발견되면 실제 처리 이력과 대조한 뒤 다시 진행합니다.</p></section>
    <section><h2>이용 종료와 안내 변경</h2><p>운영자는 서버 자동화를 중지하고 연결된 서비스의 접근 권한을 해제할 수 있습니다. 기존 기록의 삭제 방법은 개인정보 처리 안내를 따릅니다. 사용 범위나 정보 처리 방식이 바뀌면 이 안내를 수정하고, 새로운 접근 권한이 필요한 경우 별도로 승인받습니다.</p></section>
  </OperationsDocument>;
}
