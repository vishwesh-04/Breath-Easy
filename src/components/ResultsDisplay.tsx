
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, CircleHelp, Stethoscope, Activity } from "lucide-react";

interface ResultsDisplayProps {
  results: AnalysisResults | null;
  isLoading: boolean;
}

export interface AnalysisResults {
  prediction: {
    disease: string;
    confidence: number;
    risk_level: "low" | "medium" | "high";
  };
  audio_quality: {
    clarity: number;
    background_noise: number;
  };
  recommendation: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full glass-card animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Analyzing your breathing...
          </CardTitle>
          <CardDescription>
            Our AI is processing your audio sample
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-amber-500";
      case "high":
        return "text-red-500";
      default:
        return "text-slate-500";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CircleHelp className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <Card className="w-full glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-health-gradient">
          <Activity className="h-6 w-6" />
          Respiratory Analysis Results
        </CardTitle>
        <CardDescription>
          Based on your audio sample analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">Detected Condition</h3>
                  <p className="text-xl font-bold">{results.prediction.disease}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${getRiskColor(results.prediction.risk_level)}`}>
                    {results.prediction.risk_level.toUpperCase()} RISK
                  </span>
                  {getRiskIcon(results.prediction.risk_level)}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Confidence</span>
                  <span className="text-sm font-semibold">{results.prediction.confidence}%</span>
                </div>
                <Progress value={results.prediction.confidence} className="h-2" />
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Audio Quality</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Clarity</span>
                    <span className="text-sm font-semibold">{results.audio_quality.clarity}%</span>
                  </div>
                  <Progress value={results.audio_quality.clarity} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Background Noise</span>
                    <span className="text-sm font-semibold">{results.audio_quality.background_noise}%</span>
                  </div>
                  <Progress value={results.audio_quality.background_noise} className="h-2" />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Professional Recommendation</h3>
              <p className="text-muted-foreground">{results.recommendation}</p>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="italic">
                Note: This analysis is based on AI evaluation and should not replace professional medical advice.
                If you have concerns about your respiratory health, please consult a healthcare professional.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
