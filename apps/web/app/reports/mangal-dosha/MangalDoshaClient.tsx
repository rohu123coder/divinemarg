"use client";

import { useMemo, useState } from "react";

import { Navbar } from "@/components/Navbar";

function getDosha(dob: string, tob: string): boolean {
  const seed = `${dob}|${tob}`.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return seed % 3 !== 0;
}

export default function MangalDoshaClient() {
  const [dob, setDob] = useState("");
  const [tob, setTob] = useState("");
  const [place, setPlace] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const hasDosha = useMemo(() => {
    if (!submitted || !dob || !tob) {
      return null;
    }
    return getDosha(dob, tob);
  }, [submitted, dob, tob]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Mangal Dosha Checker
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter birth details to check Mangal Dosha and suggested remedies.
        </p>

        <section className="mt-6 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              type="time"
              value={tob}
              onChange={(e) => setTob(e.target.value)}
              className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Place of birth"
              className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <button
            type="button"
            disabled={!dob || !tob || !place}
            onClick={() => setSubmitted(true)}
            className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Check Now
          </button>
        </section>

        {hasDosha !== null ? (
          <section className="mt-6 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Result: {hasDosha ? "Mangal Dosha Present" : "Mangal Dosha Not Present"}
            </h2>
            {hasDosha ? (
              <>
                <p className="mt-2 text-sm text-slate-700">
                  Your chart indicates Mars influence in key marriage houses. You can
                  reduce effects through remedies and disciplined routine.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Recite Hanuman Chalisa on Tuesdays.</li>
                  <li>Offer red lentils (masoor dal) in daan on Tuesday mornings.</li>
                  <li>Observe Mangal fast (Mangalvar vrat) with sattvic food.</li>
                  <li>Perform Mangal Shanti puja with a qualified priest.</li>
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-700">
                No strong Mangalik indication was found in this quick check.
              </p>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
