"use client";

import { useEffect, useState } from "react";

export default function SurprisePage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Get today's date in PST
    const now = new Date();
    const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const y = pst.getFullYear();
    const m = String(pst.getMonth() + 1).padStart(2, "0");
    const d = String(pst.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);

    // Fetch available dates
    fetch("/api/daily-surprise?list=true")
      .then((r) => r.json())
      .then((data) => setDates(data.dates || []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            🎁 每日惊喜
          </h1>
          {selectedDate && (
            <span
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                backgroundColor: "var(--surface-elevated)",
                padding: "4px 12px",
                borderRadius: "999px",
                border: "1px solid var(--border)",
              }}
            >
              {selectedDate}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: showHistory ? "var(--accent-soft)" : "var(--surface-elevated)",
            color: showHistory ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            transition: "all 150ms ease",
          }}
        >
          📅 {showHistory ? "关闭历史" : "查看历史"}
        </button>
      </div>

      {/* History panel */}
      {showHistory && dates.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "var(--surface-elevated)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: date === selectedDate ? "1px solid var(--accent)" : "1px solid var(--border)",
                backgroundColor: date === selectedDate ? "var(--accent-soft)" : "transparent",
                color: date === selectedDate ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: date === selectedDate ? 600 : 400,
                transition: "all 150ms ease",
              }}
            >
              {date}
            </button>
          ))}
        </div>
      )}

      {/* iframe */}
      <div
        style={{
          flex: 1,
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          backgroundColor: "#0a0a0a",
        }}
      >
        {selectedDate && (
          <iframe
            key={selectedDate}
            src={`/api/daily-surprise?date=${selectedDate}`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title={`每日惊喜 - ${selectedDate}`}
          />
        )}
      </div>
    </div>
  );
}
