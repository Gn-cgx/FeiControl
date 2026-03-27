'use client';

import { Box } from '@react-three/drei';

/**
 * TVScreen — 办公室大电视 / 投影屏
 * 放在 agent 桌子前方（后墙上），所有 agent 面朝中心时可以看到。
 */
export default function TVScreen() {
  return (
    <group position={[0, 3.8, -9.6]} rotation={[0, 0, 0]}>
      {/* TV 边框 — 深色铝合金质感 */}
      <Box args={[6, 3.2, 0.15]} castShadow>
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.25} />
      </Box>

      {/* 屏幕面板 — 略微发光 */}
      <Box args={[5.6, 2.8, 0.02]} position={[0, 0, 0.08]}>
        <meshStandardMaterial
          color="#0d1b2a"
          emissive="#1a3a5c"
          emissiveIntensity={0.6}
          metalness={0.1}
          roughness={0.3}
        />
      </Box>

      {/* 屏幕上的内容条纹（模拟显示内容） */}
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

      {/* 屏幕中心大文字区域 */}
      <Box args={[3.0, 0.6, 0.005]} position={[0, 0.1, 0.1]}>
        <meshStandardMaterial
          color="#81d4fa"
          emissive="#81d4fa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </Box>

      {/* 底部支架 — 细长金属柱 */}
      <Box args={[0.15, 1.2, 0.15]} position={[0, -2.2, 0.3]} castShadow>
        <meshStandardMaterial color="#2c2c2c" metalness={0.8} roughness={0.2} />
      </Box>

      {/* 底座 */}
      <Box args={[1.8, 0.08, 0.8]} position={[0, -2.8, 0.3]} castShadow>
        <meshStandardMaterial color="#2c2c2c" metalness={0.8} roughness={0.2} />
      </Box>

      {/* 屏幕发出的环境光 */}
      <pointLight
        position={[0, 0, 1.5]}
        color="#4fc3f7"
        intensity={0.8}
        distance={8}
      />
    </group>
  );
}
