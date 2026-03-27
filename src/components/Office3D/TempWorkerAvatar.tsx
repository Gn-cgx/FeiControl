'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import type { Group } from 'three';

interface TempWorkerAvatarProps {
  name: string;
  emoji?: string;
  color: string;
  position: [number, number, number];
  isWorking?: boolean;
  isSitting?: boolean;
}

/**
 * TempWorkerAvatar — 临时工小人
 * 基于 VoxelAvatar 但有区别：戴安全帽、穿工装
 */

function WorkerLeg({ x, isSitting, pantsColor }: { x: number; isSitting: boolean; pantsColor: string }) {
  if (!isSitting) {
    // Standing — straight legs
    return (
      <group position={[x, -0.09, 0]}>
        <Box args={[0.09, 0.18, 0.09]} castShadow>
          <meshStandardMaterial color={pantsColor} />
        </Box>
        <Box args={[0.09, 0.04, 0.12]} position={[0, -0.11, 0.015]} castShadow>
          <meshStandardMaterial color="#1f2937" />
        </Box>
      </group>
    );
  }
  // Sitting — thigh horizontal forward, calf hanging down
  return (
    <group position={[x, -0.06, 0.04]}>
      {/* Thigh — horizontal forward */}
      <Box args={[0.09, 0.09, 0.14]} position={[0, 0, 0.05]} castShadow>
        <meshStandardMaterial color={pantsColor} />
      </Box>
      {/* Calf — hanging down from knee */}
      <Box args={[0.08, 0.12, 0.08]} position={[0, -0.1, 0.12]} castShadow>
        <meshStandardMaterial color={pantsColor} />
      </Box>
      {/* Shoe */}
      <Box args={[0.09, 0.035, 0.11]} position={[0, -0.17, 0.12]} castShadow>
        <meshStandardMaterial color="#1f2937" />
      </Box>
    </group>
  );
}

export default function TempWorkerAvatar({
  name,
  emoji,
  color,
  position,
  isWorking = false,
  isSitting = false,
}: TempWorkerAvatarProps) {
  const groupRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current || !torsoRef.current || !headRef.current || !leftArmRef.current || !rightArmRef.current) return;

    torsoRef.current.position.set(0, isSitting ? -0.005 : 0, isSitting ? 0.005 : 0);
    torsoRef.current.rotation.set(isSitting ? 0.08 : 0, 0, 0);

    headRef.current.position.set(0, isSitting ? 0.35 : 0.35, isSitting ? 0.01 : 0);
    headRef.current.rotation.set(0, 0, 0);

    leftArmRef.current.position.set(-0.13, isSitting ? 0.17 : 0.18, isSitting ? 0.01 : 0);
    rightArmRef.current.position.set(0.13, isSitting ? 0.17 : 0.18, isSitting ? 0.01 : 0);
    leftArmRef.current.rotation.set(isSitting ? -0.42 : 0, isSitting ? 0.08 : 0, isSitting ? 0.18 : 0);
    rightArmRef.current.rotation.set(isSitting ? -0.42 : 0, isSitting ? -0.08 : 0, isSitting ? -0.18 : 0);

    if (isWorking) {
      const time = state.clock.elapsedTime * 3;
      leftArmRef.current.rotation.x = Math.sin(time) * 0.3;
      rightArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.3;
    }

    if (!isWorking && !isSitting) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.01;
    } else {
      groupRef.current.position.y = position[1];
    }
  });

  const skinColor = '#ffa07a';
  const vestColor = color;
  const pantsColor = '#37474F';

  return (
    <group ref={groupRef} position={position}>
      <group ref={torsoRef}>
        {/* HEAD */}
        <group ref={headRef} position={[0, 0.35, 0]}>
          <Box args={[0.2, 0.2, 0.2]} castShadow>
            <meshStandardMaterial color={skinColor} />
          </Box>
          {/* Eyes */}
          <Box args={[0.04, 0.04, 0.02]} position={[-0.05, 0.02, 0.11]} castShadow>
            <meshStandardMaterial color="#1f2937" />
          </Box>
          <Box args={[0.04, 0.04, 0.02]} position={[0.05, 0.02, 0.11]} castShadow>
            <meshStandardMaterial color="#1f2937" />
          </Box>
          {/* Mouth */}
          <Box args={[0.08, 0.02, 0.01]} position={[0, -0.04, 0.11]} castShadow>
            <meshStandardMaterial color="#000000" />
          </Box>
          {/* Emoji on face */}
          {emoji && (
            <Text position={[0, 0.08, 0.11]} fontSize={0.08} color="white" anchorX="center" anchorY="middle">
              {emoji}
            </Text>
          )}

          {/* === 安全帽 (Hard Hat) === */}
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#FFC107" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* 帽檐 */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.16, 8]} />
            <meshStandardMaterial color="#FFC107" roughness={0.4} />
          </mesh>
        </group>

        {/* BODY — 工装背心 */}
        <Box args={[0.2, 0.25, 0.12]} position={[0, 0.125, 0]} castShadow>
          <meshStandardMaterial color={vestColor} />
        </Box>
        {/* 反光条纹 */}
        <Box args={[0.21, 0.02, 0.13]} position={[0, 0.17, 0]} castShadow>
          <meshStandardMaterial color="#E0E0E0" emissive="#E0E0E0" emissiveIntensity={0.3} />
        </Box>

        {/* ARMS */}
        <group ref={leftArmRef} position={[-0.12, 0.18, 0]}>
          <Box args={[0.08, 0.2, 0.08]} position={[0, -0.1, 0]} castShadow>
            <meshStandardMaterial color={vestColor} />
          </Box>
          <Box args={[0.08, 0.06, 0.08]} position={[0, -0.23, 0]} castShadow>
            <meshStandardMaterial color={skinColor} />
          </Box>
        </group>
        <group ref={rightArmRef} position={[0.12, 0.18, 0]}>
          <Box args={[0.08, 0.2, 0.08]} position={[0, -0.1, 0]} castShadow>
            <meshStandardMaterial color={vestColor} />
          </Box>
          <Box args={[0.08, 0.06, 0.08]} position={[0, -0.23, 0]} castShadow>
            <meshStandardMaterial color={skinColor} />
          </Box>
        </group>
      </group>

      {/* LEGS */}
      <WorkerLeg x={-0.05} isSitting={isSitting} pantsColor={pantsColor} />
      <WorkerLeg x={0.05} isSitting={isSitting} pantsColor={pantsColor} />

      {/* Status light */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.03]} />
        <meshStandardMaterial
          color={isWorking ? '#ffaa00' : '#00ff88'}
          emissive={isWorking ? '#ffaa00' : '#00ff88'}
          emissiveIntensity={isWorking ? 1.2 : 0.5}
        />
      </mesh>

      {/* Name tag below */}
      <Text position={[0, -0.25, 0]} fontSize={0.06} color="#FFC107" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  );
}
