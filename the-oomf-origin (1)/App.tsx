
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, VISUAL_STYLES, TONES, LANGUAGES, CITIES, ComicFace, Beat, Persona, ROLES } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';

// --- Constants ---
const MODEL_V3 = "gemini-3-pro-image-preview";
const MODEL_IMAGE_GEN_NAME = MODEL_V3;
const MODEL_TEXT_NAME = MODEL_V3;

const getStyleDescription = (styleName: string): string => {
  switch (styleName) {
      case "Multiverse Halftone (Spiderverse Style)":
          return "Style: Modern animated feature film aesthetic. Key elements: Halftone patterns (Ben-Day dots), chromatic aberration, slight color shifting, dynamic graffiti textures. Vibrant neon colors against deep blacks. Exaggerated perspective and framing.";
      case "Vintage 97 Cel-Shaded (X-Men Style)":
          return "Style: 1990s Saturday morning superhero animation. Key elements: Heavy black ink outlines, bold solid colors, dramatic cel-shading, hand-drawn aesthetic. Action cartoon look with muscular anatomy and dynamic lighting.";
      case "Sharp Urban Anime (Boondocks Style)":
          return "Style: Sharp urban anime aesthetic. Key elements: Crisp clean line work, expressive character designs, flat shading, sophisticated composition. Muted earth tones mixed with specific vibrant accents. Influenced by adult animation.";
      case "Afrofuturist Cyberpunk":
          return "Style: Afrofuturism meets Cyberpunk. Key elements: Neon-lit circuitry blended with traditional African patterns and textures. Gold accents, holographic displays, futuristic urban sprawl, bioluminescence.";
      case "Neon Noir Graphic Novel":
           return "Style: Gritty noir graphic novel. Key elements: High contrast chiaroscuro lighting, deep shadows, rain-slicked streets, limited color palette with splashes of neon pink and blue. Cinematic composition.";
      case "Afro-Punk Collage":
           return "Style: DIY Afro-Punk zine aesthetic. Key elements: Mixed media collage look, torn paper textures, spray paint splatter, xerox grain, bold typography elements, raw and energetic.";
      case "Neon Graffiti Futurism":
           return "Style: Future street art. Key elements: Glowing neon spray paint, wildstyle shapes, fluorescent colors, urban decay mixed with high-tech overlays.";
      case "Solarpunk Utopia":
           return "Style: Solarpunk. Key elements: Bright and optimistic, organic technology, art nouveau curves, lush greenery integrated with glass and gold metal, warm sunlight.";
      case "Digital Glitch Art":
           return "Style: Glitch aesthetic. Key elements: Datamoshing, pixel sorting, CRT monitor scanlines, digital artifacts, distorted reality, cyberpunk data corruption visuals.";
      case "Cinematic Photorealism":
           return "Style: High-budget sci-fi movie still. Key elements: Photorealistic textures, depth of field, volumetric lighting, lens flares, cinematic color grading.";
      default:
          return `Style: ${styleName}. High quality, distinct visual identity.`;
  }
};

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [selectedGenre, setSelectedGenre] = useState(VISUAL_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [selectedRoleID, setSelectedRoleID] = useState(ROLES[0].id); // Mapped from customPremise
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  
  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // --- Transition States ---
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);

  // --- AI Helpers ---
  const getAI = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  };

  const handleAPIError = (e: any) => {
    const msg = String(e);
    console.error("API Error:", msg);
    if (
      msg.includes('Requested entity was not found') || 
      msg.includes('API_KEY_INVALID') || 
      msg.toLowerCase().includes('permission denied')
    ) {
      setShowApiKeyDialog(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean): Promise<Beat> => {
    if (!heroRef.current) throw new Error("No Hero");

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
    const role = ROLES.find(r => r.id === selectedRoleID) || ROLES[0];

    // Get relevant history
    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const historyText = relevantHistory.map(p => 
      `[Page ${p.pageIndex}] [Focus: ${p.narrative?.focus_char}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}") (Scene: ${p.narrative?.scene}) ${p.resolvedChoice ? `-> USER CHOICE: "${p.resolvedChoice}"` : ''}`
    ).join('\n');

    // STORY ARC DEFINITION: The OOMF Origin
    let instruction = "";
    const chapter1 = `CHAPTER 1: THE CALL. ${selectedCity}. 'The Echo', a vital Black queer sanctuary, has been erased by 'The Signal' (a digital suppression entity).`;
    const chapter2 = "CHAPTER 2: THE AWAKENING. The Archive (Underground). Cipher activates the Nexus Engine. The team unlocks their latent powers. The Signal attacks.";
    const chapter3 = "CHAPTER 3: RECLAMATION. The Mission. The team fights back using culture and tech to restore The Echo. Victory.";

    if (pageNum === 1) {
        instruction = `${chapter1} INCITING INCIDENT. Establish the vibe of Future ${selectedCity}. Show 'The Signal' glitches erasing culture. Include a recognizable ${selectedCity} landmark in the background distorted by the glitch. Introduce the threat.`;
    } else if (pageNum === 2) {
        instruction = `${chapter1} RISING ACTION. Cipher (The Mentor) contacts ${role.name}. They are summoned to The Underground Archive beneath ${selectedCity}.`;
    } else if (pageNum === 3) {
        instruction = `${chapter1} DECISION POINT. ${role.name} arrives at The Archive. Cipher explains the stakes: 'Urban Renewal 2.0' is erasure of ${selectedCity}'s history. Ask the user: How do they commit to the fight?`;
    } else if (pageNum === 4) {
        instruction = `${chapter2} The team assembles. Introduce the others (Fluxion, NovaCode, Lumina, VibraBolt - whoever the user is NOT). They stand before The Nexus Engine.`;
    } else if (pageNum === 5) {
        instruction = `${chapter2} ACTIVATION. The Nexus Engine turns on. Energy floods the room. Visual spectacle.`;
    } else if (pageNum === 6) {
        instruction = `${chapter2} POWERS MANIFEST. ${role.name} uses their power: ${role.power}. SUDDENLY: The Signal invades the system! Drones appear!`;
    } else if (pageNum === 7) {
        instruction = `${chapter3} COUNTER-ATTACK. Action sequence! The OOMF team fights the drones/glitches. Use music/sound/light metaphors.`;
    } else if (pageNum === 8) {
        instruction = `${chapter3} THE INFILTRATION. They enter the digital void where 'The Echo' is trapped. It's dark, cold, corporate.`;
    } else if (pageNum === 9) {
        instruction = `${chapter3} CLIMAX. ${role.name} lands the final blow/hack/broadcast to break The Signal's hold. The Echo begins to materialize.`;
    } else {
        instruction = `${chapter3} RESOLUTION. The Echo returns to ${selectedCity}, vibrant and safe. Cipher speaks: "The Signal is everywhere, but so are we. We need more voices to build the future." The ending MUST explicitly bridge the story to the real world mission of BLKOUT UK: connecting Black queer communities to co-produce their own history.`;
    }

    const prompt = `
You are writing 'The OOMF Origin Story', an Afrofuturist Cyberpunk comic set in ${selectedCity}. PAGE ${pageNum}.
LANGUAGE: ${langName}.
USER CHARACTER: ${role.name} (Power: ${role.power}).
MENTOR: Cipher (Strategist).
THEME: Resistance against digital erasure.

PREVIOUS PANELS:
${historyText.length > 0 ? historyText : "Start the story."}

INSTRUCTION: ${instruction}
IMPORTANT: Ensure scene descriptions explicitly mention recognizable landmarks of ${selectedCity} where appropriate to ground the location.

OUTPUT STRICT JSON ONLY:
{
  "caption": "Narrative text in ${langName} (${richMode ? 'max 35 words' : 'max 15 words'}).",
  "dialogue": "Character speech in ${langName}. Essential lines only.",
  "scene": "Visual description for image generator. MENTION '${role.name}' explicitly if they appear. MENTION 'CIPHER' if they appear. Include ${selectedCity} landmarks if relevant.",
  "focus_char": "hero" (User) or "friend" (Cipher) or "other" (Team/Villain),
  "choices": ["Option A", "Option B"] (Only if decision page)
}
`;
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
        let rawText = res.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(rawText);
        
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage) parsed.choices = [];
        if (isDecisionPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["Fight for History", "Fight for Future"];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e) {
        console.error("Beat generation failed", e);
        handleAPIError(e);
        return { 
            caption: "System Error...", 
            scene: `Static and glitch artifacts.`, 
            focus_char: 'other', 
            choices: [] 
        };
    }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type']): Promise<string> => {
    const contents = [];
    if (heroRef.current?.base64) {
        contents.push({ text: "REFERENCE 1 [MAIN HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
    }
    if (friendRef.current?.base64) {
        contents.push({ text: "REFERENCE 2 [MENTOR CIPHER]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.current.base64 } });
    }

    const role = ROLES.find(r => r.id === selectedRoleID) || ROLES[0];
    const styleDescription = getStyleDescription(selectedGenre);
    
    let promptText = `${styleDescription} SETTING: Future ${selectedCity}. `;
    
    if (type === 'cover') {
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        promptText += `TYPE: Comic Book Cover. TITLE: "THE OOMF" (OR LOCALIZED IN ${langName.toUpperCase()}). Visual: Heroic team shot with [MAIN HERO] center. ${selectedCity} skyline with recognisable landmarks in background with digital glitches.`;
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. Text: "JOIN THE RESISTANCE". Visual: A futuristic recruitment poster for 'The OOMF' resistance plastered on a textured urban wall in ${selectedCity}. Graffiti style, high contrast, defiant energy.`;
    } else {
        promptText += `TYPE: Vertical comic panel. SCENE: ${beat.scene}. `;
        promptText += `CONTEXT: If scene mentions '${role.name}' or 'HERO', use REFERENCE 1. If scene mentions 'CIPHER', use REFERENCE 2. If scene mentions 'Fluxion', 'NovaCode', 'Lumina', or 'VibraBolt', render them as distinct sci-fi resistance fighters.`;
        
        if (beat.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
        if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;
    }

    contents.push({ text: promptText });

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: '2:3' } }
        });
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';
    } catch (e) { 
        handleAPIError(e);
        return ''; 
    }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      const isDecision = DECISION_PAGES.includes(pageNum);
      let beat: Beat = { scene: "", choices: [], focus_char: 'other' };

      if (type === 'cover') {
           // Cover beat handled in image gen
      } else if (type === 'back_cover') {
           beat = { scene: "Teaser", choices: [], focus_char: 'other' };
      } else {
           beat = await generateBeat(historyRef.current, pageNum % 2 === 0, pageNum, isDecision);
      }

      updateFaceState(faceId, { narrative: beat, choices: beat.choices, isDecisionPage: isDecision });
      const url = await generateImage(beat, type);
      updateFaceState(faceId, { imageUrl: url, isLoading: false });
  };

  const generateBatch = async (startPage: number, count: number) => {
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= TOTAL_PAGES && !generatingPages.current.has(p)) {
              pagesToGen.push(p);
          }
      }
      
      if (pagesToGen.length === 0) return;
      pagesToGen.forEach(p => generatingPages.current.add(p));

      const newFaces: ComicFace[] = [];
      pagesToGen.forEach(pageNum => {
          const type = pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story';
          newFaces.push({ id: `page-${pageNum}`, type, choices: [], isLoading: true, pageIndex: pageNum });
      });

      setComicFaces(prev => {
          const existing = new Set(prev.map(f => f.id));
          return [...prev, ...newFaces.filter(f => !existing.has(f.id))];
      });
      newFaces.forEach(f => { if (!historyRef.current.find(h => h.id === f.id)) historyRef.current.push(f); });

      try {
          for (const pageNum of pagesToGen) {
               await generateSinglePage(`page-${pageNum}`, pageNum, pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story');
               generatingPages.current.delete(pageNum);
          }
      } catch (e) {
          console.error("Batch generation error", e);
      } finally {
          pagesToGen.forEach(p => generatingPages.current.delete(p));
      }
  }

  const launchStory = async () => {
    // --- API KEY VALIDATION ---
    const hasKey = await validateApiKey();
    if (!hasKey) return; 
    
    if (!heroRef.current) return;
    setIsTransitioning(true);
    
    setStoryTone(TONES[0]); // Default tone

    const coverFace: ComicFace = { id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 };
    setComicFaces([coverFace]);
    historyRef.current = [coverFace];
    generatingPages.current.add(0);

    generateSinglePage('cover', 0, 'cover').finally(() => generatingPages.current.delete(0));
    
    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        await generateBatch(1, INITIAL_PAGES);
        generateBatch(3, 3);
    }, 1100);
  };

  const handleChoice = async (pageIndex: number, choice: string) => {
      updateFaceState(`page-${pageIndex}`, { resolvedChoice: choice });
      const maxPage = Math.max(...historyRef.current.map(f => f.pageIndex || 0));
      if (maxPage + 1 <= TOTAL_PAGES) {
          generateBatch(maxPage + 1, BATCH_SIZE);
      }
  }

  const resetApp = () => {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setFriend(null);
  };

  const downloadPDF = () => {
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = comicFaces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    });
    // Add timestamp to filename to encourage versioning
    doc.save(`The-OOMF-Origin-${Date.now()}.pdf`);
  };

  const handleHeroUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setHero({ base64, desc: "Main Agent" }); } catch (e) { alert("Upload failed"); }
  };
  const handleFriendUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setFriend({ base64, desc: "Cipher (Mentor)" }); } catch (e) { alert("Upload failed"); }
  };

  const handleSheetClick = (index: number) => {
      if (!isStarted) return;
      if (index === 0 && currentSheetIndex === 0) return;
      if (index < currentSheetIndex) setCurrentSheetIndex(index);
      else if (index === currentSheetIndex && comicFaces.find(f => f.pageIndex === index)?.imageUrl) setCurrentSheetIndex(prev => prev + 1);
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      
      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          hero={hero}
          friend={friend}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          selectedCity={selectedCity}
          customPremise={selectedRoleID} // Passing Role ID via customPremise prop
          richMode={richMode}
          onHeroUpload={handleHeroUpload}
          onFriendUpload={handleFriendUpload}
          onGenreChange={setSelectedGenre}
          onLanguageChange={setSelectedLanguage}
          onCityChange={setSelectedCity}
          onPremiseChange={setSelectedRoleID} // Using this handler for Role selection
          onRichModeChange={setRichMode}
          onLaunch={launchStory}
      />
      
      <Book 
          comicFaces={comicFaces}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          onSheetClick={handleSheetClick}
          onChoice={handleChoice}
          onOpenBook={() => setCurrentSheetIndex(1)}
          onDownload={downloadPDF}
          onReset={resetApp}
      />
    </div>
  );
};

export default App;
