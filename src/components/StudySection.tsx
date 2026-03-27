"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, BookOpen, ExternalLink, RefreshCw } from "lucide-react";
import {
  studyDays,
  studyWeeks,
  dayDateMap,
  dateToDay,
  getFlatItems,
  type StudyDay,
  type StudyWeek,
} from "@/data/study-plan";

interface StudyCompletions {
  [key: string]: boolean;
}

const STUDY_PLAN_URL = "https://amazon-prep-site.vercel.app/";

function StudyTitleLink() {
  return (
    <a
      href={STUDY_PLAN_URL}
      target="_blank"
      rel="noreferrer"
      title="打开 Amazon Prep 学习站点"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        fontFamily: "var(--font-heading)",
        color: "var(--text-primary)",
        textDecoration: "none",
      }}
    >
      <span className="text-lg font-bold">📚 学习</span>
      <ExternalLink className="w-4 h-4" style={{ color: "var(--accent)" }} />
    </a>
  );
}

function getPSTDateStr(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export default function StudySection() {
  const [completions, setCompletions] = useState<StudyCompletions>({});
  const [loading, setLoading] = useState(true);
  const [togglingKeys, setTogglingKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const todayISO = useMemo(() => getPSTDateStr(), []);

  const todayDay: StudyDay | undefined = useMemo(() => {
    const dayNum = dateToDay[todayISO];
    if (dayNum === undefined) return undefined;
    return studyDays.find((d) => d.day === dayNum);
  }, [todayISO]);

  const todayWeek: StudyWeek | undefined = useMemo(() => {
    const dayNum = dateToDay[todayISO];
    if (dayNum === undefined) return undefined;
    const weekRanges: [number, number, number][] = [
      [1, 6, 1], [7, 12, 2], [13, 18, 3], [19, 24, 4], [25, 30, 5], [31, 35, 6],
    ];
    for (const [start, end, weekId] of weekRanges) {
      if (dayNum >= start && dayNum <= end) {
        return studyWeeks.find((w) => w.id === weekId);
      }
    }
    return undefined;
  }, [todayISO]);

  const flatItems = useMemo(() => {
    if (!todayDay) return [];
    return getFlatItems(todayDay);
  }, [todayDay]);

  const fetchCompletions = useCallback(async () => {
    try {
      const res = await fetch("/api/study");
      const data = await res.json();
      if (res.ok) {
        setCompletions(data.completions ?? {});
        setError("");
      } else {
        setError(data.error ?? "加载失败");
      }
    } catch {
      setError("无法加载学习进度");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompletions();
  }, [fetchCompletions]);

  // Auto-refresh on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        void fetchCompletions();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchCompletions]);

  const toggleItem = useCallback(async (key: string, nextCompleted: boolean) => {
    setTogglingKeys((prev) => ({ ...prev, [key]: true }));
    setError("");

    // Optimistic update
    setCompletions((prev) => {
      const next = { ...prev };
      if (nextCompleted) {
        next[key] = true;
      } else {
        delete next[key];
      }
      return next;
    });

    try {
      const res = await fetch("/api/study", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, completed: nextCompleted }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompletions(data.completions ?? {});
      } else {
        // Rollback
        setCompletions((prev) => {
          const next = { ...prev };
          if (nextCompleted) {
            delete next[key];
          } else {
            next[key] = true;
          }
          return next;
        });
        setError(data.error ?? "更新失败");
      }
    } catch {
      // Rollback
      setCompletions((prev) => {
        const next = { ...prev };
        if (nextCompleted) {
          delete next[key];
        } else {
          next[key] = true;
        }
        return next;
      });
      setError("网络错误");
    } finally {
      setTogglingKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  // Compute stats
  const completedCount = useMemo(
    () => flatItems.filter((item) => completions[item.key]).length,
    [flatItems, completions]
  );
  const totalCount = flatItems.length;

  // Overall progress across all days
  const overallStats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const day of studyDays) {
      const items = getFlatItems(day);
      total += items.length;
      done += items.filter((item) => completions[item.key]).length;
    }
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [completions]);

  // Before course starts or after it ends
  if (!todayDay) {
    const firstDate = dayDateMap[1];
    const lastDate = dayDateMap[35];
    const isBeforeStart = todayISO < firstDate;

    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <StudyTitleLink />
          </div>
        </div>
        <div className="p-5">
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {isBeforeStart
              ? `🚀 学习计划将于 ${firstDate} 开始，准备好了吗？`
              : `🎓 学习计划已完成！总进度：${overallStats.done}/${overallStats.total}`}
          </p>
        </div>
      </div>
    );
  }

  // Rest day
  if (todayDay.rest) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <StudyTitleLink />
          </div>
          {todayWeek && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Week {todayWeek.id} · {todayWeek.theme}
            </span>
          )}
        </div>
        <div className="p-5">
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
          >
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-medium" style={{ color: "var(--text-primary)", fontSize: "15px" }}>
                今天是休息日！
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                好好充电，{todayDay.weekday}继续冲 💪
              </p>
            </div>
          </div>
          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span>总进度</span>
              <span>{overallStats.pct}%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--card-elevated)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${overallStats.pct}%`,
                  background: "linear-gradient(90deg, #34C759, #30D158)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal study day
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="accent-line" />
          <StudyTitleLink />
        </div>
        <div className="flex items-center gap-3">
          {todayWeek && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Week {todayWeek.id}
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {completedCount === totalCount && totalCount > 0 ? "🎉 " : ""}
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Day title */}
      <div
        className="px-5 pt-4 pb-2 flex items-center gap-2"
      >
        <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Day {todayDay.day} · {todayDay.title}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {todayDay.weekday}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--card-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              background: completedCount === totalCount && totalCount > 0
                ? "linear-gradient(90deg, #34C759, #30D158)"
                : "linear-gradient(90deg, #FF9500, #FF9F0A)",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 pb-2">
          <p className="text-xs" style={{ color: "#FF453A" }}>{error}</p>
        </div>
      )}

      {/* Task list */}
      <div className="px-5 pb-5 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>加载中...</span>
          </div>
        ) : (
          <>
            {/* Group by section */}
            {todayDay.sections?.map((section) => {
              const sectionItems = flatItems.filter(
                (item) => item.sectionTitle === section.title && item.sectionIcon === section.icon
              );
              if (sectionItems.length === 0) return null;

              return (
                <div key={`${section.icon}-${section.title}`}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <span className="text-sm">{section.icon}</span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)", letterSpacing: "0.02em" }}
                    >
                      {section.title}
                    </span>
                    {section.exercise && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "rgba(255,149,0,0.12)",
                          color: "#FF9500",
                        }}
                      >
                        挑战
                      </span>
                    )}
                  </div>
                  {/* Items */}
                  <div className="space-y-1.5">
                    {sectionItems.map((item) => {
                      const isCompleted = Boolean(completions[item.key]);
                      const isToggling = Boolean(togglingKeys[item.key]);

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => void toggleItem(item.key, !isCompleted)}
                          disabled={isToggling}
                          className="w-full flex items-start gap-3 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer group"
                          style={{
                            backgroundColor: isCompleted
                              ? "rgba(52,199,89,0.06)"
                              : "var(--card-elevated)",
                            border: `1px solid ${isCompleted ? "rgba(52,199,89,0.15)" : "var(--border)"}`,
                            padding: "0.75rem",
                            opacity: isToggling ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isToggling) {
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                              e.currentTarget.style.borderColor = isCompleted ? "rgba(52,199,89,0.35)" : "var(--accent)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = isCompleted ? "rgba(52,199,89,0.15)" : "var(--border)";
                          }}
                        >
                          {/* Checkbox */}
                          <div className="mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                            {isToggling ? (
                              <RefreshCw
                                className="w-[18px] h-[18px] animate-spin"
                                style={{ color: "var(--text-muted)" }}
                              />
                            ) : isCompleted ? (
                              <CheckCircle2
                                className="w-[18px] h-[18px]"
                                style={{ color: "#34C759" }}
                              />
                            ) : (
                              <Circle
                                className="w-[18px] h-[18px]"
                                style={{ color: "var(--text-muted)" }}
                              />
                            )}
                          </div>
                          {/* Text */}
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-sm leading-relaxed ${isCompleted ? "line-through" : ""}`}
                              style={{
                                color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                              }}
                            >
                              {item.text}
                            </span>
                            {item.sub && (
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "var(--text-muted)", opacity: 0.7 }}
                              >
                                {item.sub}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Output note */}
                  {section.output && (
                    <p
                      className="text-xs mt-2 ml-8"
                      style={{ color: "var(--positive)", opacity: 0.8 }}
                    >
                      {section.output}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Overall progress */}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                <span>总进度 · Day {todayDay.day}/35</span>
                <span>{overallStats.pct}%</span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--card-elevated)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${overallStats.pct}%`,
                    background: "linear-gradient(90deg, #5856D6, #AF52DE)",
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
