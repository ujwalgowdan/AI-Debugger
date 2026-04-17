import { useState } from "react";

const SEVERITY_STYLES = {
  critical: "bg-red-900/40 border-red-500 text-red-300",
  high: "bg-orange-900/40 border-orange-500 text-orange-300",
  medium: "bg-yellow-900/40 border-yellow-500 text-yellow-300",
  low: "bg-blue-900/40 border-blue-500 text-blue-300",
  info: "bg-gray-800/60 border-gray-600 text-gray-300",
};

const SEVERITY_BADGES = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-600 text-white",
  medium: "bg-yellow-600 text-black",
  low: "bg-blue-600 text-white",
  info: "bg-gray-600 text-white",
};

const TYPE_ICONS = {
  syntax: "{ }",
  logic: "⚙",
  runtime: "💥",
  security: "🔒",
  performance: "⚡",
  style: "✦",
};

export default function IssueCard({ issue }) {
  const [showFix, setShowFix] = useState(false);
  const severityStyle = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.info;
  const badgeStyle = SEVERITY_BADGES[issue.severity] || SEVERITY_BADGES.info;

  return (
    <div className={`border rounded-lg p-4 ${severityStyle}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${badgeStyle}`}>
            {issue.severity}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-700/60 text-gray-300 border border-gray-600">
            {TYPE_ICONS[issue.type] || "•"} {issue.type}
          </span>
          {issue.line_hint && (
            <span className="text-xs text-gray-400 font-mono">
              Line {issue.line_hint}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 shrink-0">#{issue.id}</span>
      </div>

      <h3 className="font-semibold text-sm mb-1">{issue.title}</h3>
      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{issue.description}</p>

      <div className="text-sm text-gray-400 mb-3">
        <span className="font-medium text-gray-300">Fix: </span>
        {issue.fix}
      </div>

      <button
        onClick={() => setShowFix(!showFix)}
        className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
      >
        {showFix ? "Hide fixed code" : "Show fixed code"}
      </button>

      {showFix && issue.fixed_code && (
        <pre className="mt-3 p-3 bg-gray-950/60 rounded text-xs text-green-300 overflow-x-auto scrollbar-thin whitespace-pre-wrap">
          {issue.fixed_code}
        </pre>
      )}
    </div>
  );
}
