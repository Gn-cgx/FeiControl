'use client';

export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.78} color="#FFF9F1" />

      <directionalLight
        position={[-8, 14, 10]}
        intensity={1.18}
        color="#FFF5E8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <hemisphereLight args={['#FEFCF7', '#C7B398', 0.38]} />

      <directionalLight position={[-15, 6, 2]} intensity={0.34} color="#F6FCFF" />
      <directionalLight position={[15, 6, 2]} intensity={0.28} color="#F2FBFF" />

      <pointLight position={[0, 4.3, -0.5]} intensity={0.26} color="#FFF1D8" distance={11} />
      <pointLight position={[11.2, 2.8, 7.1]} intensity={0.32} color="#FFEED6" distance={9} />
      <pointLight position={[-11.0, 3.0, -4.8]} intensity={0.18} color="#F5EEDF" distance={7} />
    </>
  );
}
