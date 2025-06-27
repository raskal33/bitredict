"use client";

import Countdown from "react-countdown";

export default function LockPeriod() {
  return (
    <div
      className={`col-span-full flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-dark-2 p-4 xl:col-span-2`}
    >
      <h4 className={`text-center text-xl font-medium text-primary`}>
        Lock Period
      </h4>
      <p>Sep 24, 2021</p>
      <Countdown
        date={Date.now() + 120000000}
        zeroPadTime={2}
        zeroPadDays={2}
        renderer={({ days, hours, minutes, seconds }) => (
          <p className={`text-2xl font-semibold text-secondary`}>
            {String(days).padStart(2, "0")}:{String(hours).padStart(2, "0")}:
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </p>
        )}
      />
      <p>$20,000.00 BUSD</p>
    </div>
  );
}
