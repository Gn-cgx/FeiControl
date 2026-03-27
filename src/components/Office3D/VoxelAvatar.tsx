'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import type { Group } from 'three';
import type { AgentConfig } from './agentsConfig';

interface VoxelAvatarProps {
  agent: AgentConfig;
  position: [number, number, number];
  isWorking?: boolean;
  isThinking?: boolean;
  isError?: boolean;
  isSitting?: boolean;
  isSleeping?: boolean;
  sleepPose?: 'sit' | 'lie';
}

interface AvatarLegProps {
  x: number;
  pose: 'stand' | 'sit';
  pantsColor: string;
}

function AvatarLeg({ x, pose, pantsColor }: AvatarLegProps) {
  if (pose === 'stand') {
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

  return (
    <group position={[x, -0.06, 0.04]}>
      <Box args={[0.09, 0.09, 0.14]} position={[0, 0, 0.05]} castShadow>
        <meshStandardMaterial color={pantsColor} />
      </Box>
      <Box args={[0.08, 0.12, 0.08]} position={[0, -0.1, 0.12]} castShadow>
        <meshStandardMaterial color={pantsColor} />
      </Box>
      <Box args={[0.09, 0.035, 0.11]} position={[0, -0.17, 0.12]} castShadow>
        <meshStandardMaterial color="#1f2937" />
      </Box>
    </group>
  );
}

export default function VoxelAvatar({
  agent,
  position,
  isWorking = false,
  isThinking = false,
  isError = false,
  isSitting = false,
  isSleeping = false,
  sleepPose = 'sit',
}: VoxelAvatarProps) {
  const groupRef = useRef<Group>(null);
  const poseRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  const bodyPose = isSleeping ? sleepPose : isSitting ? 'sit' : 'stand';
  const isSeatedPose = bodyPose === 'sit';

  useFrame((state) => {
    if (!groupRef.current || !poseRef.current || !torsoRef.current || !headRef.current || !leftArmRef.current || !rightArmRef.current) {
      return;
    }

    if (bodyPose === 'lie') {
      poseRef.current.position.set(0, 0.1, 0.02);
      poseRef.current.rotation.set(-Math.PI / 2, 0, 0);
      torsoRef.current.position.set(0, 0.01, 0);
      torsoRef.current.rotation.set(0, 0, 0);
      headRef.current.position.set(0, 0.35, 0);
      headRef.current.rotation.set(0, 0, 0);
      leftArmRef.current.position.set(-0.15, 0.16, -0.01);
      rightArmRef.current.position.set(0.15, 0.16, -0.01);
      leftArmRef.current.rotation.set(-0.12, 0, 0.08);
      rightArmRef.current.rotation.set(-0.12, 0, -0.08);
    } else {
      poseRef.current.position.set(0, 0, 0);
      poseRef.current.rotation.set(0, 0, 0);
      torsoRef.current.position.set(0, isSeatedPose ? -0.005 : 0, isSeatedPose ? 0.005 : 0);
      torsoRef.current.rotation.set(isSeatedPose ? 0.08 : 0, 0, 0);
      headRef.current.position.set(0, 0.35, isSeatedPose ? 0.01 : 0);
      headRef.current.rotation.set(0, 0, 0);
      leftArmRef.current.position.set(-0.13, isSeatedPose ? 0.17 : 0.18, isSeatedPose ? 0.01 : 0);
      rightArmRef.current.position.set(0.13, isSeatedPose ? 0.17 : 0.18, isSeatedPose ? 0.01 : 0);
      leftArmRef.current.rotation.set(isSeatedPose ? -0.42 : 0, isSeatedPose ? 0.08 : 0, isSeatedPose ? 0.18 : 0);
      rightArmRef.current.rotation.set(isSeatedPose ? -0.42 : 0, isSeatedPose ? -0.08 : 0, isSeatedPose ? -0.18 : 0);
    }

    if (isWorking) {
      const time = state.clock.elapsedTime * 3;
      leftArmRef.current.rotation.x = Math.sin(time) * 0.3;
      rightArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.3;
    }

    if (isThinking) {
      headRef.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }

    if (isError) {
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.1;
      headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.15;
    }

    if (!isWorking && !isThinking && !isError && bodyPose === 'stand') {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.01;
    } else {
      groupRef.current.position.y = position[1];
    }
  });

  const skinColor = '#ffa07a';
  const shirtColor = agent.color;
  const pantsColor = '#4a5568';
  const indicatorColor = isError ? '#ff4444' : isWorking ? '#ffaa00' : isSleeping ? '#8ab4f8' : '#6ee7b7';

  return (
    <group ref={groupRef} position={position}>
      <group ref={poseRef}>
        <group ref={torsoRef}>
          <group ref={headRef} position={[0, 0.35, 0]}>
            <Box args={[0.2, 0.2, 0.2]} castShadow>
              <meshStandardMaterial color={skinColor} />
            </Box>
            <Box args={[0.04, 0.04, 0.02]} position={[-0.05, 0.02, 0.11]} castShadow>
              <meshStandardMaterial color="#1f2937" />
            </Box>
            <Box args={[0.04, 0.04, 0.02]} position={[0.05, 0.02, 0.11]} castShadow>
              <meshStandardMaterial color="#1f2937" />
            </Box>
            {!isError && (
              <Box args={[0.08, 0.02, 0.01]} position={[0, -0.04, 0.11]} castShadow>
                <meshStandardMaterial color="#000000" />
              </Box>
            )}
            {isError && (
              <Box args={[0.08, 0.02, 0.01]} position={[0, -0.06, 0.11]} rotation={[0, 0, Math.PI]} castShadow>
                <meshStandardMaterial color="#ef4444" />
              </Box>
            )}
            <Text
              position={[0, 0.08, 0.11]}
              fontSize={0.08}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {agent.emoji}
            </Text>
            {isThinking && (
              <>
                <mesh position={[-0.15, 0.15, 0]}>
                  <sphereGeometry args={[0.02]} />
                  <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
                </mesh>
                <mesh position={[-0.18, 0.2, 0]}>
                  <sphereGeometry args={[0.03]} />
                  <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
                </mesh>
                <mesh position={[-0.22, 0.26, 0]}>
                  <sphereGeometry args={[0.04]} />
                  <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
                </mesh>
              </>
            )}
          </group>

          <Box args={[0.2, 0.25, 0.12]} position={[0, 0.125, 0]} castShadow>
            <meshStandardMaterial color={shirtColor} />
          </Box>

          <group ref={leftArmRef} position={[-0.12, 0.18, 0]}>
            <Box args={[0.08, 0.2, 0.08]} position={[0, -0.1, 0]} castShadow>
              <meshStandardMaterial color={shirtColor} />
            </Box>
            <Box args={[0.08, 0.06, 0.08]} position={[0, -0.23, 0]} castShadow>
              <meshStandardMaterial color={skinColor} />
            </Box>
          </group>

          <group ref={rightArmRef} position={[0.12, 0.18, 0]}>
            <Box args={[0.08, 0.2, 0.08]} position={[0, -0.1, 0]} castShadow>
              <meshStandardMaterial color={shirtColor} />
            </Box>
            <Box args={[0.08, 0.06, 0.08]} position={[0, -0.23, 0]} castShadow>
              <meshStandardMaterial color={skinColor} />
            </Box>
          </group>
        </group>

        <AvatarLeg x={-0.05} pose={bodyPose === 'sit' ? 'sit' : 'stand'} pantsColor={pantsColor} />
        <AvatarLeg x={0.05} pose={bodyPose === 'sit' ? 'sit' : 'stand'} pantsColor={pantsColor} />
      </group>

      <mesh position={bodyPose === 'lie' ? [0, 0.18, -0.12] : [0, 0.42, 0]}>
        <sphereGeometry args={[0.03]} />
        <meshStandardMaterial
          color={indicatorColor}
          emissive={indicatorColor}
          emissiveIntensity={isWorking || isError ? 1.2 : isSleeping ? 0.3 : 0.45}
        />
      </mesh>

      {isError && (
        <>
          <mesh position={[0.15, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[-0.15, 0.25, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </>
      )}
    </group>
  );
}
