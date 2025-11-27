
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { VISUAL_STYLES, LANGUAGES, ROLES, CITIES, Persona } from './types';

const BLKOUT_HUB_LOGO = "https://file-service-1033285141676.us-central1.run.app/files/7b94924c-9f8e-4993-9c86-90f7a77e2f5f";

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    selectedGenre: string;
    selectedLanguage: string;
    selectedCity: string;
    customPremise: string;
    richMode: boolean;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onCityChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onLaunch: () => void;
}

const Footer = () => {
  const [remixIndex, setRemixIndex] = useState(0);
  const remixes = [
    "Reclaim The Echo",
    "Defeat The Signal",
    "Unlock The Nexus",
    "Amplify The Voice"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRemixIndex(prev => (prev + 1) % remixes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
        <div className="flex items-center gap-2 text-lg md:text-xl">
            <span className="text-yellow-400 font-bold">MISSION:</span>
            <span className="animate-pulse">{remixes[remixIndex]}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="text-gray-500 text-sm hidden md:inline">Powered by Gemini</span>
            <span className="text-white hover:text-yellow-400 transition-colors text-xl">The OOMF Origin</span>
        </div>
    </div>
  );
};

export const Setup: React.FC<SetupProps> = (props) => {
    // In this customized version, selectedGenre is used for "Visual Style"
    // We treat 'customPremise' as the "Selected Role ID" for simplicity of passing props without changing App interface too much, 
    // or we just reuse the props creatively.
    // Let's assume props.onPremiseChange stores the Role ID.
    
    // We need to initialize the role if empty
    useEffect(() => {
        if (!props.customPremise) {
            props.onPremiseChange(ROLES[0].id);
        }
    }, []);

    if (!props.show && !props.isTransitioning) return null;

    const currentRole = ROLES.find(r => r.id === props.customPremise) || ROLES[0];

    return (
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.1) rotate(-5deg); }
                100% { transform: translateY(-200vh) rotate(1080deg) scale(0.5); opacity: 1; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.5) rotate(10deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); opacity: 0; }
             }
          `}</style>
        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                 <div className="bg-black text-yellow-400 font-comic text-6xl p-4 border-4 border-white rotate-6 shadow-[10px_10px_0px_rgba(255,0,0,0.8)]">
                     THE SIGNAL DETECTED!
                 </div>
            </div>
        )}
        
        <div className={`fixed inset-0 z-[200] overflow-y-auto`}
             style={{
                 background: props.isTransitioning ? 'transparent' : 'rgba(10,10,15,0.95)', 
                 backdropFilter: props.isTransitioning ? 'none' : 'blur(8px)',
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          <div className="min-h-full flex items-center justify-center p-4 pb-32 md:pb-24">
            {/* Compacted width and internal spacing */}
            <div className="max-w-[900px] w-full bg-[#111] p-4 md:p-5 rotate-1 border-[6px] border-yellow-500 shadow-[0px_0px_30px_rgba(255,215,0,0.3)] text-center relative">
                
                {/* BLKOUT HUB SEAL */}
                <div className="absolute -top-10 -right-6 md:-right-10 z-20 transform rotate-12 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] pointer-events-none">
                    <img 
                        src={BLKOUT_HUB_LOGO} 
                        alt="BLKOUT HUB SEAL" 
                        className="w-28 h-28 md:w-36 md:h-36 opacity-100 animate-in zoom-in duration-500" 
                    />
                </div>

                <h1 className="font-comic text-6xl text-white leading-none mb-1 tracking-wide inline-block mr-3" style={{textShadow: '3px 3px 0px #d946ef'}}>THE OOMF</h1>
                <h1 className="font-comic text-4xl text-yellow-400 leading-none mb-4 tracking-wide inline-block bg-black px-2 border border-yellow-400">ORIGIN STORY</h1>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4 text-left">
                    
                    {/* Left Column: Cast */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-white border-b-2 border-yellow-500 mb-1">1. ASSEMBLE THE TEAM</div>
                        
                        {/* ROLE SELECTOR */}
                        <div className="mb-2">
                            <p className="font-comic text-sm text-gray-400 mb-1">SELECT YOUR AGENT</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map(role => (
                                    <button 
                                        key={role.id}
                                        onClick={() => props.onPremiseChange(role.id)}
                                        className={`p-2 text-left border-2 transition-all ${props.customPremise === role.id ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-yellow-500'}`}
                                    >
                                        <div className="font-comic font-bold text-sm uppercase">{role.name.split(' (')[0]}</div>
                                        <div className="text-[10px] leading-tight opacity-80">{role.power}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* HERO UPLOAD */}
                        <div className={`p-3 border-2 border-dashed ${props.hero ? 'border-green-500 bg-green-900/20' : 'border-gray-500 bg-gray-900'} transition-colors relative group`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-comic text-base uppercase font-bold text-yellow-400">YOUR AVATAR ({currentRole.name.split(' (')[0]})</p>
                                {props.hero && <span className="text-green-400 font-bold font-comic text-xs animate-pulse">✓ SCANNED</span>}
                            </div>
                            
                            {props.hero ? (
                                <div className="flex gap-3 items-center mt-1">
                                     <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero Preview" className="w-16 h-16 object-cover border border-white shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-black" />
                                     <label className="cursor-pointer comic-btn bg-white text-black text-xs px-3 py-1 hover:bg-gray-200 transition-transform active:scale-95 uppercase">
                                         RETAKE
                                         <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                     </label>
                                </div>
                            ) : (
                                <label className="comic-btn bg-[#d946ef] text-white text-sm px-3 py-2 block w-full hover:bg-[#c026d3] cursor-pointer text-center">
                                    UPLOAD PHOTO
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>

                        {/* CIPHER UPLOAD */}
                        <div className={`p-3 border-2 border-dashed ${props.friend ? 'border-green-500 bg-green-900/20' : 'border-gray-500 bg-gray-900'} transition-colors mt-1`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-comic text-base uppercase font-bold text-cyan-400">CIPHER (THE MENTOR)</p>
                                {props.friend && <span className="text-green-400 font-bold font-comic text-xs animate-pulse">✓ SCANNED</span>}
                            </div>

                            {props.friend ? (
                                <div className="flex gap-3 items-center mt-1">
                                    <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star Preview" className="w-16 h-16 object-cover border border-white shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-black" />
                                    <label className="cursor-pointer comic-btn bg-white text-black text-xs px-3 py-1 hover:bg-gray-200 transition-transform active:scale-95 uppercase">
                                        RETAKE
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                    </label>
                                </div>
                            ) : (
                                <label className="comic-btn bg-cyan-600 text-white text-sm px-3 py-2 block w-full hover:bg-cyan-500 cursor-pointer text-center">
                                    UPLOAD MENTOR (Optional)
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-white border-b-2 border-yellow-500 mb-1">2. CONFIGURE REALITY</div>
                        
                        <div className="bg-gray-900 p-3 border-2 border-gray-700 h-full flex flex-col justify-between">
                            <div>
                                <div className="mb-4">
                                    <p className="font-comic text-sm mb-1 font-bold text-gray-300">VISUAL STYLE</p>
                                    <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className="w-full font-comic text-lg p-2 border border-gray-600 uppercase bg-black text-white cursor-pointer focus:outline-none focus:border-yellow-500 transition-all">
                                        {VISUAL_STYLES.map(g => <option key={g} value={g} className="text-white">{g}</option>)}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <p className="font-comic text-sm mb-1 font-bold text-gray-300">LOCATION</p>
                                    <select value={props.selectedCity} onChange={(e) => props.onCityChange(e.target.value)} className="w-full font-comic text-lg p-2 border border-gray-600 uppercase bg-black text-white cursor-pointer focus:outline-none focus:border-yellow-500 transition-all">
                                        {CITIES.map(c => <option key={c} value={c} className="text-white">{c}</option>)}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <p className="font-comic text-sm mb-1 font-bold text-gray-300">LANGUAGE</p>
                                    <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full font-comic text-lg p-2 border border-gray-600 uppercase bg-black text-white cursor-pointer">
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-white">{l.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="bg-black/50 p-2 border border-gray-700">
                                    <p className="font-comic text-yellow-500 text-sm mb-1">BRIEFING:</p>
                                    <p className="text-gray-400 text-xs leading-relaxed font-mono">
                                        The Signal is erasing Black queer spaces in {props.selectedCity}. The Echo has vanished. You have been chosen by Cipher to initiate the OOMF protocol and reclaim the narrative.
                                    </p>
                                </div>
                            </div>
                            
                            <label className="flex items-center gap-2 font-comic text-sm cursor-pointer text-gray-300 mt-2 p-1 hover:bg-gray-800 rounded border border-transparent hover:border-gray-600 transition-colors">
                                <input type="checkbox" checked={props.richMode} onChange={(e) => props.onRichModeChange(e.target.checked)} className="w-4 h-4 accent-yellow-500" />
                                <span className="">RICH NARRATIVE MODE</span>
                            </label>
                        </div>
                    </div>
                </div>

                <button onClick={props.onLaunch} disabled={!props.hero || props.isTransitioning} className="comic-btn bg-yellow-400 text-black text-3xl px-6 py-4 w-full hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed uppercase tracking-wider font-bold shadow-[4px_4px_0px_white]">
                    {props.isTransitioning ? 'INITIALIZING...' : 'ENTER THE ARCHIVE'}
                </button>
            </div>
          </div>
        </div>

        {/* Footer is only visible when setup is active */}
        <Footer />
        </>
    );
}
