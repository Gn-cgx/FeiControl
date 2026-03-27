"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Pause,
  Pencil,
  Play,
  Save,
  Trash2,
  X,
} from "lucide-react";

export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  schedule: string | Record<string, unknown>;
  sessionTarget?: string;
  sessionTargetLabel?: string;
  sessionTargetDescription?: string;
  payload?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
  deliverySummary?: string;
  state?: Record<string, unknown>;
  description?: string;
  detailsText?: string;
  scheduleDisplay?: string;
  timezone?: string;
  nextRun?: string | null;
  nextRunAtMs?: number | null;
  lastRun?: string | null;
  lastRunAtMs?: number | null;
  recurrenceKind?: "once" | "recurring" | "interval" | "unknown";
  recurrenceLabel?: string;
  scheduleKind?: string | null;
  isRecruitingTask?: boolean;
  recruitingHint?: string | null;
  lastRunStatus?: string | null;
  lastDurationMs?: number | null;
  lastError?: string | null;
  consecutiveErrors?: number;
  lastDeliveryStatus?: string | null;
  hasIssue?: boolean;
}

interface CronJobCardProps {
  job: CronJob;
  onToggle: (id: string, enabled: boolean) => void;
  onSavePrompt: (id: string, prompt: string) => Promise<void>;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
}

const AGENT_EMOJIS: Record<string, string> = {
  main: "🤖",
  academic: "🎓",
  infra: "🔧",
  studio: "🎬",
  social: "📱",
  linkedin: "💼",
  freelance: "💼",
  codev: "💻",
  arch: "🏗️",
  baiwan: "📣",
  teacher: "👩‍🏫",
};

const AGENT_NAMES: Record<string, string> = {
  main: "Main",
  academic: "Academic",
  infra: "Infra",
  studio: "Studio",
  social: "Social",
  linkedin: "LinkedIn",
  freelance: "Freelance",
  codev: "Developer",
  arch: "Architect",
  baiwan: "Content",
  teacher: "Teacher",
};

type Tone = "neutral" | "accent" | "success" | "warning" | "error";

interface HealthMeta {
  label: string;
  tone: Tone;
  detailLine: string;
  timestampLabel: string;
}

function getAgentEmoji(agentId: string): string {
  return AGENT_EMOJIS[agentId] || "🤖";
}

function getAgentDisplayName(agentId: string): string {
  return AGENT_NAMES[agentId] || agentId;
}

