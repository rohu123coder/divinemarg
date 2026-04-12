"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import api from "@/lib/api";

const KEYS = {
  platformName: "platform_name",
  commissionPct: "commission_percentage",
  minRecharge: "minimum_recharge_amount",
  supportPhone: "support_phone",
} as const;

type FormVals = {
  platformName: string;
  commissionPct: string;
  minRecharge: string;
  supportPhone: string;
};

export default function SettingsPage() {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormVals>({
    defaultValues: {
      platformName: "",
      commissionPct: "",
      minRecharge: "",
      supportPhone: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data: { settings: Record<string, string | null> };
        }>("/api/admin/settings");
        if (cancelled || !res.data.success) return;
        const s = res.data.data.settings;
        reset({
          platformName: s[KEYS.platformName] ?? "",
          commissionPct: s[KEYS.commissionPct] ?? "",
          minRecharge: s[KEYS.minRecharge] ?? "",
          supportPhone: s[KEYS.supportPhone] ?? "",
        });
      } catch {
        if (!cancelled) setLoadError("Could not load settings");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  async function onSubmit(values: FormVals) {
    setLoadError(null);
    const commissionNum = Number(values.commissionPct);
    if (
      values.commissionPct !== "" &&
      (Number.isNaN(commissionNum) ||
        commissionNum < 0 ||
        commissionNum > 100)
    ) {
      setLoadError("Commission must be between 0 and 100");
      return;
    }
    try {
      await api.put("/api/admin/settings", {
        [KEYS.platformName]: values.platformName || null,
        [KEYS.commissionPct]: values.commissionPct || null,
        [KEYS.minRecharge]: values.minRecharge || null,
        [KEYS.supportPhone]: values.supportPhone || null,
      });
      setSaved(true);
    } catch {
      setLoadError("Save failed");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Platform-wide configuration</p>
      </div>

      {loadError ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {saved ? (
        <div
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          Settings saved successfully.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Platform name
          </label>
          <p className="text-xs text-slate-500">Shown for white-label branding</p>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            {...register("platformName")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Commission percentage
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            {...register("commissionPct")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Minimum recharge amount (INR)
          </label>
          <input
            type="number"
            min={0}
            step="1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            {...register("minRecharge")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Support phone number
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            {...register("supportPhone")}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
