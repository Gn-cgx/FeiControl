'use client';

import { X } from 'lucide-react';
import type { AgentConfig, AgentState } from './agentsConfig';

interface AgentPanelProps {
  agent: AgentConfig;
  state: AgentState;
  onClose: () => void;
}

function formatTokens(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function timeAgo(ts: string | number | undefined): string {
  if (!ts) return '—';
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function AgentPanel({ agent, state, onClose }: AgentPanelProps) {
  const status = state?.status ?? 'idle';

  const getStatusColor = () => {
    switch (status) {
      case 'working': return 'text-yellow-400';
      case 'thinking': return 'text-blue-500 animate-pulse';
      case 'error': return 'text-red-500';
      case 'sleeping': return 'text-gray-500';
      case 'idle':
      default: return 'text-green-400';
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'working': return 'bg-yellow-500/20';
      case 'thinking': return 'bg-blue-500/20';
      case 'error': return 'bg-red-500/20';
      case 'sleeping': return 'bg-gray-500/20';
      case 'idle':
      default: return 'bg-green-500/20';
    }
  };

  const getStatusDotColor = () => {
    switch (status) {
      case 'working': return '#facc15';
      case 'thinking': return '#3b82f6';
      case 'error': return '#ef4444';
      case 'sleeping': return '#6b7280';
      case 'idle':
      default: return '#4ade80';
    }
  };

  const statusLabel = status === 'working' ? 'Working' : status === 'thinking' ? 'Thinking' : status === 'error' ? 'Error' : status === 'sleeping' ? 'Sleeping' : 'Idle';

  return (
    <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-black/90 backdrop-blur-md text-white p-4 sm:p-6 shadow-2xl border-l border-white/10 overflow-y-auto z-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-4xl">{agent.emoji}</span>
            {agent.name}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{agent.role}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 ${getStatusBgColor()}`}>
        <div
          className={`w-2 h-2 rounded-full ${status === 'working' || status === 'thinking' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: getStatusDotColor() }}
        />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {statusLabel}
        </span>
      </div>

      {/* Current task */}
      {state?.currentTask && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Current Task</h3>
          <p className="text-base">{state.currentTask}</p>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-400">Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Model</p>
            <p className="text-sm font-bold">{state?.model || 'N/A'}</p>
          </div>

          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Sessions</p>
            <p className="text-lg font-bold">{state?.sessionCount ?? 0}</p>
          </div>

          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Total Tokens</p>
            <p className="text-lg font-bold">{formatTokens(state?.totalTokens)}</p>
          </div>

          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Last Active</p>
            <p className="text-sm font-bold">{timeAgo(state?.lastActivity)}</p>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Sessions</h3>
        <div className="space-y-2">
          {state?.recentSessions && state.recentSessions.length > 0 ? (
            state.recentSessions.map((sess, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-lg text-sm">
                <p className="text-gray-400 text-xs mb-1">{timeAgo(sess.time)}</p>
                <p className="truncate">{sess.task}</p>
              </div>
            ))
          ) : (
            <div className="bg-white/5 p-3 rounded-lg text-sm text-gray-500">No session history</div>
          )}
        </div>
      </div>
    </div>
  );
}
