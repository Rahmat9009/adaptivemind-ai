"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef, useEffect } from "react";
import type { Group } from "three";
import * as THREE from "three";
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
  const isVisible = useRef(true);

  // Pause rotation when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      isVisible.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useFrame((state, delta) => {
    if (!group.current || !isVisible.current) return;
    group.current.rotation.y += (state.pointer.x * 0.12 - group.current.rotation.y) * delta * 1.8;
    group.current.rotation.x += (-state.pointer.y * 0.06 - group.current.rotation.x) * delta * 1.8;
  });

  // Memoize connection lines geometry
  const lineGeometry = useMemo(() => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
      [0, 2], [1, 3],
    ];
    const pos = learningDimensions.flatMap((dim) => learningDNAVisuals[dim].position);
    const connPositions = connections.flatMap(([i, j]) => [
      pos.slice(i * 3, i * 3 + 3),
      pos.slice(j * 3, j * 3 + 3),
    ]).flat();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(connPositions, 3));
    return geometry;
  }, []);

  return (
    <group ref={group}>
      {/* Ambient & key light — warm editorial */}
      <ambientLight intensity={0.6} />
      <pointLight position={[2, 3, 6]} intensity={6} color="#BDB8AF" />
      <pointLight position={[-3, -1, 4]} intensity={3} color="#E8E0D5" />

      {/* Connection lines */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#A1543C" transparent opacity={0.12} />
      </lineSegments>

      {/* Nodes */}
      {learningDimensions.map((dimension) => {
        const radius = getConstellationRadius(scores, dimension);
        const isActive = activeDimension === dimension;
        const color = learningDNAVisuals[dimension].color;
        const position = learningDNAVisuals[dimension].position;

        return (
          <group key={dimension} position={position}>
            <NodeSphere
              radius={radius}
              color={color}
              isActive={isActive}
            />
            {isActive && (
              <ActiveRing radius={radius} color={color} />
            )}
          </group>
        );
      })}
    </group>
  );
}

const NodeSphere = memo(function NodeSphere({
  radius,
  color,
  isActive,
}: {
  radius: number;
  color: string;
  isActive: boolean;
}) {
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(radius * 1.6, 16, 16), [radius]);
  const coreGeometry = useMemo(() => new THREE.SphereGeometry(radius, 20, 20), [radius]);

  return (
    <>
      {/* Outer glow */}
      <mesh geometry={glowGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isActive ? 0.15 : 0.06}
        />
      </mesh>
      {/* Core */}
      <mesh geometry={coreGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.25}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </>
  );
});

const ActiveRing = memo(function ActiveRing({
  radius,
  color,
}: {
  radius: number;
  color: string;
}) {
  const ringGeometry = useMemo(() => new THREE.RingGeometry(radius * 1.3, radius * 1.5, 32), [radius]);

  return (
    <mesh geometry={ringGeometry}>
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
});

const MemoizedConstellation = memo(Constellation);

function AdaptiveScene({
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
      <MemoizedConstellation scores={scores} activeDimension={activeDimension} />
    </Canvas>
  );
}

export default memo(AdaptiveScene);
