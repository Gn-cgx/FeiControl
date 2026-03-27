'use client';

const LIGHT_STRIPS = [-5.6, 0, 5.6];

export default function CeilingBeams() {
  return (
    <group>
      {LIGHT_STRIPS.map((z) => (
        <group key={`ceiling-strip-${z}`}>
          <mesh position={[0, 5.92, z]} receiveShadow>
            <boxGeometry args={[22.4, 0.06, 0.68]} />
            <meshStandardMaterial color="#E6DED0" roughness={0.72} />
          </mesh>
          <mesh position={[0, 5.88, z]}>
            <boxGeometry args={[18.8, 0.02, 0.22]} />
            <meshStandardMaterial color="#FFF6E8" emissive="#FFF3DE" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {[-9.8, 9.8].map((x) => (
        <mesh key={`ceiling-edge-${x}`} position={[x, 5.85, 0]} receiveShadow>
          <boxGeometry args={[0.18, 0.12, 17.4]} />
          <meshStandardMaterial color="#D7C7B0" roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}
