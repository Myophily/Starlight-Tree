export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface ParticleData {
  treePositions: Float32Array;
  skyPositions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}