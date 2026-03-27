'use client';

import type { AgentConfig, AgentState } from './agentsConfig';

interface AgentStatusBarProps {
  agents: AgentConfig[];
  agentStates: Record<string, AgentState>;
  selectedAgent: string | null;
  onSelectAgent: (id: string) => void;
}

export default function AgentStatusBar({ agents, agentStates, selectedAgent, onSelectAgent }: AgentStatusBarProps) {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working': return '工作中';
      case 'thinking': return '思考中';
      case 'error': return '错误';
      case 'sleeping': return '休眠';
      case 'idle':
      default: return '空闲';
    }
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-10 flex flex-col items-center gap-2 overflow-x-auto px-2">
      {/* Main capsule */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/[0.06] px-3 sm:px-4 py-2 sm:py-3 flex items-center divide-x divide-white/10 max-w-full">
        {agents.map((agent) => {
          const state = agentStates[agent.id];
          const status = state?.status || 'idle';
          const isSelected = selectedAgent === agent.id;

          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`
                flex flex-col items-center gap-1 px-2 sm:px-4 py-1 transition-all shrink-0
                ${isSelected ? 'bg-white/10 rounded-xl' : 'hover:bg-white/5 rounded-xl'}
              `}
            >
              <span className="text-xl sm:text-2xl">{agent.emoji}</span>
              <span className="text-xs font-medium text-white whitespace-nowrap">
                {agent.name.replace(agent.emoji + ' ', '').split(' ')[0]}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />
                <span className={`text-[10px] ${status === 'working' ? 'text-yellow-400' : status === 'idle' ? 'text-green-400' : 'text-gray-500'}`}>
                  {getStatusLabel(status)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected agent task description (outside capsule) */}
      {selectedAgent && agentStates[selectedAgent] && (
        <div className="text-xs text-gray-400">
          <span className="text-blue-400 font-medium">
            {agents.find(a => a.id === selectedAgent)?.name}
          </span>
          {agentStates[selectedAgent]?.status === 'working' ? ' 正在干活  ' : ' '}
          <span className="text-gray-500">
            {agentStates[selectedAgent]?.currentTask || ''}
          </span>
        </div>
      )}
    </div>
  );
}
