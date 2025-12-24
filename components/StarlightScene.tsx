import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { generateParticles } from '../utils/geometryUtils';

// Shader for the stars to make them twinkle and round
const StarShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uOpacity: { value: 1.0 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aSize;
    attribute vec3 aColor;
    varying vec3 vColor;
    
    void main() {
      vColor = aColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // Simple twinkling effect based on time and position
      float twinkle = sin(uTime * 2.0 + position.x * 10.0) * 0.5 + 0.5;
      float finalSize = aSize * (0.8 + 0.4 * twinkle) * 20.0;

      gl_PointSize = finalSize * uPixelRatio * (10.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    uniform float uOpacity;

    void main() {
      // Circular particle
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;

      // Soft glow edge
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);

      gl_FragColor = vec4(vColor, uOpacity * strength);
    }
  `
};

// Santa Silhouette Component - Controlled by progress
const SantaSleigh: React.FC<{ progress: number }> = ({ progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Map progress (0 to 1) to X position (Right to Left)
      // We want Santa to cross the moon (x=0) roughly in the middle of the transition.
      // Start off-screen right (4) and end off-screen left (-4).
      const startX = 4;
      const endX = -4;
      
      const currentX = startX + (endX - startX) * progress;

      groupRef.current.position.x = currentX;
      
      // Add a little bobbing motion for life
      groupRef.current.position.y = Math.sin(time * 5) * 0.1;
      
      // Rotate reindeer slightly as they gallop
      groupRef.current.rotation.z = Math.sin(time * 10) * 0.05;
    }
  });

  const blackMaterial = new THREE.MeshBasicMaterial({ color: 'black' });

  return (
    <group ref={groupRef} position={[4, 0, 1.5]} scale={[0.3, 0.3, 0.3]}>
      {/* Sleigh Body */}
      <mesh position={[2, 0, 0]} material={blackMaterial}>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
      </mesh>
      {/* Sleigh Runner */}
      <mesh position={[2, -0.4, 0]} rotation={[0, 0, 0.1]} material={blackMaterial}>
        <boxGeometry args={[1.4, 0.1, 0.8]} />
      </mesh>
      
      {/* Santa */}
      <mesh position={[2, 0.5, 0]} material={blackMaterial}>
        <sphereGeometry args={[0.4, 16, 16]} />
      </mesh>
      <mesh position={[2.1, 0.8, 0]} material={blackMaterial}>
         <sphereGeometry args={[0.2, 16, 16]} />
      </mesh>

      {/* Reindeer 1 (Back) */}
      <group position={[0.5, 0, 0]}>
         <mesh position={[0, 0, 0]} material={blackMaterial} rotation={[0,0,Math.PI/2]}>
            <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
         </mesh>
         <mesh position={[-0.3, 0.4, 0]} material={blackMaterial}>
             <sphereGeometry args={[0.15]} />
         </mesh>
         <mesh position={[-0.3, 0.6, 0]} rotation={[0,0,0.5]} material={blackMaterial}>
             <capsuleGeometry args={[0.03, 0.4]} />
         </mesh>
      </group>

      {/* Reindeer 2 (Front) */}
      <group position={[-0.8, 0.1, 0]}>
         <mesh position={[0, 0, 0]} material={blackMaterial} rotation={[0,0,Math.PI/2]}>
            <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
         </mesh>
         <mesh position={[-0.3, 0.4, 0]} material={blackMaterial}>
             <sphereGeometry args={[0.15]} />
         </mesh>
          <mesh position={[-0.3, 0.6, 0]} rotation={[0,0,0.5]} material={blackMaterial}>
             <capsuleGeometry args={[0.03, 0.4]} />
         </mesh>
      </group>
       
       {/* Reins (Line) */}
      <mesh position={[0.8, 0.2, 0]} rotation={[0,0, -0.1]} material={blackMaterial}>
        <boxGeometry args={[2.5, 0.05, 0.05]} />
      </mesh>

    </group>
  );
};

interface StarlightSceneProps {
  onProgressChange: (progress: number) => void;
}

const StarlightScene: React.FC<StarlightSceneProps> = ({ onProgressChange }) => {
  const { gl } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const controlsRef = useRef<any>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Logic state
  const [totalRotation, setTotalRotation] = useState(0);
  const lastAzimuth = useRef<number>(0);
  
  // Data generation
  const particleCount = 4000;
  const { tree, sky, colors, sizes } = useMemo(() => generateParticles(particleCount), []);
  
  // Geometry buffers
  const currentPositions = useMemo(() => new Float32Array(tree), [tree]);

  useEffect(() => {
    // Initialize lastAzimuth
    if (controlsRef.current) {
        lastAzimuth.current = controlsRef.current.getAzimuthalAngle();
    }
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Handle Material Uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
    }

    // 2. Track Rotation Logic
    if (controlsRef.current) {
      const currentAzimuth = controlsRef.current.getAzimuthalAngle();
      let delta = currentAzimuth - lastAzimuth.current;

      // Handle wrap-around (e.g. going from PI to -PI)
      if (delta < -Math.PI) delta += 2 * Math.PI;
      if (delta > Math.PI) delta -= 2 * Math.PI;

      // Accumulate absolute rotation to trigger effect
      // We divide by 2*PI to get a 0-1 ratio for one full rotation
      const rotationIncrement = Math.abs(delta) / (Math.PI * 2);
      
      const newTotal = Math.min(Math.max(totalRotation + rotationIncrement, 0), 1.0);
      
      if (Math.abs(newTotal - totalRotation) > 0.0001) {
         setTotalRotation(newTotal);
         onProgressChange(newTotal); // Notify UI
         lastAzimuth.current = currentAzimuth;
      } else {
        lastAzimuth.current = currentAzimuth;
      }
    }

    // 3. Interpolate Positions based on totalRotation (0 to 1)
    if (pointsRef.current && pointsRef.current.geometry) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      // Easing function for smoother transition
      const t = 1 - Math.pow(1 - totalRotation, 3);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Lerp between Tree (start) and Sky (end)
        const tx = tree[i3];
        const ty = tree[i3+1];
        const tz = tree[i3+2];

        const sx = sky[i3];
        const sy = sky[i3+1];
        const sz = sky[i3+2];

        positions[i3] = tx + (sx - tx) * t;
        positions[i3+1] = ty + (sy - ty) * t;
        positions[i3+2] = tz + (sz - tz) * t;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={60} />
      <OrbitControls 
        ref={controlsRef} 
        enablePan={false} 
        enableZoom={true} 
        minDistance={5} 
        maxDistance={50}
        rotateSpeed={0.5}
        autoRotate={false}
      />
      
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={currentPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aColor"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
           <bufferAttribute
            attach="attributes-aSize"
            count={particleCount}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          attach="material"
          args={[StarShaderMaterial]}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Moon Group: Always visible, acts as tree topper and moon */}
      <group position={[0, 8, 0]}>
        {/* The Moon */}
        <mesh>
           <sphereGeometry args={[1.5, 32, 32]} />
           <meshBasicMaterial color="#FDFBD3" />
        </mesh>
        
        {/* Santa's Silhouette - controlled by rotation progress */}
        <SantaSleigh progress={totalRotation} />
      </group>
    </>
  );
};

export default StarlightScene;