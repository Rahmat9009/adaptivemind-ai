"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { getConstellationRadius, learningDNAVisuals } from "@/lib/learning-dna-visuals";
import { SceneFallback } from "./SceneFallback";

interface SceneGroup { rotation: { x: number; y: number }; }

function Constellation({ scores, activeDimension }: { scores: LearningScores; activeDimension?: LearningDimension }) {
  const group = useRef<SceneGroup>(null);
  useFrame((state, delta) => { if (!group.current) return; group.current.rotation.y += (state.pointer.x * 0.18 - group.current.rotation.y) * delta * 2; group.current.rotation.x += (-state.pointer.y * 0.1 - group.current.rotation.x) * delta * 2; });
  const positions = learningDimensions.flatMap((dimension) => learningDNAVisuals[dimension].position);
  return <group ref={group}><ambientLight intensity={0.9} /><pointLight position={[2, 3, 4]} intensity={15} color="#c4b5fd" />{learningDimensions.map((dimension) => { const radius = getConstellationRadius(scores, dimension) * (activeDimension === dimension ? 1.24 : 1); return <mesh key={dimension} position={learningDNAVisuals[dimension].position}><sphereGeometry args={[radius, 28, 28]} /><meshStandardMaterial color={learningDNAVisuals[dimension].color} emissive={learningDNAVisuals[dimension].color} emissiveIntensity={activeDimension === dimension ? 0.8 : 0.34} roughness={0.3} /></mesh>; })}<line><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(positions), 3]} /></bufferGeometry><lineBasicMaterial color="#dbeafe" transparent opacity={0.45} /></line></group>;
}

export default function AdaptiveScene({ scores, activeDimension }: { scores: LearningScores; activeDimension?: LearningDimension }) {
  return <Canvas fallback={<SceneFallback scores={scores} />} dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 48 }} gl={{ antialias: true, alpha: true }}><Constellation scores={scores} activeDimension={activeDimension} /></Canvas>;
}
