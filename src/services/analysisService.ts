
import { AnalysisResults } from "@/components/ResultsDisplay";

// Use localhost API instead of mock data
export const analyzeBreathingAudio = async (audioBlob: Blob): Promise<AnalysisResults> => {
  try {
    // Create form data to send audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    
    // Call the local API endpoint
    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      console.log("for some reason here" + response.status)
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(data)
    return data;

  } catch (error) {
    console.error('Error calling local API:', error);
    // Return fallback data in case of error
    return {
      prediction: {
        disease: "API Connection Error",
        confidence: 0,
        risk_level: "high"
      },
      audio_quality: {
        clarity: 0,
        background_noise: 100
      },
      recommendation: "Unable to connect to the Server."
    };
  }
};

