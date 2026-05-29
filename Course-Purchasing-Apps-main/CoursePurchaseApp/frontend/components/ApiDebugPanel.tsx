"use client";

import { Bug, ChevronDown, ChevronUp, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  ApiDebugEntry,
  apiDebugEnabled,
  clearApiDebugEntries,
  subscribeApiDebug
} from "@/lib/api-debug";

function stringifyPreview(value: unknown) {
  if (value === undefined) {
    return "No response body";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ApiDebugPanel() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ApiDebugEntry[]>([]);

  useEffect(() => {
    if (!apiDebugEnabled) {
      return;
    }

    return subscribeApiDebug(setEntries);
  }, []);

  if (!apiDebugEnabled) {
    return null;
  }

  return (
    <>
      <button
        className="api-debug-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bug size={16} />
        Dev API
        <span className="api-debug-badge">{entries.length}</span>
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {open ? (
        <aside className="api-debug-panel">
          <div className="api-debug-header">
            <div>
              <strong>API Responses</strong>
              <p>Status code, preview, and error details for every API call.</p>
            </div>
            <div className="api-debug-actions">
              <button className="api-debug-action" onClick={clearApiDebugEntries} type="button">
                <RotateCcw size={14} />
                Clear
              </button>
              <button className="api-debug-action" onClick={() => setOpen(false)} type="button">
                <XCircle size={14} />
                Close
              </button>
            </div>
          </div>

          <div className="api-debug-list">
            {entries.length === 0 ? (
              <div className="api-debug-empty">No API calls yet. Use the app and logs will appear here.</div>
            ) : (
              entries.map((entry) => (
                <article className="api-debug-card" key={entry.id}>
                  <div className="api-debug-row">
                    <span className={`api-debug-status ${entry.ok ? "ok" : "error"}`}>
                      {entry.status}
                    </span>
                    <code>{entry.method}</code>
                    <code>{entry.path}</code>
                  </div>
                  <div className="api-debug-meta">
                    <span>{entry.createdAt}</span>
                    <span>{entry.durationMs} ms</span>
                  </div>
                  {entry.requestBody !== undefined ? (
                    <>
                      <strong className="api-debug-label">Request</strong>
                      <pre>{stringifyPreview(entry.requestBody)}</pre>
                    </>
                  ) : null}
                  <strong className="api-debug-label">{entry.ok ? "Response" : "Issue"}</strong>
                  <pre>{stringifyPreview(entry.responseBody)}</pre>
                </article>
              ))
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}
