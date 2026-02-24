"use client";

import { useState } from "react";
import type { ConsumerFormData, CreditReportResponse } from "@/lib/types";
import SummaryDisplay from "./SummaryDisplay";

interface CreditReportFormProps {
  defaultValues: ConsumerFormData;
}

const FIELD_CONFIG: {
  key: keyof ConsumerFormData;
  label: string;
  placeholder?: string;
  colSpan?: string;
}[] = [
  { key: "firstName", label: "First Name", colSpan: "col-span-3" },
  { key: "lastName", label: "Last Name", colSpan: "col-span-3" },
  { key: "ssn", label: "SSN", placeholder: "123456789", colSpan: "col-span-6" },
  { key: "houseNumber", label: "House Number", colSpan: "col-span-2" },
  { key: "streetName", label: "Street Name", colSpan: "col-span-3" },
  { key: "streetType", label: "Type", placeholder: "ST", colSpan: "col-span-1" },
  { key: "city", label: "City", colSpan: "col-span-3" },
  { key: "state", label: "State", placeholder: "GA", colSpan: "col-span-1" },
  { key: "zip", label: "ZIP", colSpan: "col-span-2" },
];

export default function CreditReportForm({ defaultValues }: CreditReportFormProps) {
  const [form, setForm] = useState<ConsumerFormData>(defaultValues);
  const [result, setResult] = useState<CreditReportResponse>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof ConsumerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult({});

    try {
      const res = await fetch("/api/credit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: CreditReportResponse = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-6 gap-3">
          {FIELD_CONFIG.map(({ key, label, placeholder, colSpan }) => (
            <div key={key} className={colSpan ?? "col-span-6"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z"
              />
            </svg>
          )}
          {loading ? "Fetching…" : "Get Credit Report"}
        </button>
      </form>

      <SummaryDisplay summary={result.summary} error={result.error} />
    </div>
  );
}
