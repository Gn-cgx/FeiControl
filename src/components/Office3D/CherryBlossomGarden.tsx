'use client';

/**
 * CherryBlossomGarden — Cherry Blossom Garden
 * Outdoor garden connecting the OpenClaw Palace and ClawTeam Office
 * Cherry blossom trees transplanted from the Walls.tsx left window
 */
export default function CherryBlossomGarden() {
  const trees: { pos: [number, number, number]; scale: number }[] = [
    { pos: [-20, 0, -4], scale: 1.0 },
    { pos: [-18.5, 0, 1], scale: 1.2 },
    { pos: [-20.5, 0, 5], scale: 0.9 },
    { pos: [-17.5, 0, -1.5], scale: 0.8 },
    { pos: [-19.5, 0, 7], scale: 1.1 },
  ];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-21.6, 0.03, 0.4]} receiveShadow>
        <planeGeometry args={[1.5, 14]} />
        <meshStandardMaterial color="#59A9C7" emissive="#1F6B8E" emissiveIntensity={0.22} transparent opacity={0.88} roughness={0.22} />
      </mesh>
      {[-5.4, -2.2, 1.2, 4.4].map((z, index) => (
        <mesh key={`creek-ripple-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[-21.6, 0.034, z]}>
          <planeGeometry args={[1.08, 0.16]} />
          <meshStandardMaterial color="#8CD7EC" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* Stone path connecting the two buildings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-19, 0.015, 0]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#9E9689" roughness={0.9} />
      </mesh>
      {/* Path stone gap texture - horizontal lines */}
      {[-1.2, -0.4, 0.4, 1.2].map((z, i) => (
        <mesh key={`path-line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-19, 0.018, z]}>
          <planeGeometry args={[8, 0.04]} />
          <meshStandardMaterial color="#7A756E" />
        </mesh>
      ))}

      {/* Lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-19, 0.005, 0]} receiveShadow>
        <planeGeometry args={[10, 16]} />
        <meshStandardMaterial color="#4A7A3A" roughness={0.95} />
      </mesh>

      <group position={[-21.6, 0, 0.35]}>
        {[-0.82, -0.4, 0, 0.4, 0.82].map((z) => (
          <mesh key={`bridge-plank-${z}`} position={[0, 0.38 + (0.42 - Math.abs(z)) * 0.28, z]} castShadow receiveShadow>
            <boxGeometry args={[1.56, 0.08, 0.26]} />
            <meshStandardMaterial color="#925D3A" roughness={0.7} />
          </mesh>
        ))}
        {[-0.56, 0.56].map((x, index) => (
          <group key={`bridge-rail-${index}`} position={[x, 0, 0]}>
            {[-0.8, -0.27, 0.27, 0.8].map((z) => (
              <mesh key={`bridge-post-${z}`} position={[0, 0.44 + (0.36 - Math.abs(z)) * 0.22, z]} castShadow>
                <boxGeometry args={[0.1, 0.58, 0.1]} />
                <meshStandardMaterial color="#6A4125" roughness={0.76} />
              </mesh>
            ))}
            <mesh position={[0, 1.08, 0]} castShadow>
              <boxGeometry args={[0.1, 0.08, 1.92]} />
              <meshStandardMaterial color="#C89D47" roughness={0.45} metalness={0.18} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Cherry blossom trees */}
      {trees.map(({ pos, scale }, i) => (
        <group key={`sakura-${i}`} position={pos} scale={scale}>
          {/* Tree trunk */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 3, 6]} />
            <meshStandardMaterial color="#5C3A1E" roughness={0.8} />
          </mesh>
          {/* Main canopy */}
          <mesh position={[0, 3.2, 0]}>
            <sphereGeometry args={[1.3, 10, 10]} />
            <meshStandardMaterial color="#FFB7C5" roughness={0.8} />
          </mesh>
          {/* Side canopy */}
          <mesh position={[0.7, 2.8, 0.3]}>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial color="#FFC0CB" roughness={0.8} />
          </mesh>
          <mesh position={[-0.5, 3.5, -0.2]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#FFD1DC" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Garden lanterns */}
      {[[-21, 0, -6], [-17, 0, -6], [-21, 0, 6], [-17, 0, 6]].map(([x, y, z], i) => (
        <group key={`garden-lantern-${i}`} position={[x, y, z]}>
          {/* Lamp post */}
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.5, 6]} />
            <meshStandardMaterial color="#3D2B1F" />
          </mesh>
          {/* Lamp body */}
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[0.2, 0.25, 0.2]} />
            <meshStandardMaterial color="#CC4444" emissive="#CC4444" emissiveIntensity={0.3} />
          </mesh>
          <pointLight position={[0, 1.6, 0]} color="#FFD700" intensity={0.3} distance={5} />
        </group>
      ))}

      {[[-22.9, 0, -4.9], [-22.9, 0, 4.9]].map(([x, y, z], index) => (
        <group key={`stone-lantern-${index}`} position={[x, y, z]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.4, 8]} />
            <meshStandardMaterial color="#8D857A" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.74, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.62, 8]} />
            <meshStandardMaterial color="#8A8278" roughness={0.92} />
          </mesh>
          <mesh position={[0, 1.18, 0]} castShadow>
            <boxGeometry args={[0.58, 0.24, 0.58]} />
            <meshStandardMaterial color="#958D82" roughness={0.92} />
          </mesh>
          <mesh position={[0, 1.46, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 0.12, 8]} />
            <meshStandardMaterial color="#A29A8E" roughness={0.9} />
          </mesh>
          <pointLight position={[0, 1.18, 0]} color="#FFD58A" intensity={0.22} distance={4} />
        </group>
      ))}

      {[
        [-18.2, 3.2, -6.4],
        [-20.1, 3.5, -6.1],
        [-17.7, 3.3, 6.3],
        [-19.7, 3.6, 6.1],
      ].map(([x, y, z], index) => (
        <group key={`koinobori-${index}`} position={[x, y, z]} rotation={[0, index < 2 ? -0.2 : 0.2, 0]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
            <meshStandardMaterial color="#5B4634" roughness={0.7} />
          </mesh>
          <mesh position={[0.42, 1.3, 0]} rotation={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.18, 0.1, 0.92, 12]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#D94F45' : '#3D6FB5'} roughness={0.82} />
          </mesh>
          <mesh position={[0.02, 1.3, 0]} rotation={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.1, 0.14, 0.12, 12]} />
            <meshStandardMaterial color="#F3E5C8" roughness={0.62} />
          </mesh>
          <mesh position={[0.62, 1.3, 0]}>
            <coneGeometry args={[0.1, 0.24, 10]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#F1C24F' : '#D94F45'} roughness={0.72} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
