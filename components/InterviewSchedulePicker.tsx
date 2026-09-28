"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import type { InterviewSlot } from "@/lib/interview/slots";

const timeZone = "Asia/Seoul";
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

// 서버(Node)와 브라우저의 로케일 데이터가 달라도 같은 문자열이 나오도록,
// 로케일 포맷에 맡기지 않고 숫자만 뽑아 직접 조합한다. (예: 서버 "PM 6:00" vs 브라우저 "오후 6:00" 불일치 방지)
const seoulPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric"
});

function seoulParts(startsAt: string) {
  const parts = seoulPartsFormatter.formatToParts(new Date(startsAt));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const year = read("year");
  const month = read("month");
  const day = read("day");
  const hour = read("hour");
  const minute = read("minute");
  const weekday = weekdayLabels[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { year, month, day, hour, minute, weekday };
}

const pad = (value: number) => String(value).padStart(2, "0");

function dateKey(startsAt: string) {
  const { year, month, day } = seoulParts(startsAt);
  return `${year}-${pad(month)}-${pad(day)}`;
}

function dateLabel(startsAt: string) {
  const { month, day, weekday } = seoulParts(startsAt);
  return `${month}월 ${day}일 (${weekday})`;
}

function timeLabel(startsAt: string) {
  const { hour, minute } = seoulParts(startsAt);
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${pad(minute)}`;
}


export function InterviewSchedulePicker({ slots, disabled = false }: { slots: InterviewSlot[]; disabled?: boolean }) {
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, InterviewSlot[]>();

    for (const slot of slots) {
      const key = dateKey(slot.startsAt);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }

    return [...groups.entries()].map(([key, dateSlots]) => ({ key, slots: dateSlots }));
  }, [slots]);

  const firstAvailableGroup = groupedSlots.find((group) =>
    group.slots.some((slot) => slot.available)
  );
  const months = useMemo(() => {
    const allMonths = [...new Set(groupedSlots.map((group) => group.key.slice(0, 7)))];
    const firstOpenMonth = firstAvailableGroup?.key.slice(0, 7);
    const firstOpenIndex = firstOpenMonth ? allMonths.indexOf(firstOpenMonth) : -1;
    return firstOpenIndex > 0 ? allMonths.slice(firstOpenIndex) : allMonths;
  }, [groupedSlots, firstAvailableGroup]);
  const firstAvailableSlot = firstAvailableGroup?.slots.find((slot) => slot.available);
  const [selectedDate, setSelectedDate] = useState(firstAvailableGroup?.key ?? "");
  const [selectedMonth, setSelectedMonth] = useState(firstAvailableGroup?.key.slice(0, 7) ?? months[0] ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState(firstAvailableSlot?.id ?? 0);
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


  const currentSlotId = selectedDateSlots.find((slot) => slot.id === selectedSlotId)?.id ?? selectedDateSlots[0]?.id ?? 0;
  return <>
    <input type="hidden" name="slotId" value={currentSlotId || ""} />
      <div className="interview-schedule-picker">
        <fieldset className="interview-apply-fieldset interview-date-fieldset" disabled={disabled}>
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

        <fieldset className="interview-apply-fieldset interview-time-fieldset" disabled={disabled}>
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
                  checked={currentSlotId === slot.id}
                  onChange={() => setSelectedSlotId(slot.id)}
                />
                <Clock3 size={15} aria-hidden="true" />
                <span>{timeLabel(slot.startsAt)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

  </>;
}
