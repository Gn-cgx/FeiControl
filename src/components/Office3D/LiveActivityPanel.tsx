'use client';

import { useState, useEffect, useCallback } from 'react';

interface LiveEvent {
  id: string;
  tool: string;
  toolIcon: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  description?: string;
  timestamp: number;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 30) return '刚刚';
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时前`;
}

export default function LiveActivityPanel() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/office/activity');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 5000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div className="absolute top-4 right-4 z-10 w-60">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full bg-black/40 backdrop-blur-xl rounded-t-xl border border-white/[0.06] px-4 py-2 flex items-center justify-between text-white hover:bg-black/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-bold">实时动态</span>
          <span className="ml-auto text-xs text-gray-400">
            {events.length} 条记录
          </span>
        </div>
        <span className="text-xs text-gray-400">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Event list */}
      {!collapsed && (
        <div className="bg-black/40 backdrop-blur-xl rounded-b-xl border border-t-0 border-white/[0.06] max-h-[50vh] overflow-y-auto">
          {events.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              暂无动态
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {events.map((event, i) => (
                <div
                  key={event.id + '-' + i}
                  className="px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{event.toolIcon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-blue-400 hover:underline cursor-pointer">
                        {event.tool}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500">{event.agentName}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[10px] text-gray-500">{relativeTime(event.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
