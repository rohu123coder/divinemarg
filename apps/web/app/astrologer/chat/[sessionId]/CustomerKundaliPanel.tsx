"use client";

import { useEffect, useState } from "react";

interface KundaliData {
  ascendant: { rashi: string; rashiIndex?: number; degree: number; longitude?: number };
  moonSign: { rashi: string; rashiIndex?: number; degree: number };
  sunSign: { rashi: string; rashiIndex?: number; degree: number };
  nakshatra: { name: string; lord: string; pada: number };
  planets: Array<{ name: string; longitude: number; rashi: string; rashiIndex?: number }>;
  approximate: boolean;
}

interface CustomerKundaliResponse {
  hasDetails: boolean;
  customer: {
    name: string;
    dateOfBirth?: string;
    timeOfBirth?: string | null;
    placeName?: string | null;
    gender?: string | null;
  };
  kundali?: KundaliData;
  message?: string;
}

interface Props {
  sessionId: string;
  authToken: string;
  apiBase: string;
}

export default function CustomerKundaliPanel({ sessionId, authToken, apiBase }: Props) {
  const [data, setData] = useState<CustomerKundaliResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchKundali() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${apiBase}/api/astrologer/sessions/${sessionId}/customer-kundli`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed: ${res.status}`);
        }

        const json = (await res.json()) as CustomerKundaliResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (sessionId && authToken) {
      fetchKundali();
    }

    return () => {
      cancelled = true;
    };
  }, [sessionId, authToken, apiBase]);

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        Loading kundali...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!data) return null;

  if (!data.hasDetails) {
    return (
      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-2 font-semibold text-orange-900">
            🎂 Birth Details Required
          </h3>
          <p className="text-sm text-orange-800">
            {data.customer.name} ne abhi tak birth details share nahi ki hain.
          </p>
          <p className="mt-2 text-xs text-orange-700">
            Chat mein customer se DOB, time, aur place pucho.
          </p>
        </div>
      </div>
    );
  }

  const k = data.kundali!;
  const c = data.customer;

  return (
    <div className="space-y-3 overflow-y-auto p-4">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
        <h3 className="font-semibold text-purple-900">{c.name}</h3>
        <div className="mt-1 space-y-0.5 text-xs text-purple-700">
          {c.dateOfBirth && (
            <div>📅 {new Date(c.dateOfBirth).toLocaleDateString("en-IN")}</div>
          )}
          {c.timeOfBirth && <div>🕐 {c.timeOfBirth}</div>}
          {c.placeName && <div>📍 {c.placeName}</div>}
          {c.gender && <div>👤 {c.gender}</div>}
        </div>
        {k.approximate && (
          <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
            ⚠️ Time of birth missing — ascendant approximate
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SignCard
          label="Sun"
          emoji="☀️"
          rashi={k.sunSign.rashi}
          degree={k.sunSign.degree}
          color="orange"
        />
        <SignCard
          label="Moon"
          emoji="🌙"
          rashi={k.moonSign.rashi}
          degree={k.moonSign.degree}
          color="blue"
        />
        <SignCard
          label="Asc"
          emoji="⬆️"
          rashi={k.ascendant.rashi}
          degree={k.ascendant.degree}
          color="purple"
        />
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
        <div className="mb-1 text-xs text-indigo-700">⭐ Nakshatra</div>
        <div className="font-semibold text-indigo-900">{k.nakshatra.name}</div>
        <div className="mt-1 text-xs text-indigo-700">
          Lord: <span className="font-medium">{k.nakshatra.lord}</span> • Pada:{" "}
          {k.nakshatra.pada}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
          🪐 Planetary Positions
        </div>
        <table className="w-full text-xs">
          <tbody>
            {k.planets.map((p) => (
              <tr key={p.name} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-1.5 font-medium text-gray-900">{p.name}</td>
                <td className="px-3 py-1.5 text-gray-600">{p.rashi}</td>
                <td className="px-3 py-1.5 text-right text-gray-500">
                  {p.longitude.toFixed(2)}°
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-xs text-gray-500">
        🔮 Mahadasha details coming soon
      </div>
    </div>
  );
}

function SignCard({
  label,
  emoji,
  rashi,
  degree,
  color,
}: {
  label: string;
  emoji: string;
  rashi: string;
  degree: number;
  color: "orange" | "blue" | "purple";
}) {
  const colorClasses = {
    orange: "bg-orange-50 border-orange-200 text-orange-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg border p-2 text-center`}>
      <div className="text-lg">{emoji}</div>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="mt-0.5 text-xs font-semibold">{rashi}</div>
      <div className="text-[10px] opacity-60">{degree.toFixed(1)}°</div>
    </div>
  );
}
