import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'GEMINI_API_KEY';
const MODEL_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const gemini = {
  getApiKey: () => AsyncStorage.getItem(STORAGE_KEY),

  setApiKey: (key: string) =>
    key.trim() ? AsyncStorage.setItem(STORAGE_KEY, key.trim()) : AsyncStorage.removeItem(STORAGE_KEY),

  hasApiKey: async () => {
    const key = await AsyncStorage.getItem(STORAGE_KEY);
    return !!key?.trim();
  },

  sendMessage: async (history: GeminiMessage[], systemContext: string): Promise<string> => {
    const apiKey = await AsyncStorage.getItem(STORAGE_KEY);
    if (!apiKey) throw new Error('Gemini API key not set');

    const res = await fetch(`${MODEL_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContext }] },
        contents: history,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
  },
};
