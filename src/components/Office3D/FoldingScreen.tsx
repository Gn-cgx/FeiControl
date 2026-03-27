'use client';

interface ScreenSetProps {
  position: [number, number, number];
  mirrored?: boolean;
}

function ScreenSet({ position, mirrored = false }: ScreenSetProps) {
  const baseRotation = mirrored ? -0.16 : 0.16;
  const wingRotation = mirrored ? -0.34 : 0.34;

  const panelOffsets: Array<{ x: number; z: number; rotation: number }> = [
    { x: -0.94, z: -0.05, rotation: wingRotation },
    { x: 0, z: 0, rotation: 0 },
    { x: 0.94, z: -0.05, rotation: -wingRotation },
  ];

  return (
    <group position={position} rotation={[0, baseRotation, 0]}>
      {panelOffsets.map(({ x, z, rotation }, panelIndex) => (
        <group key={`screen-panel-${panelIndex}`} position={[x, 0, z]} rotation={[0, rotation, 0]}>
          <mesh position={[0, 1.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 2.9, 0.06]} />
            <meshStandardMaterial color="#ECE6DC" roughness={0.62} />
          </mesh>
          <mesh position={[0, 1.45, 0.025]}>
            <boxGeometry args={[0.72, 2.6, 0.02]} />
            <meshStandardMaterial color="#F7F4EE" transparent opacity={0.62} roughness={0.16} metalness={0.04} />
          </mesh>
          {[
            [0, 2.86, 0],
            [0, 0.04, 0],
          ].map(([px, py, pz], frameIndex) => (
            <mesh key={`frame-top-bottom-${frameIndex}`} position={[px, py, pz]} castShadow>
              <boxGeometry args={[0.94, 0.08, 0.08]} />
              <meshStandardMaterial color="#D4BE9B" roughness={0.62} />
            </mesh>
          ))}
          {[-0.41, 0.41].map((frameX, frameIndex) => (
            <mesh key={`frame-side-${frameIndex}`} position={[frameX, 1.45, 0]} castShadow>
              <boxGeometry args={[0.08, 2.94, 0.08]} />
              <meshStandardMaterial color="#D4BE9B" roughness={0.62} />
            </mesh>
          ))}
          {[-0.25, 0, 0.25].map((slatX, slatIndex) => (
            <mesh key={`slat-${slatIndex}`} position={[slatX, 1.45, 0.028]} castShadow>
              <boxGeometry args={[0.04, 2.52, 0.02]} />
              <meshStandardMaterial color="#DCCAAE" roughness={0.68} />
            </mesh>
          ))}
          {[-0.22, 0.22].map((footX, footIndex) => (
            <mesh key={`foot-${footIndex}`} position={[footX, 0.06, 0.08]} castShadow>
              <boxGeometry args={[0.18, 0.12, 0.24]} />
              <meshStandardMaterial color="#B69A78" roughness={0.74} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function FoldingScreen() {
  return (
    <group>
      <ScreenSet position={[-5.15, 0, -8.35]} />
      <ScreenSet position={[5.15, 0, -8.35]} mirrored />
    </group>
  );
}
