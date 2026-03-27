"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  CheckCircle,
  XCircle,
  Circle,
  Bot,
  Heart,
  Sparkles,
  Server,
  Cpu,
  HardDrive,
  Clock,
  Brain,
  Puzzle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role?: string;
  model: string;
  status: "online" | "offline";
}

interface OfficeAgent {
  id: string;
  name: string;
  model: string;
  currentTask: string;
  isActive: boolean;
  status: "working" | "idle" | "sleeping";
  lastSeen: number;
}

interface SystemStats {
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
}

interface CronJob {
  name: string;
  enabled: boolean;
  lastRun: string | null;
  didRunToday: boolean;
  failures: number;
}

interface DashboardData {
  cron: {
    jobs: CronJob[];
    totalJobs: number;
    ranToday: number;
    totalRuns: number;
    totalFailures: number;
  };
  yesterdayMemory: {
    requestedDate?: string;
    date: string;
    available: boolean;
    isFallback?: boolean;
    sections: Array<{ title: string; items: string[] }>;
  };
  evolution: {
    morningBriefDate: string | null;
    lastSignalCollection: string | null;
    lastReview: string | null;
    improvements: Array<{ title: string; priority: string }>;
    recommendations: Array<{ name: string; type: string }>;
    todayGaps: number;
    installedSkills: string[];
    skillCount: number;
  };
}

