'use client';

import type { AgentConfig, AgentState } from './agentsConfig';

interface AgentListPanelProps {
  agents: AgentConfig[];
  agentStates: Record<string, AgentState>;
  selectedAgent: string | null;
  onSelectAgent: (id: string) => void;
}

export default function AgentListPanel({ agents, agentStates, selectedAgent, onSelectAgent }: AgentListPanelProps) {
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-400 animate-pulse';
      case 'thinking': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      case 'sleeping': return 'bg-gray-600';
      case 'idle':
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="absolute top-0 left-0 z-10 w-40 h-full flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/[0.06] px-3 py-3">
        <span className="text-sm font-bold text-white">Agents</span>
      </div>

      {/* Agent list */}
      <div className="bg-black/40 backdrop-blur-xl flex-1 overflow-y-auto">
        {agents.map((agent) => {
          const state = agentStates[agent.id];
          const status = state?.status || 'idle';
          const isSelected = selectedAgent === agent.id;

          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-left transition-all
                hover:bg-white/10
                ${isSelected ? 'bg-white/15' : ''}
              `}
            >
              {/* Emoji */}
              <span className="text-sm">{agent.emoji}</span>

              {/* Name */}
              <span className="text-xs text-gray-300 truncate flex-1">
                {agent.name.replace(agent.emoji + ' ', '')}
              </span>

              {/* Status dot (right side) */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(status)}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
