import * as THREE from 'three';

export const generateParticles = (count: number): { tree: Float32Array, sky: Float32Array, colors: Float32Array, sizes: Float32Array } => {
  const treeArray = new Float32Array(count * 3);
  const skyArray = new Float32Array(count * 3);
  const colorArray = new Float32Array(count * 3);
  const sizeArray = new Float32Array(count);

  const treeHeight = 15;
  const treeBaseRadius = 6;

  const colorPalette = [
    new THREE.Color('#FFD700'), // Gold
    new THREE.Color('#FFFACD'), // LemonChiffon
    new THREE.Color('#E0FFFF'), // LightCyan
    new THREE.Color('#FFA500'), // Orange
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // --- TREE SHAPE (Cone/Spiral) ---
    // More particles at the bottom, fewer at top
    const yRatio = Math.pow(Math.random(), 0.8); // Bias slightly towards bottom
    const y = yRatio * treeHeight - (treeHeight / 2); // Center vertically roughly
    const r = (1 - yRatio) * treeBaseRadius;
    
    // Spiral angle + randomness
    const angle = yRatio * 25 + Math.random() * Math.PI * 2; 
    
    // Add some noise to volume so it's not a perfect shell
    const noiseR = r + (Math.random() - 0.5) * 1.5; 

    treeArray[i3] = Math.cos(angle) * noiseR;
    treeArray[i3 + 1] = y;
    treeArray[i3 + 2] = Math.sin(angle) * noiseR;

    // --- SKY SHAPE (Sphere/Explosion) ---
    // Random point on a large sphere surface or volume
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = 30 + Math.random() * 20; // Distance from center

    skyArray[i3] = radius * Math.sin(phi) * Math.cos(theta);
    skyArray[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    skyArray[i3 + 2] = radius * Math.cos(phi);

    // --- COLORS ---
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colorArray[i3] = color.r;
    colorArray[i3 + 1] = color.g;
    colorArray[i3 + 2] = color.b;

    // --- SIZES ---
    sizeArray[i] = Math.random() * 0.5 + 0.1;
  }

  return { tree: treeArray, sky: skyArray, colors: colorArray, sizes: sizeArray };
};