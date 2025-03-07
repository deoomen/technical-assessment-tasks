import React, { useState } from 'react';
import { ProcessedVideoData } from '../../types';
import { useVideoProcessing } from '../../hooks/useVideoProcessing';

interface VideoProcessorProps {
  onVideoProcessed: (data: ProcessedVideoData, url: string) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ onVideoProcessed }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { processVideo, isProcessing, progress, error } = useVideoProcessing();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Create a URL for the uploaded file
    const videoUrl = URL.createObjectURL(file);

    try {
      // Use our hook to process the video
      const processedData = await processVideo(file);

      // Call the callback with processed data and video URL
      onVideoProcessed(processedData, videoUrl);
    } catch (error) {
      console.error("Error processing video:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error processing video");
      // Clean up the video URL if there's an error
      URL.revokeObjectURL(videoUrl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 border-2 border-dashed border-gray-300 rounded-lg">
      <h2 className="text-xl font-medium text-gray-800">Upload Video</h2>
      <p className="text-gray-500 text-center">Upload a video file to begin analysis</p>

      <div className="w-full max-w-md">
        <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white transition duration-300">
          <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
          </svg>
          <span className="mt-2 text-base">Select a video file</span>
          <input type='file' className="hidden" accept="video/*" onChange={handleFileUpload} disabled={isProcessing} />
        </label>
      </div>

      {isProcessing && (
        <div className="w-full max-w-md">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            {progress < 100 ? `Processing video: ${progress}%` : 'Finishing up...'}
          </p>
        </div>
      )}

      {(errorMessage || error) && (
        <div className="w-full max-w-md p-3 bg-red-100 text-red-700 rounded-lg">
          <p className="text-sm">Error: {errorMessage || error}</p>
        </div>
      )}
    </div>
  );
};
