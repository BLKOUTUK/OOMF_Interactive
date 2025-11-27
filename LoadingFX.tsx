
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

const LOADING_FX = [
    "POW!", "BAM!", "ZAP!", "KRAK!", "SKREEE!", "WHOOSH!", "THWIP!", "BOOM!", 
    "CRUNCH!", "SPLAT!", "KA-POW!", "ZZZT!", "CLANK!", "THUD!", "WHAM!"
];

const LOADING_STAGES = ["PENCILING...", "INKING...", "COLORING...", "LETTERING...", "PRINTING..."];

export const LoadingFX: React.FC = () => {
    const [particles, setParticles] = useState<{id: number, text: string, x: string, y: string, rot: number, color: string, scale: number}[]>([]);
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        // Particle effect loop
        const interval = setInterval(() => {
            const id = Date.now();
            const text = LOADING_FX[Math.floor(Math.random() * LOADING_FX.length)];
            const x = `${15 + Math.random() * 70}%`;
            const y = `${15 + Math.random() * 60}%`;
            const rot = Math.random() * 60 - 30;
            const colors = ['text-yellow-500', 'text-red-600', 'text-blue-500', 'text-orange-500', 'text-purple-600', 'text-green-500', 'text-pink-500'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const scale = 0.8 + Math.random() * 0.7; 
            
            setParticles(prev => [...prev, { id, text, x, y, rot, color, scale }].slice(-6));
        }, 500); 

        // Stage text loop
        const stageInterval = setInterval(() => {
            setStageIndex(prev => (prev + 1) % LOADING_STAGES.length);
        }, 1200);

        return () => {
            clearInterval(interval);
            clearInterval(stageInterval);
        };
    }, []);

    return (
        <div className="w-full h-full bg-white overflow-hidden relative border-r-4 border-gray-300 flex flex-col items-center justify-center">
            <style>{`
              @keyframes comic-pop {
                  0% { transform: translate(-50%, -50%) scale(0) rotate(var(--rot)); opacity: 0; }
                  20% { transform: translate(-50%, -50%) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(calc(var(--scale) * 1.2)) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes sketch-line {
                  0% { width: 0%; opacity: 0.5; }
                  50% { width: 100%; opacity: 1; }
                  100% { width: 100%; opacity: 0; }
              }
              @keyframes bg-pan {
                  0% { background-position: 0 0; }
                  100% { background-position: 20px 20px; }
              }
            `}</style>
            
            {/* Halftone background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2.5px)', 
                     backgroundSize: '20px 20px',
                     animation: 'bg-pan 4s linear infinite'
                 }}>
            </div>

            {/* Particles */}
            {particles.map(p => (
                <div key={p.id} 
                     className={`absolute font-comic font-black italic ${p.color} select-none whitespace-nowrap z-10 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]`}
                     style={{ 
                         left: p.x, 
                         top: p.y, 
                         fontSize: `${3 + p.scale}rem`,
                         '--rot': `${p.rot}deg`, 
                         '--scale': p.scale,
                         animation: 'comic-pop 1.4s forwards ease-out' 
                     } as React.CSSProperties}>
                    {p.text}
                </div>
            ))}

            {/* Loading Bar Container */}
            <div className="absolute bottom-20 w-3/4 max-w-[220px] z-20">
                <div className="font-comic text-2xl text-black font-bold text-center mb-2 tracking-wider drop-shadow-sm uppercase">
                    {LOADING_STAGES[stageIndex]}
                </div>
                <div className="h-6 border-4 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)] relative overflow-hidden -rotate-1">
                    <div className="absolute inset-y-0 left-0 bg-yellow-400 origin-left" 
                         style={{ 
                             animation: 'sketch-line 1.2s ease-in-out infinite',
                             backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)', 
                             backgroundSize: '1rem 1rem' 
                         }}>
                    </div>
                </div>
            </div>
        </div>
    );
};
