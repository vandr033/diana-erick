"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type CountdownParts = {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const zero: CountdownParts = { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
const boliviaOffset = 4 * 60 * 60 * 1000;

function addMonthsClamped(date: Date, months: number) {
  const day = date.getUTCDate();
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function getCountdown(targetTime: number, nowTime: number): CountdownParts {
  if (targetTime <= nowTime) return zero;

  const now = new Date(nowTime - boliviaOffset);
  const target = new Date(targetTime - boliviaOffset);
  let months = (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + target.getUTCMonth() - now.getUTCMonth();
  let anchor = addMonthsClamped(now, months);

  if (anchor.getTime() > target.getTime()) {
    months -= 1;
    anchor = addMonthsClamped(now, months);
  }

  let remaining = target.getTime() - anchor.getTime();
  const days = Math.floor(remaining / 86_400_000);
  remaining -= days * 86_400_000;
  const hours = Math.floor(remaining / 3_600_000);
  remaining -= hours * 3_600_000;
  const minutes = Math.floor(remaining / 60_000);
  remaining -= minutes * 60_000;

  return { months, days, hours, minutes, seconds: Math.floor(remaining / 1000) };
}

export function LiveCountdown({ targetIso, eventName }: { targetIso: string; eventName: string }) {
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const targetTime = new Date(targetIso).getTime();
    const update = () => setCountdown(getCountdown(targetTime, Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  const values = countdown ? Object.values(countdown) : [0, 0, 0, 0, 0];

  return (
    <div className="countdown" role="timer" aria-live="off" aria-label={`Cuenta regresiva para ${eventName}`}>
      <Image
        src="/images/countdown-timer.png"
        alt=""
        width={1672}
        height={941}
        sizes="(max-width: 640px) calc(100vw - 32px), min(62vw, 920px)"
        className="countdown__backdrop"
      />
      <div className="countdown__values" aria-hidden="true">
        {values.map((value, index) => <span key={index}>{String(value).padStart(2, "0")}</span>)}
      </div>
      {countdown && (
        <span className="sr-only">
          {countdown.months} meses, {countdown.days} días, {countdown.hours} horas, {countdown.minutes} minutos y {countdown.seconds} segundos.
        </span>
      )}
    </div>
  );
}
