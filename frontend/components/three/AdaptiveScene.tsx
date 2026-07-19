"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { getConstellationRadius, learningDNAVisuals } from "@/lib/learning-dna-visuals";

function Constellation({
  scores,
  activeDimension,
}: {
  scores: LearningScores;
  activeDimension?: LearningDimension;
}) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += (state.pointer.x * 0.12 - group.current.rotation.y) * delta * 1.8;
    group.current.rotation.x += (-state.pointer.y * 0.06 - group.current.rotation.x) * delta * 1.8;
  });

  return (
    <group ref={group}>
      {/* Ambient & key light */}
      <ambientLight intensity={0.6} />
      <pointLight position={[2, 3, 6]} intensity={8} color="#c4b5fd" />
      <pointLight position={[-3, -1, 4]} intensity={4} color="#22d3ee" />

      {/* Connection lines between nodes */}
      {(() => {
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
          [0, 2], [1, 3],
        ];
        const connPositions = connections.flatMap(([i, j]) => [
          ...learningDimensions.flatMap((dim) => learningDNAVisuals[dim].position).slice(i * 3, i * 3 + 3),
          ...learningDimensions.flatMap((dim) => learningDNAVisuals[dim].position).slice(j * 3, j * 3 + 3),
        ]);
        const arr = new Float32Array(connPositions);
        return (
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[arr, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#c4b5fd" transparent opacity={0.2} />
          </lineSegments>
        );
      })()}

      {/* Nodes */}
      {learningDimensions.map((dimension) => {
        const radius = getConstellationRadius(scores, dimension);
        const isActive = activeDimension === dimension;
        const color = learningDNAVisuals[dimension].color;

        return (
          <group key={dimension} position={learningDNAVisuals[dimension].position}>
            {/* Outer glow */}
            <mesh>
              <sphereGeometry args={[radius * 1.6, 16, 16]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isActive ? 0.15 : 0.06}
              />
            </mesh>
            {/* Core */}
            <mesh>
              <sphereGeometry args={[radius, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isActive ? 0.6 : 0.25}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
            {/* Active ring */}
            {isActive && (
              <mesh>
                <ringGeometry args={[radius * 1.3, radius * 1.5, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} side={2} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function AdaptiveScene({
  scores,
  activeDimension,
}: {
  scores: LearningScores;
  activeDimension?: LearningDimension;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Constellation scores={scores} activeDimension={activeDimension} />
    </Canvas>
  );
}