function ProgressRing({ value, max, color, size = 48 }: { value: number; max: number; color: string; size?: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-elevated)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="var(--text-primary)" fontSize="11" fontWeight="bold" className="rotate-90" style={{ transformOrigin: "center" }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 6) return { text: "深夜了，注意休息", emoji: "🌙" };
  if (h < 9) return { text: "早安！新的一天开始了", emoji: "🌅" };
  if (h < 12) return { text: "上午好！效率满满", emoji: "☀️" };
  if (h < 14) return { text: "午安！记得吃饭哦", emoji: "🍱" };
  if (h < 18) return { text: "下午好！继续加油", emoji: "💪" };
  if (h < 21) return { text: "傍晚好！辛苦一天了", emoji: "🌇" };
  return { text: "晚安！今天也很棒", emoji: "🌃" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

const PRIORITY_COLORS: Record<string, string> = { "高": "#ef4444", "中": "#f59e0b", "低": "#60a5fa" };

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [officeAgents, setOfficeAgents] = useState<Record<string, OfficeAgent>>({});
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllCron, setShowAllCron] = useState(false);
  const [gatewayUp, setGatewayUp] = useState<boolean | null>(null);
  const [gatewayLatency, setGatewayLatency] = useState<number | null>(null);

  // One-time fetch for static data (agents config, system stats, dashboard)
  useEffect(() => {
    Promise.all([
      fetch("/api/agents").then((r) => r.json()).catch(() => ({ agents: [] })),
      fetch("/api/system/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/dashboard").then((r) => r.json()).catch(() => null),
    ]).then(([agentsData, sysData, dashData]) => {
      setAgents(agentsData.agents || []);
      if (sysData) setSystem({ cpu: sysData.cpu || 0, ram: sysData.ram || { used: 0, total: 0 }, disk: sysData.disk || { used: 0, total: 0 } });
      if (dashData) setDashboard(dashData);
      setLoading(false);
    });
  }, []);

  // Real-time polling for agent status (every 500ms)
  const fetchOfficeStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/office");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.agents || !Array.isArray(data.agents)) return;
      const map: Record<string, OfficeAgent> = {};
      for (const a of data.agents) {
        if (a.id) map[a.id] = a;
      }
      setOfficeAgents(map);
    } catch { /* silent */ }
  }, []);

  // Gateway health polling (every 10s)
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) return;
        const data = await res.json();
        const gw = data.checks?.find((c: { name: string }) => c.name === "OpenClaw Gateway");
        setGatewayUp(gw?.status === "up");
        setGatewayLatency(gw?.latency ?? null);
      } catch { setGatewayUp(false); }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchOfficeStatus();
    const interval = setInterval(fetchOfficeStatus, 500);
    return () => clearInterval(interval);
  }, [fetchOfficeStatus]);

  const greeting = getGreeting();
  // Derive real-time counts from office status
  const workingAgents = agents.filter((a) => officeAgents[a.id]?.status === "working");
  const idleAgents = agents.filter((a) => officeAgents[a.id]?.status === "idle");
  const sleepingAgents = agents.filter((a) => !officeAgents[a.id] || officeAgents[a.id]?.status === "sleeping");

  const getAgentStatus = (id: string): "working" | "idle" | "sleeping" => officeAgents[id]?.status || "sleeping";
  const getStatusDot = (s: "working" | "idle" | "sleeping") => {
    if (s === "working") return { fill: "#facc15", label: "工作中", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.25)", textColor: "#facc15" };
    if (s === "idle") return { fill: "#4ade80", label: "空闲", bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.2)", textColor: "#4ade80" };
    return { fill: "#6b7280", label: "休眠", bg: "var(--card-elevated)", border: "var(--border)", textColor: "#6b7280" };
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ===== Greeting Header ===== */}
      <div className="mb-8 p-6 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.06), rgba(52,199,89,0.05))", border: "1px solid var(--border)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-3xl sm:text-4xl">{greeting.emoji}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-1px" }}>
                {greeting.text}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                🤖 共 {agents.length} 位 agent · {workingAgents.length} 工作中 · {idleAgents.length} 待命 · {new Date().toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          {/* Gateway status badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0" style={{ backgroundColor: gatewayUp ? "rgba(74,222,128,0.08)" : gatewayUp === false ? "rgba(239,68,68,0.08)" : "rgba(107,114,128,0.08)", border: `1px solid ${gatewayUp ? "rgba(74,222,128,0.25)" : gatewayUp === false ? "rgba(239,68,68,0.25)" : "rgba(107,114,128,0.2)"}` }}>
            <span className="relative flex h-3 w-3">
              {gatewayUp && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: "#4ade80" }} />}
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: gatewayUp ? "#4ade80" : gatewayUp === false ? "#ef4444" : "#6b7280" }} />
            </span>
            <div className="text-right">
              <span className="text-xs font-semibold" style={{ color: gatewayUp ? "#4ade80" : gatewayUp === false ? "#ef4444" : "#6b7280" }}>
                Gateway {gatewayUp ? "Running" : gatewayUp === false ? "Offline" : "..."}
              </span>
              {gatewayLatency !== null && gatewayUp && (
                <span className="text-xs ml-1.5" style={{ color: "var(--text-muted)" }}>{gatewayLatency}ms</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Row 1: System Health + Agent Status ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* System Health — compact */}
        <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-4 h-4" style={{ color: "#4ade80" }} />
            <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>系统健康</h2>
          </div>
          {system ? (
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center gap-1">
                <ProgressRing value={system.cpu} max={100} color={system.cpu > 80 ? "#ef4444" : system.cpu > 50 ? "#f59e0b" : "#4ade80"} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <Cpu className="inline w-3 h-3 mr-1" />CPU
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ProgressRing value={system.ram.used} max={system.ram.total} color={system.ram.used / system.ram.total > 0.8 ? "#ef4444" : "#60a5fa"} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <Bot className="inline w-3 h-3 mr-1" />{system.ram.used.toFixed(0)}G/{system.ram.total.toFixed(0)}G
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ProgressRing value={system.disk.used} max={system.disk.total} color={system.disk.used / system.disk.total > 0.85 ? "#ef4444" : "#a78bfa"} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <HardDrive className="inline w-3 h-3 mr-1" />{system.disk.used}G/{system.disk.total}G
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>{loading ? "加载中..." : "无法获取"}</div>
          )}
        </div>

        {/* Agent Status */}
        <div className="lg:col-span-3 p-5 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4" style={{ color: "#f472b6" }} />
            <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Agent 团队</h2>
            {workingAgents.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: "rgba(250,204,21,0.12)", color: "#facc15" }}>
                {workingAgents.length} ⚡ 工作中
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${workingAgents.length > 0 ? "" : "ml-auto"}`} style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
              {idleAgents.length} 🟢 待命
            </span>
            {sleepingAgents.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(107,114,128,0.12)", color: "#9ca3af" }}>
                {sleepingAgents.length} 💤 休眠
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {agents.map((agent) => {
              const status = getAgentStatus(agent.id);
              const dot = getStatusDot(status);
              const office = officeAgents[agent.id];
              const model = office?.model || agent.model?.replace("github-copilot/", "") || "";
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: dot.bg,
                    border: `1px solid ${dot.border}`,
                  }}
                >
                  <span className="text-xl">{agent.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{agent.name}</div>
                    <div className="text-[11px] sm:text-[10px] truncate" style={{ color: dot.textColor }}>
                      {status === "working" ? (office?.currentTask || "执行中...") : dot.label}
                    </div>
                    <div className="text-[11px] sm:text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{model}</div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <Circle
                      className={`w-2.5 h-2.5 ${status === "working" ? "animate-pulse" : ""}`}
                      style={{ fill: dot.fill, color: dot.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Row 2: Cron Heartbeat + Yesterday Memory ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Cron Heartbeat */}
        <div className="p-5 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>🫀 心跳任务</h2>
            {dashboard?.cron && (
              <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                今日 {dashboard.cron.ranToday}/{dashboard.cron.totalJobs} 已执行
              </span>
            )}
          </div>
          {dashboard?.cron ? (
            <div className="space-y-2">
              {(showAllCron ? dashboard.cron.jobs : dashboard.cron.jobs.filter((j) => j.enabled).slice(0, 5)).map((job) => (
                <div
                  key={job.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                >
                  {job.didRunToday ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                  ) : job.failures > 0 ? (
                    <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                  ) : (
                    <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{job.name}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {job.lastRun ? timeAgo(job.lastRun) : "从未运行"}
                      {job.failures > 0 && <span style={{ color: "#ef4444" }}> · {job.failures} 次失败</span>}
                    </div>
                  </div>
                </div>
              ))}
              {dashboard.cron.jobs.length > 5 && (
                <button
                  onClick={() => setShowAllCron(!showAllCron)}
                  className="flex items-center gap-1 text-xs w-full justify-center py-3 rounded-lg transition-all hover:opacity-80"
                  style={{ color: "var(--accent)" }}
                >
                  {showAllCron ? <><ChevronUp className="w-3 h-3" /> 收起</> : <><ChevronDown className="w-3 h-3" /> 展开全部 ({dashboard.cron.jobs.length})</>}
                </button>
              )}
              {dashboard.cron.totalFailures > 0 && (
                <div className="text-xs p-2 rounded-lg mt-2" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                  ⚠️ 累计 {dashboard.cron.totalFailures} 次任务失败，请检查
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>{loading ? "加载中..." : "无数据"}</div>
          )}
        </div>

        {/* Yesterday's Summary */}
        <div className="p-5 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4" style={{ color: "#818cf8" }} />
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontSize: "1.35rem" }}
            >
              📝 昨天回顾
            </h2>
            {dashboard?.yesterdayMemory?.available && (
              <span className="ml-auto" style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
                {dashboard.yesterdayMemory.date}
              </span>
            )}
          </div>
          {dashboard?.yesterdayMemory?.available ? (
            <div className="space-y-4">
              {dashboard.yesterdayMemory.sections.map((sec, i) => (
                <div key={i}>
                  <div
                    className="font-bold mb-2"
                    style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}
                  >
                    {sec.title}
                  </div>
                  <div className="space-y-2">
                    {sec.items.map((item, j) => (
                      <div
                        key={j}
                        className="pl-4 prose prose-sm dark:prose-invert max-w-none"
                        style={{
                          color: "var(--text-primary)",
                          borderLeft: "2px solid var(--border)",
                          fontSize: "1.05rem",
                          lineHeight: 1.8,
                        }}
                      >
                        <ReactMarkdown>{item}</ReactMarkdown>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center" style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
              {loading ? "加载中..." : `📭 昨天（${dashboard?.yesterdayMemory?.requestedDate || dashboard?.yesterdayMemory?.date || "未知日期"}）的总结还没生成`}
            </div>
          )}
        </div>
      </div>

      {/* ===== Row 3: Self-Evolution Morning Briefing ===== */}
      <div className="p-5 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.05), rgba(244,114,182,0.04))", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4" style={{ color: "#f472b6" }} />
          <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>🧬 每日早报 · 自进化</h2>
          {dashboard?.evolution?.morningBriefDate && (
            <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: "rgba(244,114,182,0.1)", color: "#f472b6" }}>
              📮 {dashboard.evolution.morningBriefDate}
            </span>
          )}
        </div>

        {dashboard?.evolution ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Improvements */}
            <div>
              <div className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                🔍 待改进项
                {dashboard.evolution.todayGaps > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    +{dashboard.evolution.todayGaps} 新发现
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {dashboard.evolution.improvements.length > 0 ? dashboard.evolution.improvements.map((imp, i) => (
                  <div key={i} className="p-2.5 rounded-lg" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${PRIORITY_COLORS[imp.priority] || "#60a5fa"}15`, color: PRIORITY_COLORS[imp.priority] || "#60a5fa" }}>
                        {imp.priority}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-primary)" }}>{imp.title}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>🎉 暂无改进项，太完美了！</p>
                )}
              </div>
            </div>

            {/* Recommended Skills */}
            <div>
              <div className="text-xs font-bold mb-3" style={{ color: "var(--text-secondary)" }}>💡 推荐安装</div>
              <div className="space-y-2">
                {dashboard.evolution.recommendations.length > 0 ? dashboard.evolution.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                    <Puzzle className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
                    <div>
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{rec.name}</span>
                      <span className="text-[10px] ml-1.5" style={{ color: "var(--text-muted)" }}>{rec.type}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>暂无新推荐</p>
                )}
              </div>
            </div>

            {/* Installed Skills */}
            <div>
              <div className="text-xs font-bold mb-3" style={{ color: "var(--text-secondary)" }}>
                🧰 已安装技能 ({dashboard.evolution.skillCount})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dashboard.evolution.installedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[10px] space-y-1" style={{ color: "var(--text-muted)" }}>
                {dashboard.evolution.lastSignalCollection && (
                  <div>🔎 信号采集：{dashboard.evolution.lastSignalCollection}</div>
                )}
                {dashboard.evolution.lastReview && (
                  <div>📋 每日复盘：{dashboard.evolution.lastReview}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>{loading ? "加载中..." : "无自进化数据"}</div>
        )}
      </div>
    </div>
  );
}
