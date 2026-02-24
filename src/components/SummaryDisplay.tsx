"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface SummaryDisplayProps {
  summary?: string;
  error?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-semibold text-slate-800 mt-6 mb-2 pb-1 border-b border-slate-200">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-slate-800 mt-6 mb-2 pb-1 border-b border-slate-200">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-700 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ul className="mb-3 space-y-1">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-sm text-slate-700 leading-relaxed">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
  hr: () => <hr className="border-slate-200 my-4" />,
};

export default function SummaryDisplay({ summary, error }: SummaryDisplayProps) {
  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-semibold text-sm">Error</p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{error}</p>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-800 px-5 py-3">
          <p className="text-sm font-semibold text-white tracking-wide">Credit Report Summary</p>
        </div>
        <div className="px-5 py-4">
          <ReactMarkdown components={components}>{summary}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return null;
}
