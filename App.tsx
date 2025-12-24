import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarlightScene from './components/StarlightScene';
import { SparklesIcon } from 'lucide-react';

const App: React.FC = () => {
  const [progress, setProgress] = useState(0);

  // Determine message based on state
  const isFullSky = progress >= 0.98;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 2]}>
          <color attach="background" args={['#050505']} />
          <StarlightScene onProgressChange={setProgress} />
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.2} 
              luminanceSmoothing={0.9} 
              intensity={1.5} 
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* UI Overlay - Minimalist for Easter Egg */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 tracking-wider drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            Starlight Tree
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Web3D Christmas Experiment
          </p>
        </div>
      </div>

      {/* Finale Message - Only appears when completed */}
      <div className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-md px-6 z-10 flex flex-col items-center transition-opacity duration-1000 ${isFullSky ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex items-center space-x-2 text-yellow-200 animate-bounce">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-lg font-medium tracking-widest">MERRY CHRISTMAS</span>
            <SparklesIcon className="w-5 h-5" />
         </div>
      </div>

    </div>
  );
};

export default App;