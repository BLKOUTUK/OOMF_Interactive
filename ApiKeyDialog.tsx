
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative max-w-lg w-full bg-[#111] border-[4px] border-yellow-500 shadow-[0px_0px_50px_rgba(255,215,0,0.2)] p-8 animate-in fade-in zoom-in duration-300">
        
        {/* Floating Icon Badge */}
        <div className="absolute -top-8 -left-8 w-24 h-24 bg-black rounded-full flex items-center justify-center border-4 border-yellow-500 shadow-[0px_0px_20px_rgba(255,215,0,0.5)]">
           <span className="text-5xl">🗝️</span>
        </div>

        <h2 className="font-comic text-4xl text-yellow-500 mb-2 uppercase tracking-wide leading-none" style={{textShadow: '0px 0px 10px rgba(255,215,0,0.5)'}}>
          Archive Access Required
        </h2>
        
        <p className="font-comic text-xl text-gray-300 mb-6 leading-relaxed">
          Agent! To access The Archive and initiate the OOMF protocol, you need a <span className="font-bold text-yellow-400 border-b border-yellow-400">Paid API Key</span>.
        </p>

        <div className="bg-gray-900 border border-gray-700 p-4 mb-6 text-left relative">
             <div className="absolute -top-3 left-4 bg-yellow-500 text-black px-2 font-comic text-sm uppercase font-bold">Priority Message</div>
             <p className="font-sans text-sm text-gray-400 leading-relaxed">
                The simulation requires the advanced Gemini 3 Pro model. This is a billed service.
                <br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-yellow-500 underline hover:text-yellow-300 font-bold">Billing Documentation &rarr;</a>
             </p>
        </div>

        <button 
          onClick={onContinue}
          className="comic-btn bg-yellow-500 text-black text-2xl px-8 py-4 w-full hover:bg-yellow-400 transition-transform active:scale-95 uppercase tracking-widest font-bold shadow-[0px_0px_20px_rgba(255,215,0,0.4)]"
        >
          Authenticate Identity
        </button>
        
        <p className="text-center text-xs text-gray-600 mt-4 font-mono">ERROR_CODE: ACCESS_DENIED_BY_SIGNAL</p>
      </div>
    </div>
  );
};
