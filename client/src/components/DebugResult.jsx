import { useState } from "react";
import IssueCard from "./IssueCard.jsx";

const SCORE_COLOR = (score) => {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
};

const SCORE_LABEL = (score) => {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Critical";
};

export default function DebugResult({ result }) {
  const [showFullCode, setShowFullCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const issueCount = result.issues?.length || 0;

  const copyCode = () => {
    navigator.clipboard.writeText(result.full_fixed_code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityCounts = (result.issues || []).reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-100 mb-1">Analysis Complete</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{result.summary}</p>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-3xl font-bold ${SCORE_COLOR(result.quality_score)}`}>
              {result.quality_score}
              <span className="text-lg text-gray-500">/10</span>
            </div>
            <div className={`text-xs font-medium ${SCORE_COLOR(result.quality_score)}`}>
              {SCORE_LABEL(result.quality_score)}
            </div>
          </div>
        </div>

        {/* Severity breakdown */}
        {issueCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700/50">
            <span className="text-xs text-gray-500">{issueCount} issue{issueCount !== 1 ? "s" : ""} found:</span>
            {severityCounts.critical > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700">
                {severityCounts.critical} critical
              </span>
            )}
            {severityCounts.high > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-900/50 text-orange-300 border border-orange-700">
                {severityCounts.high} high
              </span>
            )}
            {severityCounts.medium > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                {severityCounts.medium} medium
              </span>
            )}
            {severityCounts.low > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700">
                {severityCounts.low} low
              </span>
            )}
            {severityCounts.info > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 border border-gray-600">
                {severityCounts.info} info
              </span>
            )}
          </div>
        )}

        {issueCount === 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
            <span className="text-green-400 text-lg">✓</span>
            <span className="text-sm text-green-400">No issues found — code looks clean!</span>
          </div>
        )}
      </div>

      {/* Issues list */}
      {issueCount > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Issues
          </h3>
          <div className="space-y-3">
            {result.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {result.explanation && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Explanation
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">{result.explanation}</p>
        </div>
      )}

      {/* Full fixed code */}
      {result.full_fixed_code && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Fixed Code
            </h3>
            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setShowFullCode(!showFullCode)}
                className="text-xs px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white transition-colors"
              >
                {showFullCode ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {showFullCode && (
            <pre className="p-4 text-xs text-green-300 overflow-x-auto scrollbar-thin max-h-96 whitespace-pre-wrap">
              {result.full_fixed_code}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
