
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, Loader2 } from "lucide-react";

interface AudioRecorderProps {
  onAudioCaptured: (audioBlob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioCaptured }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(20).fill(0));
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Get a sample of the data for visualization
    const sampleSize = 20;
    const newData = Array(sampleSize).fill(0);
    
    for (let i = 0; i < sampleSize; i++) {
      const index = Math.floor(i * (dataArray.length / sampleSize));
      // Scale the value to be between 0 and 1
      newData[i] = dataArray[index] / 255;
    }
    
    setVisualizerData(newData);
    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  };

  const startRecording = async () => {
    try {
      setAudioURL(null);
      setUploadedFile(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onAudioCaptured(audioBlob);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      visualizeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.includes('audio')) {
      setUploadedFile(file);
      setAudioURL(URL.createObjectURL(file));
      onAudioCaptured(file);
    } else if (file) {
      alert('Please select an audio file.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-32 bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center relative">
        {!isRecording && !audioURL && (
          <div className="text-muted-foreground">
            {isLoading ? "Processing..." : "Record or upload breathing audio"}
          </div>
        )}
        
        {(isRecording || audioURL) && (
          <div className="w-full h-full flex items-center justify-center gap-1 px-4">
            {visualizerData.map((value, index) => (
              <div
                key={index}
                className="w-2 md:w-3 bg-gradient-to-t from-health-400 to-breathe-400 rounded-t-full"
                style={{
                  height: `${Math.max(5, value * 100)}%`,
                  animation: isRecording ? `wave 1.2s ease-in-out ${index * 0.05}s infinite` : 'none'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-2">
        {/* {!isRecording && !isLoading ? (
          <Button onClick={startRecording} className="bg-health-600 hover:bg-health-700">
            <Mic className="mr-2 h-4 w-4" /> Record Audio
          </Button>
        ) : isRecording ? (
          <Button onClick={stopRecording} variant="destructive">
            <Square className="mr-2 h-4 w-4" /> Stop Recording
          </Button>
        ) : (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </Button>
        )} */}
        
        <Button onClick={handleUpload} variant="outline" className="border-health-600 text-health-700">
          <Upload className="mr-2 h-4 w-4" /> Upload Audio
        </Button>
      </div>
      
      {audioURL && !isLoading && (
        <div className="mt-4 w-full">
          <p className="text-sm text-muted-foreground mb-2">
            {uploadedFile ? `Uploaded: ${uploadedFile.name}` : "Recording preview:"}
          </p>
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default AudioRecorder;
