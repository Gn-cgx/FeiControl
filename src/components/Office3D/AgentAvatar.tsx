'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import VoxelAvatar from './VoxelAvatar';
import type { AgentConfig, AgentState } from './agentsConfig';

interface AgentAvatarProps {
  agent: AgentConfig;
  state: AgentState;
}

const MOVE_SPEED = 6;
const SNAP_THRESHOLD = 0.05;
const EMPTY_DEBUG_AVATARS = 0;
const OFFICE_AVATAR_DEBUG_QUERY_PARAM = 'officeAvatarDebug';

type AvatarDebugPosition = {
  x: number;
  y: number;
  z: number;
};

type OfficeAvatarDebugEntry = {
  id: string;
  status: AgentState['status'];
  currentPosition: AvatarDebugPosition;
  targetPosition: AvatarDebugPosition;
  rotationY: number;
  sleepPose: AgentConfig['restPose'] | 'sit';
  isSleeping: boolean;
};

type OfficeAvatarDebugState = {
  avatars: Record<string, OfficeAvatarDebugEntry>;
  updatedAt: number;
};

declare global {
  interface Window {
    __officeAvatarDebug?: OfficeAvatarDebugState;
  }
}

const debugWorldPosition = new Vector3();

function toDebugPosition(vector: Vector3): AvatarDebugPosition {
  return {
    x: Number(vector.x.toFixed(3)),
    y: Number(vector.y.toFixed(3)),
    z: Number(vector.z.toFixed(3)),
  };
}

function ensureOfficeAvatarDebugState() {
  if (typeof window === 'undefined') {
    return null;
  }

  window.__officeAvatarDebug ??= {
    avatars: {},
    updatedAt: Date.now(),
  };

  return window.__officeAvatarDebug;
}

function isOfficeAvatarDebugEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get(OFFICE_AVATAR_DEBUG_QUERY_PARAM) === '1';
}

function areDebugPositionsEqual(left: AvatarDebugPosition, right: AvatarDebugPosition) {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}

function areDebugEntriesEqual(left: OfficeAvatarDebugEntry | undefined, right: OfficeAvatarDebugEntry) {
  if (!left) {
    return false;
  }

  return (
    left.status === right.status
    && left.rotationY === right.rotationY
    && left.sleepPose === right.sleepPose
    && left.isSleeping === right.isSleeping
    && areDebugPositionsEqual(left.currentPosition, right.currentPosition)
    && areDebugPositionsEqual(left.targetPosition, right.targetPosition)
  );
}

export default function AgentAvatar({ agent, state }: AgentAvatarProps) {
  const groupRef = useRef<Group>(null);
  const currentPos = useRef(new Vector3(...agent.seatPosition));
  const initialized = useRef(false);
  const prevStatus = useRef<string>('');
  const { invalidate } = useThree();

  const status = state?.status ?? 'idle';
  const isMain = agent.isMain === true;
  const isDebugEnabled = isOfficeAvatarDebugEnabled();

  const getTarget = (): Vector3 => {
    if (status === 'working' || status === 'thinking') {
      return new Vector3(...agent.tablePosition);
    }
    if (status === 'sleeping' && agent.restPosition) {
      return new Vector3(...agent.restPosition);
    }
    return new Vector3(...agent.seatPosition);
  };

  const getTargetRotation = () => {
    if (status === 'working' || status === 'thinking') {
      const [x, , z] = agent.tablePosition;
      return Math.atan2(-x, -z);
    }
    if (status === 'sleeping' && typeof agent.restRotation === 'number') {
      return agent.restRotation;
    }
    return agent.faceDirection;
  };

  const avatarScale = (agent.scale ?? (isMain ? 1.5 : 1)) * 3;
  const isSleeping = status === 'sleeping';
  const sleepPose = agent.restPose ?? 'sit';
  const isSitting = status === 'sleeping' ? sleepPose === 'sit' : status !== 'working' && status !== 'thinking';

  const cleanupDebugSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const debugState = window.__officeAvatarDebug;
    const hadAvatarEntry = Boolean(debugState?.avatars[agent.id]);

    if (!debugState || !hadAvatarEntry) {
      return;
    }

    delete debugState.avatars[agent.id];

    if (Object.keys(debugState.avatars).length === EMPTY_DEBUG_AVATARS) {
      delete window.__officeAvatarDebug;
      return;
    }

    debugState.updatedAt = Date.now();
  }, [agent.id]);

  const publishDebugSnapshot = (target: Vector3) => {
    if (typeof window === 'undefined' || !groupRef.current || !isDebugEnabled) {
      return;
    }

    const debugState = ensureOfficeAvatarDebugState();
    if (!debugState) {
      return;
    }

    groupRef.current.getWorldPosition(debugWorldPosition);

    const nextSnapshot: OfficeAvatarDebugEntry = {
      id: agent.id,
      status,
      currentPosition: toDebugPosition(debugWorldPosition),
      targetPosition: toDebugPosition(target),
      rotationY: Number(groupRef.current.rotation.y.toFixed(3)),
      sleepPose,
      isSleeping,
    };

    if (areDebugEntriesEqual(debugState.avatars[agent.id], nextSnapshot)) {
      return;
    }

    debugState.avatars[agent.id] = nextSnapshot;
    debugState.updatedAt = Date.now();
  };

  useFrame((_frameState, delta) => {
    if (!groupRef.current) return;

    // Initialize position on first frame
    if (!initialized.current) {
      initialized.current = true;
      currentPos.current.set(...agent.seatPosition);
      groupRef.current.position.copy(currentPos.current);
      groupRef.current.rotation.y = agent.faceDirection;
    }

    const target = getTarget();
    const direction = new Vector3().subVectors(target, currentPos.current);
    const distance = direction.length();

    if (distance < SNAP_THRESHOLD) {
      if (!currentPos.current.equals(target)) {
        currentPos.current.copy(target);
        groupRef.current.position.copy(target);
      }
      groupRef.current.rotation.y = getTargetRotation();
      publishDebugSnapshot(target);
      return;
    }

    direction.normalize().multiplyScalar(Math.min(MOVE_SPEED * delta, distance));
    currentPos.current.add(direction);
    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.y = Math.atan2(direction.x, direction.z);
    publishDebugSnapshot(target);
    invalidate();
  });

  if (prevStatus.current !== status) {
    prevStatus.current = status;
    requestAnimationFrame(() => invalidate());
  }

  useEffect(() => {
    if (isDebugEnabled) {
      return;
    }

    cleanupDebugSnapshot();
  }, [cleanupDebugSnapshot, isDebugEnabled]);

  useEffect(() => {
    return () => {
      cleanupDebugSnapshot();
    };
  }, [cleanupDebugSnapshot]);

  return (
    <group ref={groupRef} scale={avatarScale}>
      <VoxelAvatar
        agent={agent}
        position={[0, 0, 0]}
        isWorking={status === 'working'}
        isThinking={status === 'thinking'}
        isError={status === 'error'}
        isSitting={isSitting}
        isSleeping={isSleeping}
        sleepPose={sleepPose}
      />
    </group>
  );
}
