import AsyncStorage from '@react-native-async-storage/async-storage';

export const callGemini = async (prompt: string) => {
  const apiKey = await AsyncStorage.getItem('financehub_gemini_key') || ""; 
  
  if (!apiKey) {
    return "Please set your Gemini API Key in the settings to enable AI insights!";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (err) {
      if (attempt === 2) return "Error: Failed to connect to AI. Please check your key and connection.";
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
};
