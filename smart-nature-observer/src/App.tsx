import React, { useState } from 'react';
import { VideoProcessor } from './components/VideoProcessor/VideoProcessor';
import { Editor } from './components/Canvas/Editor';
import { Timeline } from './components/UI/Timeline';
// import { Filmstrip } from './components/UI/Filmstrip';
import { ProcessedVideoData, Point, FrameData } from './types';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedVideoData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleVideoProcessed = (data: ProcessedVideoData, url: string) => {
    setProcessedData(data);
    setSelectedFrame(data.frames[0]);
    setVideoUrl(url);
  };

  const handleMaskUpdate = (points: Point[]) => {
    if (!selectedFrame) return;
    console.log('Mask updated:', points);
    // TODO: Update the frame's segmentation data
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  if (!processedData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Smart Nature Observer
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <VideoProcessor onVideoProcessed={handleVideoProcessed} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Smart Nature Observer
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {selectedFrame && videoUrl && (
            <Editor
              frame={selectedFrame}
              videoUrl={videoUrl}
              currentTime={currentTime}
              onMaskUpdate={handleMaskUpdate}
              onTimeUpdate={setCurrentTime}
            />
          )}
        </div>

        <Timeline
          frames={processedData.frames}
          currentTime={currentTime}
          duration={processedData.duration}
          onSeek={handleSeek}
          onFrameSelect={setSelectedFrame}
        />

        {/* <Filmstrip
          frames={processedData.frames}
          selectedFrame={selectedFrame}
          onFrameSelect={setSelectedFrame}
        /> */}
      </main>
    </div>
  );
}

export default App;
