
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ComicFace, INITIAL_PAGES, GATE_PAGE } from './types';
import { LoadingFX } from './LoadingFX';

const BLKOUT_LOGO_WHITE = "https://file-service-1033285141676.us-central1.run.app/files/84a26e84-1840-420a-8d76-13a85b986e3f";

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[]; // Needed for cover "printing" status
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    isVisible?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ face, allFaces, onChoice, onOpenBook, onDownload, onReset, isVisible = true }) => {
    const [isShaking, setIsShaking] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isVisible) setIsShaking(false);
    }, [isVisible]);

    const handleChoice = (pageIndex: number, choice: string) => {
        setIsShaking(true);
        setTimeout(() => {
            onChoice(pageIndex, choice);
        }, 300);
        setTimeout(() => setIsShaking(false), 500);
    };

    const handleCopyUrl = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (face?.imageUrl) {
            try {
                await navigator.clipboard.writeText(face.imageUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    if (!face) return <div className="w-full h-full bg-gray-950" />;
    if (face.isLoading && !face.imageUrl) return <LoadingFX />;
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''} ${isShaking ? 'animate-shake' : ''}`}>
             <style>{`
                @keyframes panel-zoom {
                    0% { transform: scale(0.96); opacity: 0; filter: blur(2px); }
                    100% { transform: scale(1); opacity: 1; filter: blur(0); }
                }
                @keyframes panel-shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-1deg); }
                    20%, 40%, 60%, 80% { transform: translateX(4px) rotate(1deg); }
                }
                .animate-panel-entry {
                    animation: panel-zoom 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .animate-shake {
                    animation: panel-shake 0.4s ease-in-out;
                }
            `}</style>
            
            <div className="gloss"></div>
            
            {face.imageUrl && (
                 <div className={`w-full h-full overflow-hidden ${isVisible ? 'animate-panel-entry' : ''} transition-all duration-500 ease-out transform hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,215,0,0.25)] relative`}>
                     <img src={face.imageUrl} alt="Comic panel" className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />
                     
                     {/* Copy URL Button */}
                     <button
                        onClick={handleCopyUrl}
                        className="absolute top-2 right-2 z-40 bg-black/60 backdrop-blur-sm text-white p-2 rounded border border-white/20 hover:bg-black/80 hover:border-yellow-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Copy Image URL"
                    >
                        {isCopied ? (
                            <span className="text-xs font-bold text-green-400 font-comic tracking-wider">COPIED!</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        )}
                    </button>
                 </div>
            )}
            
            {/* Decision Buttons */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-6 pb-12 flex flex-col gap-3 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20`}>
                    <p className="text-white font-comic text-2xl uppercase tracking-widest animate-pulse">What drives you?</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) handleChoice(face.pageIndex, choice); }}
                          className={`comic-btn w-full py-3 text-xl font-bold tracking-wider ${i===0?'bg-yellow-400 hover:bg-yellow-300':'bg-blue-500 text-white hover:bg-blue-400'}`}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-20 inset-x-0 flex justify-center z-20">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-10 py-4 text-3xl font-bold hover:scale-105 animate-bounce disabled:animate-none disabled:bg-gray-400 disabled:cursor-wait">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING... ${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES}` : 'READ ISSUE #1'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6 text-center z-30 animate-in fade-in duration-700 bg-gradient-to-b from-black/80 via-black/60 to-black/80">
                    {/* Top Section: Logo and Title */}
                    <div className="w-full flex flex-col items-center pt-4">
                        <img src={BLKOUT_LOGO_WHITE} alt="BLKOUT UK" className="w-32 mb-3 opacity-80 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-300" />
                        <h2 className="font-comic text-3xl text-yellow-400 drop-shadow-[0_2px_0_rgba(0,0,0,1)] uppercase tracking-wider">The Fight Has Just Begun</h2>
                    </div>

                    {/* Middle Section: CTA (positioned to not cover the image too much) */}
                    <div className="flex flex-col gap-2.5 w-full max-w-xs">
                         <button onClick={(e) => { e.stopPropagation(); onDownload(); }}
                            className="comic-btn bg-yellow-500 text-black px-6 py-3.5 text-lg font-bold hover:bg-yellow-400 flex items-center justify-center gap-2 hover:scale-105 shadow-lg">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                             <span>DOWNLOAD ISSUE #1</span>
                         </button>

                         <a href="https://blkoutuk.com" target="_blank" rel="noreferrer"
                            className="comic-btn bg-blue-600 text-white px-6 py-2.5 text-base font-bold hover:bg-blue-500 flex items-center justify-center gap-2 no-underline hover:scale-105 border border-white/20">
                             <span>JOIN THE MOVEMENT</span>
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                         </a>
                    </div>

                    {/* Bottom Section: Secondary Actions */}
                    <div className="w-full flex flex-col items-center gap-3 pb-2">
                        <p className="text-white/90 font-sans text-sm max-w-sm leading-snug backdrop-blur-sm bg-black/30 px-4 py-2 rounded">
                            Amplifying Black queer voices. <span className="text-yellow-400 font-bold">Co-produce</span> the future with us.
                        </p>

                        <div className="flex gap-2 w-full max-w-xs">
                            <a href="mailto:info@blkoutuk.com?subject=OOMF%20Co-Production%20Interest"
                               className="flex-1 comic-btn bg-gray-800/80 text-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-700 border border-gray-600 hover:scale-105 no-underline">
                                CONTACT US
                            </a>
                            <button onClick={(e) => { e.stopPropagation(); onReset(); }}
                                className="flex-1 comic-btn bg-gray-800/80 text-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-700 border border-gray-600 hover:scale-105">
                                NEW STORY
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
