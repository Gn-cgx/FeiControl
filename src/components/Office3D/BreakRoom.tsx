'use client';

function PottedPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.42, 16]} />
        <meshStandardMaterial color="#D7C6B0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.38, 10]} />
        <meshStandardMaterial color="#7C5E42" roughness={0.82} />
      </mesh>
      {[
        [-0.14, 0.82, 0.02],
        [0.12, 0.88, -0.04],
        [0.04, 1.02, 0.12],
        [-0.06, 1.1, -0.12],
        [0.16, 1.18, 0.06],
      ].map(([x, y, z], index) => (
        <mesh
          key={`plant-leaf-${index}`}
          position={[x, y, z]}
          rotation={[0, 0, index % 2 === 0 ? 0.5 : -0.5]}
          castShadow
        >
          <boxGeometry args={[0.3, 0.04, 0.14]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#6DA86A' : '#87BC7F'} roughness={0.84} />
        </mesh>
      ))}
    </group>
  );
}

function LoungeChair({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.16, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.72, -0.24]} castShadow receiveShadow>
        <boxGeometry args={[0.88, 0.72, 0.18]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      {[-0.3, 0.3].map((x, index) => (
        <mesh key={`chair-arm-${index}`} position={[x, 0.52, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.34, 0.72]} />
          <meshStandardMaterial color="#A58B72" roughness={0.76} />
        </mesh>
      ))}
      {[-0.28, 0.28].map((x, index) =>
        [-0.22, 0.22].map((z, innerIndex) => (
          <mesh key={`chair-leg-${index}-${innerIndex}`} position={[x, 0.17, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.32, 10]} />
            <meshStandardMaterial color="#92765A" roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

export default function BreakRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11.2, 0.018, 7.1]} receiveShadow>
        <planeGeometry args={[7.2, 6.2]} />
        <meshStandardMaterial color="#EEE2D2" roughness={0.96} />
      </mesh>

      <mesh position={[11.2, 0.045, 7.1]} receiveShadow>
        <boxGeometry args={[7.26, 0.06, 6.26]} />
        <meshStandardMaterial color="#D3B48C" roughness={0.82} />
      </mesh>

      <group position={[11.05, 0, 8.42]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 0.22, 1.02]} />
          <meshStandardMaterial color="#D8C6B4" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.82, -0.33]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 0.92, 0.22]} />
          <meshStandardMaterial color="#CEB8A2" roughness={0.84} />
        </mesh>
        {[-1.18, 0, 1.18].map((x, index) => (
          <mesh key={`sofa-seat-${index}`} position={[x, 0.5, 0.05]} castShadow>
            <boxGeometry args={[0.96, 0.16, 0.72]} />
            <meshStandardMaterial color="#E6D8C8" roughness={0.88} />
          </mesh>
        ))}
      </group>

      <group position={[12.95, 0, 7.25]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.95, 0.18, 0.92]} />
          <meshStandardMaterial color="#D9C7B1" roughness={0.86} />
        </mesh>
        <mesh position={[-0.68, 0.68, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.58, 0.7, 0.92]} />
          <meshStandardMaterial color="#CEB8A2" roughness={0.84} />
        </mesh>
        <mesh position={[0.22, 0.46, 0]} castShadow>
          <boxGeometry args={[0.86, 0.08, 0.68]} />
          <meshStandardMaterial color="#E9DFD2" roughness={0.88} />
        </mesh>
      </group>

      <LoungeChair position={[9.55, 0, 6.45]} rotation={[0, 0.72, 0]} color="#CFC7BC" />
      <LoungeChair position={[11.1, 0, 5.48]} rotation={[0, 0.06, 0]} color="#D9D0C4" />
      <LoungeChair position={[12.85, 0, 6.35]} rotation={[0, -0.76, 0]} color="#C9BBAA" />

      <group position={[10.45, 0, 7.0]}>
        <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.54, 0.6, 0.18, 20]} />
          <meshStandardMaterial color="#E8E2D8" roughness={0.46} />
        </mesh>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 0.22, 12]} />
          <meshStandardMaterial color="#A78C73" roughness={0.7} />
        </mesh>
      </group>

      <group position={[11.95, 0, 6.95]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.12, 0.92]} />
          <meshStandardMaterial color="#EFE9DE" roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.26, 12]} />
          <meshStandardMaterial color="#9F8368" roughness={0.7} />
        </mesh>
      </group>

      <group position={[13.62, 0.62, 7.15]}>
        <mesh>
          <boxGeometry args={[0.05, 1.08, 3.3]} />
          <meshStandardMaterial color="#DDE6EA" transparent opacity={0.18} roughness={0.14} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.56, 0]}>
          <boxGeometry args={[0.08, 0.06, 3.34]} />
          <meshStandardMaterial color="#D7C8B4" roughness={0.7} />
        </mesh>
      </group>

      <PottedPlant position={[9.1, 0, 8.95]} scale={1.05} />
      <PottedPlant position={[13.15, 0, 8.95]} />
      <PottedPlant position={[13.25, 0, 5.1]} scale={0.88} />
    </group>
  );
}
