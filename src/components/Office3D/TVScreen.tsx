'use client';

import { Box } from '@react-three/drei';

/**
 * TVScreen — Office large TV / projection screen
 * Placed on the back wall in front of agent desks, visible when all agents face the center.
 */
export default function TVScreen() {
  return (
    <group position={[0, 3.8, -9.6]} rotation={[0, 0, 0]}>
      {/* TV frame - dark aluminum finish */}
      <Box args={[6, 3.2, 0.15]} castShadow>
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.25} />
      </Box>

      {/* Screen panel - slightly glowing */}
      <Box args={[5.6, 2.8, 0.02]} position={[0, 0, 0.08]}>
        <meshStandardMaterial
          color="#0d1b2a"
          emissive="#1a3a5c"
          emissiveIntensity={0.6}
          metalness={0.1}
          roughness={0.3}
        />
      </Box>

      {/* Content stripes on screen (simulated display content) */}
      {[-0.8, -0.2, 0.4, 1.0].map((y, i) => (
        <Box key={`line-${i}`} args={[4.2, 0.12, 0.005]} position={[0, y, 0.1]}>
          <meshStandardMaterial
            color="#4fc3f7"
            emissive="#4fc3f7"
            emissiveIntensity={0.4}
            transparent
            opacity={0.5 + i * 0.1}
          />
        </Box>
      ))}

      {/* Large text area at screen center */}
      <Box args={[3.0, 0.6, 0.005]} position={[0, 0.1, 0.1]}>
        <meshStandardMaterial
          color="#81d4fa"
          emissive="#81d4fa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </Box>

      {/* Bottom stand - slim metal column */}
      <Box args={[0.15, 1.2, 0.15]} position={[0, -2.2, 0.3]} castShadow>
        <meshStandardMaterial color="#2c2c2c" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Base */}
      <Box args={[1.8, 0.08, 0.8]} position={[0, -2.8, 0.3]} castShadow>
        <meshStandardMaterial color="#2c2c2c" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Ambient light emitted from screen */}
      <pointLight
        position={[0, 0, 1.5]}
        color="#4fc3f7"
        intensity={0.8}
        distance={8}
      />
    </group>
  );
}
