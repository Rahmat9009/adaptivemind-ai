"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { dnaHex, dnaPositions, dnaHexSoft, getConstellationRadius } from "@/lib/learning-dna-visuals";
import { SceneFallback } from "./SceneFallback";

interface SceneGroup { rotation: { x: number; y: number }; }
interface NodeMesh { scale: number; }

function constellationEdges(): ReadonlyArray<[LearningDimension, LearningDimension]> {
  return [
    ["visual", "examples"],
    ["examples", "analogies"],
    ["analogies", "stories"],
    ["stories", "challenges"],
    ["challenges", "visual"],
    ["visual", "analogies"],
    ["examples", "stories"],
  ];
}

function Constellation({
  scores,
  activeDimension,
}: {
  scores: LearningScores;
  activeDimension?: LearningDimension;
}) {
  const group = useRef<SceneGroup>(null);
  const nodes = useRef<(NodeMesh & { material: { opacity: number; emissiveIntensity: number } })[]>([]);

  // Gentle ambient rotation + pointer parallax — slow, meditative.
  useFrame((state, delta) => {
    if (!group.current) return;
    const targetY = state.pointer.x * 0.22;
    const targetX = -state.pointer.y * 0.12;
    group.current.rotation.y += (targetY - group.current.rotation.y) * delta * 1.6;
    group.current.rotation.x += (targetX - group.current.rotation.x) * delta * 1.6;

    // Breathing pulse on the active node only.
    const t = state.clock.elapsedTime;
    nodes.current.forEach((node, i) => {
      const dimension = learningDimensions[i];
      if (!node) return;
      if (activeDimension === dimension) {
        const breathe = 1 + Math.sin(t * 1.4) * 0.08;
        node.scale = breathe;
        node.material.emissiveIntensity = 0.85 + Math.sin(t * 1.4) * 0.2;
      } else {
        node.scale += (1 - node.scale) * delta * 4;
        node.material.emissiveIntensity += (0.4 - node.material.emissiveIntensity) * delta * 2;
      }
    });
  });

  const edges = useMemo(() => constellationEdges(), []);

  // Build edge vertex pairs for the connecting lines
  const edgePositions = useMemo(() => {
    const arr: number[] = [];
    edges.forEach(([a, b]) => {
      const pa = dnaPositions[a];
      const pb = dnaPositions[b];
      arr.push(...pa, ...pb);
    });
    return new Float32Array(arr);
  }, [edges]);

  return (
    <group ref={group}>
      <ambientLight intensity={0.75} />
      <pointLight position={[3, 4, 5]} intensity={18} color="#c4b5fd" />
      <pointLight position={[-3, -2, 2]} intensity={10} color="#2dd4bf" />

      {learningDimensions.map((dimension, index) => {
        const radius = getConstellationRadius(scores, dimension) * (activeDimension === dimension ? 1.18 : 1);
        const color = activeDimension === dimension ? dnaHexSoft[dimension] : dnaHex[dimension];
        return (
          <mesh
            key={dimension}
            position={dnaPositions[dimension]}
            ref={(m: unknown) => {
              if (m) nodes.current[index] = m as unknown as (NodeMesh & { material: { opacity: number; emissiveIntensity: number } });
            }}
          >
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.45}
              roughness={0.25}
              metalness={0.1}
              transparent
              opacity={0.96}
            />
          </mesh>
        );
      })}

      {/* Connecting network — thin, slightly translucent lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8e96bd" transparent opacity={0.32} />
      </lineSegments>

      {/* Inner core — a faint center sphere to give the constellation a "self" */}
      <mesh>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshBasicMaterial color="#c4caed" transparent opacity={0.18} />
      </mesh>
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
      fallback={<SceneFallback scores={scores} />}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.2], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Constellation scores={scores} activeDimension={activeDimension} />
    </Canvas>
  );
}
