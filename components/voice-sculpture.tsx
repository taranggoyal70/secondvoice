"use client";

import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { StudioPhase } from "@/lib/demo";

type VoiceSculptureProps = {
  phase: StudioPhase;
  progress: number;
  reducedMotion: boolean;
};

const COLOR_BY_PHASE: Record<StudioPhase, string> = {
  idle: "#8293a8",
  composing: "#3b63ff",
  speaking: "#ff654d",
  interrupted: "#ffcf40",
  complete: "#8df7c4",
  error: "#ff335f",
};

function Sculpture({ phase, progress, reducedMotion }: VoiceSculptureProps) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const targetColor = useMemo(() => new THREE.Color(COLOR_BY_PHASE[phase]), [phase]);
  const shards = useMemo(() => Array.from({ length: 34 }, (_, index) => index), []);

  useFrame((state, delta) => {
    if (!group.current || !core.current) return;
    const speed = phase === "speaking" ? 0.48 : phase === "interrupted" ? 0.08 : 0.2;
    if (!reducedMotion) {
      group.current.rotation.y += delta * speed;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.12;
      const pulse = phase === "speaking" ? 1 + Math.sin(state.clock.elapsedTime * 6) * 0.045 : 1;
      core.current.scale.setScalar(pulse);
    }
    const material = core.current.material as THREE.MeshPhysicalMaterial;
    material.color.lerp(targetColor, Math.min(1, delta * 4));
  });

  return (
    <group ref={group}>
      <Float speed={reducedMotion ? 0 : 1.15} rotationIntensity={0.15} floatIntensity={0.25}>
        <mesh ref={core}>
          <torusKnotGeometry args={[0.78, 0.23, 220, 24, 2, 3]} />
          <MeshDistortMaterial
            color={COLOR_BY_PHASE[phase]}
            roughness={0.2}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.14}
            distort={phase === "interrupted" ? 0.55 : 0.2}
            speed={reducedMotion ? 0 : phase === "speaking" ? 3.6 : 1.2}
          />
        </mesh>
      </Float>

      {shards.map((index) => {
        const angle = (index / shards.length) * Math.PI * 2;
        const spoken = index / shards.length <= progress;
        const radius = 1.55 + Math.sin(index * 1.7) * 0.18;
        return (
          <mesh
            key={index}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle * 2) * 0.34,
              Math.sin(angle) * radius * 0.52,
            ]}
            rotation={[angle * 0.15, -angle, angle * 0.35]}
            scale={[spoken ? 1.18 : 0.72, 1, 1]}
          >
            <boxGeometry args={[0.08, 0.3 + (index % 5) * 0.035, 0.045]} />
            <meshStandardMaterial
              color={spoken ? COLOR_BY_PHASE[phase] : "#56606d"}
              emissive={spoken ? COLOR_BY_PHASE[phase] : "#000000"}
              emissiveIntensity={spoken ? 1.4 : 0}
              transparent
              opacity={spoken ? 1 : 0.22}
            />
          </mesh>
        );
      })}

      <Sparkles
        count={phase === "speaking" ? 72 : 30}
        scale={4.5}
        size={1.4}
        speed={reducedMotion ? 0 : 0.35}
        opacity={0.34}
        color={COLOR_BY_PHASE[phase]}
      />
    </group>
  );
}

export function VoiceSculpture(props: VoiceSculptureProps) {
  return (
    <Canvas camera={{ position: [0, 0.2, 4.6], fov: 42 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#121820"]} />
      <fog attach="fog" args={["#121820", 5, 9]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 5]} intensity={3.2} color="#e8f0ff" />
      <pointLight position={[-3, -1, 2]} intensity={18} color="#355eff" distance={7} />
      <Sculpture {...props} />
    </Canvas>
  );
}
