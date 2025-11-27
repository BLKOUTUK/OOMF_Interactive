
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, VISUAL_STYLES, TONES, LANGUAGES, CITIES, ComicFace, Beat, Persona, ROLES } from './types';
import { STORY_CONTEXT, NARRATIVE_VOICE } from './storyContext';
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

    // STORY ARC DEFINITION: The OOMF Origin - Enhanced with full context
    let instruction = "";

    // Chapter 1: The Call to Action (Pages 1-4)
    if (pageNum === 1) {
        instruction = `CHAPTER 1: THE CALL TO ACTION. ${STORY_CONTEXT.worldBuilding} Show ${selectedCity} beneath neon corporate billboards and algorithmic barriers. ${STORY_CONTEXT.theSignal} Visualize The Signal as flickering distortions erasing a vibrant Black queer cultural space. Include a recognizable ${selectedCity} landmark being consumed by digital voids. The tone is urgent yet poetic.`;
    } else if (pageNum === 2) {
        instruction = `CHAPTER 1 CONTINUED. ${STORY_CONTEXT.cipher} From ${STORY_CONTEXT.theArchive}, Cipher sends an encrypted message to ${role.name}. The message speaks of ${STORY_CONTEXT.theEcho}—erased, scattered, reduced to algorithmic afterthought. They are summoned to The Archive beneath the Thames. Use shadow, light, and whispered histories as visual metaphors.`;
    } else if (pageNum === 3) {
        instruction = `CHAPTER 1 CONTINUED. ${role.name} arrives at The Archive. Cipher stands before holographic projections of redacted documents, censored media, and digital voids where history used to be. He explains Urban Renewal 2.0—${STORY_CONTEXT.urbanRenewal} The room hums with tension and unspoken stories. Show the weight of systematic erasure.`;
    } else if (pageNum === 4) {
        instruction = `CHAPTER 1 CLIMAX. Cipher reveals The Nexus Engine—the only hope to unlock their suppressed potential. "You are already powerful. This will only reveal what The Signal tried to suppress in you." DECISION POINT: Ask the user how ${role.name} commits to The OOMF Initiative. Choices should reflect different aspects of resistance (memory, action, connection, defiance).`;

    // Chapter 2: The Awakening (Pages 5-8)
    } else if (pageNum === 5) {
        instruction = `CHAPTER 2: THE AWAKENING. ${STORY_CONTEXT.theNexusEngine} The recruits arrive—Fluxion, NovaCode, Lumina, VibraBolt (whoever ${role.name} is NOT). They exchange glances: fear, excitement, doubt. Show The Nexus Chamber as cathedral-like, pulsing with power, ancient-meets-futuristic. The moment before transformation.`;
    } else if (pageNum === 6) {
        instruction = `CHAPTER 2 CONTINUED. One by one, they step into The Nexus Engine's energy field. Visual spectacle: swirling light and code, bodies illuminated, data conduits glowing. ${role.name} feels the suppressed power awakening within them. Use imagery of light breaking through darkness, code rewriting itself, voices becoming audible.`;
    } else if (pageNum === 7) {
        instruction = `CHAPTER 2 CONTINUED. Powers manifest! ${role.name} discovers: ${role.power}. Show the specific visual of their ability. Fluxion bends time. NovaCode repairs corrupted data. Lumina projects lost visuals. VibraBolt amplifies silenced voices. The chamber shudders with energy. They are The OOMF now.`;
    } else if (pageNum === 8) {
        instruction = `CHAPTER 2 CLIMAX. The Nexus Chamber shudders violently. A pulse of distortion rips through The Archive—flickering error codes, dissonant frequencies. ${STORY_CONTEXT.theSignal} The Signal has detected them and is already fighting back. Cipher shouts: "The battle has already begun!" DECISION POINT: How does ${role.name} respond to The Signal's attack? Choices reflect different tactical approaches.`;

    // Chapter 3: The First Mission (Pages 9-12)
    } else if (pageNum === 9) {
        instruction = `CHAPTER 3: THE FIRST MISSION. The Signal's next target: the last underground house music sanctuary in ${selectedCity}. The OOMF counter-attack! Action sequence with ${role.name} and team using their powers. Fight with culture, energy, human connection—not just data. Use music/sound/light as weapons. Show digital infrastructure being hijacked, truth overwhelming misinformation.`;
    } else if (pageNum === 10) {
        instruction = `CHAPTER 3 CONTINUED. The team infiltrates The Signal's data vaults—a digital void that is dark, cold, corporate. They navigate through suppressed records and algorithmic barriers. ${role.name} uses ${role.power} to expose hidden truths. The vault resists, but they push through with coordinated effort. Show the contrast between sterile corporate space and vibrant cultural memory.`;
    } else if (pageNum === 11) {
        instruction = `CHAPTER 3 CLIMAX. The final blow! ${role.name} lands the decisive hack/broadcast/narrative takeover that breaks The Signal's hold. The Echo begins to re-emerge—not just as a place, but as a movement. Show the counter-rave gathering, people connecting, The Echo's legacy embedding itself so deeply that The Signal cannot erase it. Joy, struggle, resilience made visible.`;
    } else {
        instruction = `CHAPTER 3 RESOLUTION. The Echo returns to ${selectedCity}—vibrant, safe, pulsing with life. The crowd gathers as music rises. Cipher watches from rooftops: "They know who we are now. Which means we have their attention. The next move is ours." ${STORY_CONTEXT.resistance} The ending MUST bridge to BLKOUT UK's real mission: connecting Black queer communities to co-produce their own history. The fight has just begun.`;
    }

    const prompt = `
You are writing 'The OOMF Origin Story', an Afrofuturist Cyberpunk narrative set in ${selectedCity}. PAGE ${pageNum} of 12.

NARRATIVE VOICE: ${NARRATIVE_VOICE.tone}
AVOID: ${NARRATIVE_VOICE.avoid.join(', ')}
EMPHASIS: ${NARRATIVE_VOICE.emphasis}

LANGUAGE: ${langName}
USER CHARACTER: ${role.name} (Power: ${role.power})
MENTOR: ${STORY_CONTEXT.cipher}

STORY CONTEXT:
${STORY_CONTEXT.themes}

PREVIOUS PANELS:
${historyText.length > 0 ? historyText : "This is the beginning."}

INSTRUCTION FOR THIS PAGE: ${instruction}

OUTPUT STRICT JSON ONLY:
{
  "caption": "Narrative text in ${langName}. ${richMode ? 'Max 35 words. Poetic yet urgent, use vivid sensory details.' : 'Max 15 words. Punchy and evocative.'}",
  "dialogue": "Character speech in ${langName}. Essential lines only. Make it feel authentic and weighty.",
  "scene": "Visual description for image generator. MUST explicitly name ${role.name} if they appear. MUST name CIPHER if they appear. Include ${selectedCity} landmarks where relevant. Use cyberpunk and Afrofuturist visual language: neon, data streams, holographic projections, cultural symbols.",
  "focus_char": "hero" (${role.name}) or "friend" (Cipher) or "other" (Team/Signal),
  "choices": ["Option A", "Option B"] (Only if decision page - make choices meaningful and reflect different resistance strategies)
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
    const role = ROLES.find(r => r.id === selectedRoleID) || ROLES[0];

    // Add reference images with detailed descriptions
    if (heroRef.current?.base64) {
        contents.push({ text: `REFERENCE IMAGE 1 - MAIN CHARACTER [${role.name}]: This is the protagonist. Their appearance, facial features, skin tone, hair style, and body type MUST remain exactly consistent across all panels. Pay special attention to distinctive features.` });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
    }
    if (friendRef.current?.base64) {
        contents.push({ text: "REFERENCE IMAGE 2 - MENTOR CIPHER: This is the mentor character. Their appearance, facial features, skin tone, hair style, and body type MUST remain exactly consistent across all panels. Cipher is a wise, tech-savvy strategist." });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.current.base64 } });
    }

    // Add first story panel as additional reference for consistency
    const firstStoryPanel = historyRef.current.find(f => f.type === 'story' && f.imageUrl && f.pageIndex === 1);
    if (firstStoryPanel?.imageUrl && type === 'story') {
        const base64Data = firstStoryPanel.imageUrl.split(',')[1];
        if (base64Data) {
            contents.push({ text: `REFERENCE IMAGE 3 - FIRST PANEL STYLE: This shows ${role.name} in the story's art style. Match this visual style, character rendering, and artistic approach for consistency.` });
            contents.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        }
    }

    const styleDescription = getStyleDescription(selectedGenre);

    let promptText = `${styleDescription} SETTING: Future ${selectedCity}. `;

    // Add character appearance descriptions from references
    const heroDesc = heroRef.current?.desc ? ` ${role.name} appearance: ${heroRef.current.desc}` : '';
    const cipherDesc = friendRef.current?.desc ? ` Cipher appearance: ${friendRef.current.desc}` : '';

    if (type === 'cover') {
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        promptText += `TYPE: Comic Book Cover. TITLE: "THE OOMF" (OR LOCALIZED IN ${langName.toUpperCase()}). Visual: Heroic team shot with [${role.name}] in center matching REFERENCE IMAGE 1 exactly.${heroDesc} ${selectedCity} skyline with recognisable landmarks in background with digital glitches.`;
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. Text: "JOIN THE RESISTANCE". Visual: A futuristic recruitment poster for 'The OOMF' resistance plastered on a textured urban wall in ${selectedCity}. Graffiti style, high contrast, defiant energy.`;
    } else {
        promptText += `TYPE: Vertical comic panel. SCENE: ${beat.scene}. `;
        promptText += `\n\nCRITICAL CHARACTER CONSISTENCY RULES:
- If scene mentions '${role.name}' or 'HERO': Render them EXACTLY matching REFERENCE IMAGE 1. Same face, same features, same appearance.${heroDesc}
- If scene mentions 'CIPHER': Render them EXACTLY matching REFERENCE IMAGE 2. Same face, same features, same appearance.${cipherDesc}
- If scene mentions team members (Fluxion, NovaCode, Lumina, VibraBolt): Render as distinct Black queer sci-fi characters with consistent futuristic attire.
- Maintain consistent character appearance throughout the story. Do not alter facial features, skin tone, or distinctive characteristics.`;

        if (beat.caption) promptText += `\n\nINCLUDE CAPTION BOX with text: "${beat.caption}"`;
        if (beat.dialogue) promptText += `\n\nINCLUDE SPEECH BUBBLE with text: "${beat.dialogue}"`;
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
    doc.save('The-OOMF-Origin.pdf');
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
