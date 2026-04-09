"use client";

import { useState } from "react";

type OtpRevealProps = {
  code: string;
};

export function OtpReveal({ code }: OtpRevealProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mt-4 rounded-[1.5rem] border border-amber-300 bg-[linear-gradient(180deg,#fff9e8,#fff5d2)] px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">OTP Detected</p>
          <p className="mt-2 text-sm text-amber-900">
            Click the button only when you want to view the code.
          </p>
        </div>
        <button
          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Hide OTP" : "Show OTP"}
        </button>
      </div>

      {visible ? (
        <p className="mt-4 font-mono text-2xl font-semibold tracking-[0.34em] text-amber-900">
          {code}
        </p>
      ) : null}
    </div>
  );
}
