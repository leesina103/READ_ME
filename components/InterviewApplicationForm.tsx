"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import {
  submitInterviewApplicationAction,
  type InterviewApplicationState
} from "@/app/interview/apply/actions";

export type InterviewSlot = {
  id: number;
  startsAt: string;
  available: boolean;
};

const initialState: InterviewApplicationState = { status: "idle", message: "" };
const timeZone = "Asia/Seoul";
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function dateKey(startsAt: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(startsAt));
}

function dateLabel(startsAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(startsAt));
}

function fullDateTimeLabel(startsAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(startsAt));
}

function timeLabel(startsAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(startsAt));
}

type InterviewApplicationFormProps = {
  slots: InterviewSlot[];
};

export function InterviewApplicationForm({ slots }: InterviewApplicationFormProps) {
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, InterviewSlot[]>();

    for (const slot of slots) {
      const key = dateKey(slot.startsAt);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }

    return [...groups.entries()].map(([key, dateSlots]) => ({ key, slots: dateSlots }));
  }, [slots]);

  const months = useMemo(
    () => [...new Set(groupedSlots.map((group) => group.key.slice(0, 7)))],
    [groupedSlots]
  );
  const firstAvailableGroup = groupedSlots.find((group) =>
    group.slots.some((slot) => slot.available)
  );
  const firstAvailableSlot = firstAvailableGroup?.slots.find((slot) => slot.available);
  const [selectedDate, setSelectedDate] = useState(firstAvailableGroup?.key ?? "");
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState(firstAvailableSlot?.id ?? 0);
  const [state, formAction, pending] = useActionState(submitInterviewApplicationAction, initialState);
  const selectedDateSlots = (
    groupedSlots.find((group) => group.key === selectedDate)?.slots ?? []
  ).filter((slot) => slot.available);
  const selectedDateGroup = groupedSlots.find((group) => group.key === selectedDate);
  const selectedMonthHasAvailable = groupedSlots.some(
    (group) =>
      group.key.startsWith(selectedMonth) && group.slots.some((slot) => slot.available)
  );
  const selectedMonthIndex = months.indexOf(selectedMonth);
  const calendarDays = useMemo(() => {
    if (!selectedMonth) return [];

    const [year, month] = selectedMonth.split("-").map(Number);
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const groupsByDate = new Map(groupedSlots.map((group) => [group.key, group]));

    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const key = `${selectedMonth}-${String(day).padStart(2, "0")}`;
        return { day, key, group: groupsByDate.get(key) };
      })
    ];
  }, [groupedSlots, selectedMonth]);

  function chooseDate(group: (typeof groupedSlots)[number]) {
    const firstSlot = group.slots.find((slot) => slot.available);
    if (!firstSlot) return;

    setSelectedDate(group.key);
    setSelectedSlotId(firstSlot.id);
  }

  function chooseMonth(nextMonthIndex: number) {
    const nextMonth = months[nextMonthIndex];
    if (!nextMonth) return;

    const firstAvailableDate = groupedSlots.find(
      (group) =>
        group.key.startsWith(nextMonth) && group.slots.some((slot) => slot.available)
    );
    setSelectedMonth(nextMonth);
    if (firstAvailableDate) {
      chooseDate(firstAvailableDate);
      return;
    }

    setSelectedDate("");
    setSelectedSlotId(0);
  }

  if (state.status === "success" && state.startsAt) {
    return (
      <section className="interview-apply-success" aria-live="polite">
        <CheckCircle2 size={34} aria-hidden="true" />
        <p className="eyebrow">APPLICATION COMPLETE</p>
        <h2>인터뷰 신청을 받았습니다.</h2>
        <div className="interview-apply-success__time">
          <CalendarCheck2 size={20} aria-hidden="true" />
          <strong>{fullDateTimeLabel(state.startsAt)}</strong>
        </div>
        {state.notificationStatus === "sent" && <p>선택한 일정과 안내 페이지를 카카오톡으로 보내드렸어요.</p>}
        {state.notificationStatus === "not_configured" && <p>예약은 저장됐습니다. 카카오 알림 연동 전이라 이 화면에서 일정을 확인해 주세요.</p>}
        {state.notificationStatus === "failed" && <p>예약은 저장됐지만 카카오 안내 전송이 지연되고 있습니다. 운영진이 다시 확인할게요.</p>}
        <div className="cta-actions">
          <Link href="/interview" className="button button--primary">인터뷰 안내 다시 보기</Link>
          <Link href="/" className="button button--ghost">READ ME 홈</Link>
        </div>
      </section>
    );
  }

  if (groupedSlots.length === 0) {
    return (
      <section className="interview-apply-empty">
        <CalendarCheck2 size={30} aria-hidden="true" />
        <h2>예약 가능한 일정을 준비하고 있어요.</h2>
        <p>새로운 인터뷰 일정이 열리면 이 페이지에서 날짜와 시간을 선택할 수 있습니다.</p>
        <Link href="/interview" className="button button--primary">인터뷰 안내로 돌아가기</Link>
      </section>
    );
  }

  return (
    <form action={formAction} className="interview-apply-form">
      <input type="hidden" name="slotId" value={selectedSlotId || ""} />

      <div className="interview-schedule-picker">
        <fieldset className="interview-apply-fieldset interview-date-fieldset">
          <legend><span>01</span> 날짜 선택</legend>
          <p>예약 가능한 날짜를 선택해 주세요.</p>
          <div className="interview-calendar">
            <div className="interview-calendar__header">
              <button
                type="button"
                aria-label="이전 달"
                disabled={selectedMonthIndex <= 0}
                onClick={() => chooseMonth(selectedMonthIndex - 1)}
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
              <strong aria-live="polite">
                {selectedMonth ? `${selectedMonth.slice(0, 4)}년 ${Number(selectedMonth.slice(5))}월` : ""}
              </strong>
              <button
                type="button"
                aria-label="다음 달"
                disabled={selectedMonthIndex < 0 || selectedMonthIndex >= months.length - 1}
                onClick={() => chooseMonth(selectedMonthIndex + 1)}
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="interview-calendar__weekdays" aria-hidden="true">
              {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="interview-calendar__days" role="grid" aria-label="예약 가능 날짜">
              {calendarDays.map((calendarDay, index) => {
                if (!calendarDay) return <span key={`blank-${index}`} className="interview-calendar__blank" aria-hidden="true" />;

                const { day, key, group } = calendarDay;
                const hasAvailableSlot = group?.slots.some((slot) => slot.available) ?? false;
                if (!group || !hasAvailableSlot) {
                  return <span key={key} className="interview-calendar__unavailable" aria-disabled="true">{day}</span>;
                }

                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    aria-label={dateLabel(group.slots[0].startsAt)}
                    aria-selected={selectedDate === key}
                    onClick={() => chooseDate(group)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="interview-apply-fieldset interview-time-fieldset">
          <legend><span>02</span> 시간 선택</legend>
          <p>
            {selectedDateGroup
              ? dateLabel(selectedDateGroup.slots[0].startsAt)
              : selectedMonthHasAvailable
                ? "날짜를 먼저 선택해 주세요."
                : "예약이 아직 열리지 않았어요."}
          </p>
          <div className="interview-time-grid">
            {selectedDateSlots.map((slot) => (
              <label key={slot.id}>
                <input
                  type="radio"
                  name="slotChoice"
                  value={slot.id}
                  checked={selectedSlotId === slot.id}
                  onChange={() => setSelectedSlotId(slot.id)}
                />
                <Clock3 size={15} aria-hidden="true" />
                <span>{timeLabel(slot.startsAt)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="interview-apply-fieldset interview-contact-fields">
        <legend><span>03</span> 신청자 정보</legend>
        <p>신청 확인과 일정 안내에만 사용합니다.</p>
        <label>
          이름
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={30}
            required
            placeholder="이름을 입력해 주세요"
          />
        </label>
        <label>
          전화번호
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            required
            placeholder="010-0000-0000"
          />
        </label>
      </fieldset>

      <label className="interview-privacy-consent">
        <input type="checkbox" name="privacyConsent" required />
        <span>입력한 이름과 전화번호를 인터뷰 예약 확인 및 카카오톡 안내에 사용하는 것에 동의합니다.</span>
      </label>

      {state.message && state.status === "error" && (
        <p role="alert" className="interview-apply-status">{state.message}</p>
      )}

      <button type="submit" className="button button--primary interview-apply-submit" disabled={pending || !selectedSlotId}>
        {pending ? "신청 중..." : "인터뷰 신청하기"}
      </button>
    </form>
  );
}
