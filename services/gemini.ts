
import { GoogleGenAI, Modality } from "@google/genai";

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioCtx;
};

/**
 * Decodes raw PCM data into an AudioBuffer.
 * Uses a sliced buffer to ensure memory alignment for Int16Array.
 */
const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  // Create a copy of the buffer to ensure it is correctly aligned for Int16 viewing
  const alignedBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const dataInt16 = new Int16Array(alignedBuffer);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit PCM to float range [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

/**
 * Fallback to built-in browser speech (Web Speech API).
 * Useful for quota limits, lack of API key, or connectivity issues.
 */
const playWithWebSpeech = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.error("[TTS Fallback] Web Speech API not supported.");
    return;
  }

  // Cancel any existing speech to avoid queuing delays
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Browsers load voices asynchronously. If empty, the default voice is used.
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))) 
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0];

  if (preferredVoice) utterance.voice = preferredVoice;

  // Cheerful settings for a toddler game
  utterance.pitch = 1.3; 
  utterance.rate = 0.95;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
  console.log("[TTS Fallback] Speaking via Web Speech API");
};

/**
 * Main instruction player. Attempts Gemini TTS first, fallbacks to browser TTS on failure.
 */
export const playInstruction = async (text: string) => {
  console.log(`[TTS] Request: "${text}"`);
  
  // Check for API Key
  if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
    console.warn("[TTS] Missing API Key. Using fallback.");
    playWithWebSpeech(text);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say in a high-pitched, happy, excited voice for a 3-year-old: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    const audioCtx = getAudioContext();
    
    // Crucial for browser autoplay policies
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const decodedRaw = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedRaw, audioCtx, 24000, 1);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
    
    console.log("[TTS] Audio playing via Gemini API");
  } catch (error: any) {
    // Handle Quota (429) or any other network/logic error
    console.warn("[TTS] Gemini API error, falling back:", error?.message || error);
    playWithWebSpeech(text);
  }
};
