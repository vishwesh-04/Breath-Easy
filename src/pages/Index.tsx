
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AudioRecorder from "@/components/AudioRecorder";
import ResultsDisplay, { AnalysisResults } from "@/components/ResultsDisplay";
import { analyzeBreathingAudio } from "@/services/analysisService";
import { Stethoscope, Info, FileAudio, ArrowRight, Activity } from "lucide-react";

const Index = () => {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState<"intro" | "record" | "results">("intro");

  const handleAudioCaptured = async (audioBlob: Blob) => {
    try {
      setIsAnalyzing(true);
      const analysisResults = await analyzeBreathingAudio(audioBlob);
      setResults(analysisResults);
      setActiveSection("results");
    } catch (error) {
      console.error("Error analyzing audio:", error);
      alert("There was an error analyzing your audio. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-health-50">
      {/* Header */}
      <header className="w-full py-6 px-4 flex items-center justify-center border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-health-600" />
            <h1 className="text-xl font-bold text-health-gradient">BreatheEasy Analysis Hub</h1>
          </div>
          <Button variant="ghost" className="text-health-600">
            <Info className="h-4 w-4 mr-2" /> About
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-5xl mx-auto py-8 px-4 flex flex-col items-center">
        {/* Hero Section */}
        {activeSection === "intro" && (
          <div className="w-full text-center mb-12 animate-fade-in">
            <div className="animate-breathe inline-block mb-8">
              <div className="bg-medical-gradient text-white p-4 rounded-full">
                <Stethoscope className="h-16 w-16" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-health-gradient">Respiratory Health Analysis</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Our advanced AI analyzes your breathing patterns to detect potential respiratory conditions.
              Simply record or upload an audio sample of your breathing for instant analysis.
            </p>
            <Button 
              onClick={() => setActiveSection("record")} 
              className="bg-health-600 hover:bg-health-700 text-white"
              size="lg"
            >
              Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Recording Section */}
        {activeSection === "record" && (
          <Card className="w-full max-w-2xl glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                <FileAudio className="h-5 w-5 text-health-600" />
                <h2 className="text-xl font-semibold">Record Your Breathing</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                For best results, please record 15-30 seconds of your natural breathing in a quiet environment.
                Hold your device about 6 inches from your mouth.
              </p>
              <AudioRecorder onAudioCaptured={handleAudioCaptured} />
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {(activeSection === "results" || isAnalyzing) && (
          <div className="w-full max-w-3xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-health-600" />
                Analysis Results
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setActiveSection("record")}
                className="text-sm"
              >
                New Analysis
              </Button>
            </div>
            <ResultsDisplay results={results} isLoading={isAnalyzing} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 border-t bg-white/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p className="mb-2">
            BreatheEasy Analysis Hub - Respiratory health monitoring made simple
          </p>
          <p>
            <strong>Disclaimer:</strong> This tool is not a substitute for professional medical advice, diagnosis, or treatment.
            Always seek the advice of your physician or other qualified health provider.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
