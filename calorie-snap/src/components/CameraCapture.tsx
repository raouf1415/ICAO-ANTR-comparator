import React, { useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onError: (error: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Camera access denied';
      setCameraError(errorMessage);
      onError('Camera access denied. Please allow camera permissions or use file upload.');
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    setIsCapturing(true);
    onCapture(imageDataUrl);
    
    // Stop camera after capture
    stopCamera();
  }, [onCapture, stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setIsCapturing(true);
        onCapture(result);
      }
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Camera View */}
      {stream && (
        <div className="relative w-full max-w-md mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none" />
        </div>
      )}

      {/* Camera Error State */}
      {cameraError && (
        <div className="w-full max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm text-center">{cameraError}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col space-y-3 w-full max-w-md">
        {!stream ? (
          <>
            <button
              onClick={startCamera}
              className="btn-primary flex items-center justify-center space-x-2"
              disabled={isCapturing}
            >
              <Camera className="w-5 h-5" />
              <span>Open Camera</span>
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">or</span>
              </div>
            </div>
            
            <button
              onClick={openFileDialog}
              className="btn-outline flex items-center justify-center space-x-2"
              disabled={isCapturing}
            >
              <Upload className="w-5 h-5" />
              <span>Upload Photo</span>
            </button>
          </>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={capturePhoto}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
              disabled={isCapturing}
            >
              <Camera className="w-5 h-5" />
              <span>Capture</span>
            </button>
            
            <button
              onClick={stopCamera}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <CameraOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 max-w-md">
        <p>
          {!stream 
            ? "Take a photo of your food or upload an existing image to get calorie estimates."
            : "Position your food in the frame and tap capture to analyze."
          }
        </p>
      </div>

      {/* Hidden Canvas for Image Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};