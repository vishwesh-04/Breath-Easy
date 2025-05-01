
import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  audioUrl: string | null;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Load and connect audio
    const audio = new Audio(audioUrl);
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Start audio playback
    audio.loop = true;
    audio.play();
    
    // Draw function
    const draw = () => {
      requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.fillStyle = 'rgba(240, 249, 255, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate bar width based on canvas size and buffer length
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#0284c7'); // health-600
        gradient.addColorStop(1, '#14b8a6'); // breathe-500
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
    
    // Cleanup function
    return () => {
      audio.pause();
      audio.src = '';
      audioContext.close();
    };
  }, [audioUrl]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-32 rounded-lg bg-health-100/30"
      width={300}
      height={100}
    />
  );
};

export default WaveformVisualizer;
