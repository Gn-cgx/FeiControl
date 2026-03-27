'use client';

interface ScrollPaintingProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function ScrollPainting({ position, rotation = [0, 0, 0] }: ScrollPaintingProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.3, 12]} />
        <meshStandardMaterial color="#6A4527" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.55, 0.03]}>
        <planeGeometry args={[0.82, 1.02]} />
        <meshStandardMaterial color="#F0E2C5" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.88, 0.04]}>
        <boxGeometry args={[0.52, 0.08, 0.02]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.22} roughness={0.45} />
      </mesh>
      <mesh position={[0.03, 0.56, 0.05]} rotation={[0, 0, Math.PI / 7]}>
        <boxGeometry args={[0.16, 0.62, 0.02]} />
        <meshStandardMaterial color="#738A6D" roughness={0.82} />
      </mesh>
      <mesh position={[-0.12, 0.44, 0.05]} rotation={[0, 0, -Math.PI / 9]}>
        <boxGeometry args={[0.12, 0.38, 0.02]} />
        <meshStandardMaterial color="#516B59" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
        <meshStandardMaterial color="#6A4527" roughness={0.75} />
      </mesh>
    </group>
  );
}

export default function StudyCorner() {
  const bookColors = ['#A53D3D', '#406D8A', '#D0A652', '#688C52', '#6B4E92', '#C47C44'];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-11.35, 0.012, -4.8]} receiveShadow>
        <planeGeometry args={[3.8, 3.2]} />
        <meshStandardMaterial color="#928167" roughness={0.95} />
      </mesh>

      <group position={[-12.7, 0, -4.75]}>
        <mesh position={[0, 1.58, 0]} castShadow>
          <boxGeometry args={[0.76, 3.16, 2.56]} />
          <meshStandardMaterial color="#4A3120" roughness={0.88} />
        </mesh>
        <mesh position={[0, 1.58, 0.02]}>
          <boxGeometry args={[0.62, 2.92, 2.28]} />
          <meshStandardMaterial color="#7D5837" roughness={0.78} />
        </mesh>
        {[0.44, 1.2, 1.96, 2.72].map((y, index) => (
          <mesh key={`shelf-${index}`} position={[0, y, 0]} castShadow>
            <boxGeometry args={[0.7, 0.07, 2.4]} />
            <meshStandardMaterial color="#5B3A22" roughness={0.82} />
          </mesh>
        ))}
        {[0.48, 1.24, 2.0].map((y, shelfIndex) =>
          [-0.82, -0.4, 0, 0.42, 0.82].map((z, bookIndex) => (
            <mesh
              key={`book-${shelfIndex}-${bookIndex}`}
              position={[0.01, y + 0.18, z]}
              rotation={[0, 0, (bookIndex % 2 === 0 ? 1 : -1) * 0.04]}
              castShadow
            >
              <boxGeometry args={[0.22, 0.36 + (bookIndex % 3) * 0.08, 0.16]} />
              <meshStandardMaterial color={bookColors[(shelfIndex + bookIndex) % bookColors.length]} roughness={0.72} />
            </mesh>
          ))
        )}
      </group>

      <ScrollPainting position={[-10.7, 2.25, -9.55]} />
      <ScrollPainting position={[-14.3, 2.15, -5.1]} rotation={[0, Math.PI / 2, 0]} />

      <group position={[-10.65, 0, -4.15]} rotation={[0, -0.18, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.45, 0.08, 0.76]} />
          <meshStandardMaterial color="#7A5533" roughness={0.75} />
        </mesh>
        {[-0.58, 0.58].map((x, index) =>
          [-0.26, 0.26].map((z, innerIndex) => (
            <mesh key={`desk-leg-${index}-${innerIndex}`} position={[x, 0.34, z]} castShadow>
              <boxGeometry args={[0.08, 0.68, 0.08]} />
              <meshStandardMaterial color="#53351E" roughness={0.82} />
            </mesh>
          ))
        )}
        <mesh position={[0.08, 0.79, 0.02]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.24]} />
          <meshStandardMaterial color="#2E2A28" roughness={0.96} />
        </mesh>
        <mesh position={[0.08, 0.83, 0.02]}>
          <boxGeometry args={[0.22, 0.01, 0.1]} />
          <meshStandardMaterial color="#1B1B1B" roughness={0.9} />
        </mesh>
        <group position={[-0.32, 0.8, -0.08]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.06, 0.32, 0.06]} />
            <meshStandardMaterial color="#6B4322" roughness={0.72} />
          </mesh>
          <mesh position={[0.22, 0.16, 0]} castShadow>
            <boxGeometry args={[0.06, 0.32, 0.06]} />
            <meshStandardMaterial color="#6B4322" roughness={0.72} />
          </mesh>
          <mesh position={[0.11, 0.32, 0]} castShadow>
            <boxGeometry args={[0.3, 0.04, 0.05]} />
            <meshStandardMaterial color="#8C6239" roughness={0.72} />
          </mesh>
          {[-0.03, 0.05, 0.13, 0.21].map((x, index) => (
            <mesh key={`brush-${index}`} position={[x, 0.11, 0]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 0.22 + index * 0.02, 8]} />
              <meshStandardMaterial color={index % 2 === 0 ? '#B98E5D' : '#5D3D21'} roughness={0.55} />
            </mesh>
          ))}
        </group>
      </group>

      <group position={[-10.0, 0, -5.35]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.18, 0.36, 12]} />
          <meshStandardMaterial color="#84603C" roughness={0.82} />
        </mesh>
        {[-0.08, 0, 0.08].map((x, index) => (
          <mesh key={`bamboo-stem-${index}`} position={[x, 0.6 + index * 0.04, index === 1 ? -0.04 : 0.03]} castShadow>
            <cylinderGeometry args={[0.03, 0.035, 0.84 + index * 0.1, 8]} />
            <meshStandardMaterial color={index === 1 ? '#4D7A43' : '#5F944F'} roughness={0.74} />
          </mesh>
        ))}
        {[
          [-0.16, 0.84, 0.03],
          [0.14, 0.92, -0.04],
          [-0.04, 1.02, 0.1],
          [0.05, 1.12, -0.12],
        ].map(([x, y, z], index) => (
          <mesh key={`bonsai-leaf-${index}`} position={[x, y, z]} rotation={[0, 0, index % 2 === 0 ? 0.5 : -0.5]} castShadow>
            <boxGeometry args={[0.24, 0.04, 0.12]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#5E8D56' : '#7CA16B'} roughness={0.82} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