function formatPrimaryDate(dateString: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatFullDate(dateString: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatRelativeTime(dateString: string): string {
  const diffMs = new Date(dateString).getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const units = [
    { size: 24 * 60 * 60 * 1000, label: "天" },
    { size: 60 * 60 * 1000, label: "小时" },
    { size: 60 * 1000, label: "分钟" },
  ];

  for (const unit of units) {
    if (absMs >= unit.size) {
      const value = Math.round(absMs / unit.size);
      return diffMs >= 0 ? `${value}${unit.label}后` : `${value}${unit.label}前`;
    }
  }

  return diffMs >= 0 ? "即将执行" : "刚刚执行";
}

function formatDuration(durationMs?: number | null): string {
  if (typeof durationMs !== "number" || Number.isNaN(durationMs)) {
    return "—";
  }
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${(durationMs / 60000).toFixed(1)}m`;
}

function getToneStyles(tone: Tone): CSSProperties {
  switch (tone) {
    case "accent":
      return {
        color: "var(--accent)",
        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
      };
    case "success":
      return {
        color: "var(--success)",
        backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
      };
    case "warning":
      return {
        color: "var(--warning)",
        backgroundColor: "color-mix(in srgb, var(--warning) 14%, transparent)",
        border: "1px solid color-mix(in srgb, var(--warning) 32%, transparent)",
      };
    case "error":
      return {
        color: "var(--error)",
        backgroundColor: "color-mix(in srgb, var(--error) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
      };
    default:
      return {
        color: "var(--text-secondary)",
        backgroundColor: "var(--card-elevated)",
        border: "1px solid var(--border)",
      };
  }
}

function getHealthMeta(job: CronJob): HealthMeta {
  const consecutiveErrors = job.consecutiveErrors ?? 0;

  if (!job.lastRun) {
    return {
      label: "还没有运行记录",
      tone: "neutral",
      detailLine: "第一次运行后会显示结果。",
      timestampLabel: "尚未执行",
    };
  }

  if (job.hasIssue || job.lastRunStatus === "error") {
    return {
      label: "最近运行异常",
      tone: "error",
      detailLine:
        consecutiveErrors > 1
          ? `已连续失败 ${consecutiveErrors} 次`
          : job.lastError?.trim() || "请展开查看详情。",
      timestampLabel: formatFullDate(job.lastRun),
    };
  }

  if (job.lastRunStatus === "ok") {
    return {
      label: "最近运行正常",
      tone: "success",
      detailLine: `耗时 ${formatDuration(job.lastDurationMs)}`,
      timestampLabel: formatFullDate(job.lastRun),
    };
  }

  return {
    label: `最近运行：${job.lastRunStatus || "unknown"}`,
    tone: "neutral",
    detailLine: `耗时 ${formatDuration(job.lastDurationMs)}`,
    timestampLabel: formatFullDate(job.lastRun),
  };
}

function getTimeMeta(job: CronJob): { label: string; value: string; hint: string } {
  if (job.nextRun) {
    return {
      label: job.recurrenceKind === "once" ? "执行时间" : "下次运行",
      value: formatPrimaryDate(job.nextRun),
      hint: formatRelativeTime(job.nextRun),
    };
  }

  if (job.recurrenceKind === "once" && job.lastRun) {
    return {
      label: "已执行",
      value: formatPrimaryDate(job.lastRun),
      hint: "这是一条一次性任务。",
    };
  }

  return {
    label: "时间信息",
    value: "暂无排期",
    hint: "请检查调度配置。",
  };
}

function getStatusIcon(tone: Tone) {
  return tone === "error" ? AlertTriangle : tone === "success" ? CheckCircle2 : Clock3;
}

function MetaPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      style={{
        ...getToneStyles(tone),
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.22rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "0.72rem",
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4
      style={{
        fontSize: "0.9rem",
        fontWeight: 800,
        color: "var(--text-primary)",
        margin: 0,
      }}
    >
      {children}
    </h4>
  );
}

export function CronJobCard({
  job,
  onToggle,
  onSavePrompt,
  onDelete,
  onRun,
}: CronJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(job.detailsText?.trim() || "");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  const health = useMemo(() => getHealthMeta(job), [job]);
  const timing = useMemo(() => getTimeMeta(job), [job]);
  const StatusIcon = getStatusIcon(health.tone);
  const promptText = job.detailsText?.trim() || job.description || "";

  useEffect(() => {
    if (!isEditingPrompt) {
      setDraftPrompt(promptText);
    }
  }, [promptText, isEditingPrompt]);

  const handlePromptSave = async () => {
    const trimmedPrompt = draftPrompt.trim();
    if (!trimmedPrompt || trimmedPrompt === promptText) {
      setIsEditingPrompt(false);
      setDraftPrompt(promptText);
      return;
    }

    setIsSavingPrompt(true);
    try {
      await onSavePrompt(job.id, trimmedPrompt);
      setIsEditingPrompt(false);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: `1px solid ${job.hasIssue ? "color-mix(in srgb, var(--error) 22%, var(--border))" : "var(--border)"}`,
        borderRadius: "1rem",
        padding: "0.95rem",
        boxShadow: job.hasIssue ? "0 0 0 1px color-mix(in srgb, var(--error) 14%, transparent)" : "none",
        minHeight: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.85rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{getAgentEmoji(job.agentId)}</span>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                fontFamily: "var(--font-heading)",
              }}
            >
              {job.name}
            </h3>
            <MetaPill tone="neutral">
              {getAgentEmoji(job.agentId)} {getAgentDisplayName(job.agentId)}
            </MetaPill>
            {job.isRecruitingTask && <MetaPill tone="accent">Recruiting</MetaPill>}
            <MetaPill tone={job.recurrenceKind === "once" ? "neutral" : "success"}>
              {job.recurrenceLabel || "未分类"}
            </MetaPill>
            {!job.enabled && <MetaPill tone="warning">已暂停</MetaPill>}
          </div>
        </div>

        <button
          onClick={() => onToggle(job.id, !job.enabled)}
          style={{
            ...getToneStyles(job.enabled ? "success" : "warning"),
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.7rem",
            borderRadius: "9999px",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {job.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {job.enabled ? "启用中" : "已暂停"}
        </button>
      </div>

      <div
        style={{
          marginTop: "0.85rem",
          padding: "0.8rem 0.85rem",
          borderRadius: "0.85rem",
          backgroundColor: "var(--card-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "0.7rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--accent)",
                fontWeight: 700,
                marginBottom: "0.25rem",
              }}
            >
              {timing.label}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {timing.value}
            </div>
            <div style={{ marginTop: "0.25rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
              {timing.hint}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.55rem",
              color: getToneStyles(health.tone).color,
            }}
          >
            <StatusIcon className="w-4 h-4" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: 800 }}>{health.label}</div>
              <div style={{ marginTop: "0.18rem", color: "var(--text-primary)", fontSize: "0.78rem", fontWeight: 600 }}>
                {health.timestampLabel}
              </div>
              <div style={{ marginTop: "0.18rem", color: "var(--text-secondary)", fontSize: "0.76rem", lineHeight: 1.45 }}>
                {health.detailLine}
              </div>
            </div>
          </div>
        </div>

        {job.scheduleDisplay && (
          <div
            style={{
              marginTop: "0.65rem",
              padding: "0.38rem 0.55rem",
              borderRadius: "0.6rem",
              backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)",
              color: "var(--text-secondary)",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono, monospace)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={job.scheduleDisplay}
          >
            {job.scheduleDisplay}
          </div>
        )}
      </div>

      {job.hasIssue && (
        <div
          style={{
            display: "flex",
            gap: "0.65rem",
            alignItems: "flex-start",
            marginTop: "0.8rem",
            padding: "0.75rem 0.85rem",
            borderRadius: "0.85rem",
            backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--error) 28%, transparent)",
          }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: "var(--error)", marginTop: "0.1rem", flexShrink: 0 }} />
          <div>
            <div style={{ color: "var(--error)", fontSize: "0.8rem", fontWeight: 800 }}>Bug / 异常提醒</div>
            <div style={{ color: "var(--text-primary)", fontSize: "0.76rem", lineHeight: 1.5, marginTop: "0.2rem" }}>
              {job.lastError?.trim() || "最近一次执行异常。"}
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div
          style={{
            marginTop: "0.85rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <section
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.9rem",
              padding: "0.95rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <SectionTitle>任务 Prompt</SectionTitle>
              {!isEditingPrompt ? (
                <button
                  onClick={() => setIsEditingPrompt(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.65rem",
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  编辑 Prompt
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                  <button
                    onClick={handlePromptSave}
                    disabled={isSavingPrompt}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.65rem",
                      backgroundColor: "var(--accent)",
                      border: "none",
                      color: "white",
                      cursor: isSavingPrompt ? "wait" : "pointer",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      opacity: isSavingPrompt ? 0.7 : 1,
                    }}
                  >
                    <Save className="w-4 h-4" />
                    {isSavingPrompt ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => {
                      setDraftPrompt(promptText);
                      setIsEditingPrompt(false);
                    }}
                    disabled={isSavingPrompt}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.65rem",
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      cursor: isSavingPrompt ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
                    <X className="w-4 h-4" />
                    取消
                  </button>
                </div>
              )}
            </div>

            {isEditingPrompt ? (
              <textarea
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                rows={12}
                style={{
                  width: "100%",
                  resize: "vertical",
                  minHeight: "220px",
                  padding: "0.85rem 0.95rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--text-primary)",
                  fontSize: "0.86rem",
                  lineHeight: 1.6,
                  outline: "none",
                }}
              />
            ) : (
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: "0.86rem",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {promptText || "暂无 prompt。"}
              </div>
            )}
          </section>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          alignItems: "center",
          marginTop: "0.85rem",
          paddingTop: "0.85rem",
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.55rem 0.8rem",
            backgroundColor: "var(--card-elevated)",
            color: "var(--text-primary)",
            borderRadius: "0.7rem",
            border: "1px solid var(--border)",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "收起详情" : "查看详情"}
        </button>

        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
          <button
            onClick={() => onRun(job.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 0.8rem",
              backgroundColor: "var(--accent)",
              color: "white",
              borderRadius: "0.7rem",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Play className="w-4 h-4" />
            立即运行
          </button>

          <button
            onClick={() => {
              setExpanded(true);
              setIsEditingPrompt(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 0.8rem",
              backgroundColor: "var(--card-elevated)",
              color: "var(--text-primary)",
              borderRadius: "0.7rem",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={() => onDelete(job.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 0.8rem",
              backgroundColor: "transparent",
              color: "var(--error)",
              borderRadius: "0.7rem",
              border: "1px solid color-mix(in srgb, var(--error) 35%, transparent)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
