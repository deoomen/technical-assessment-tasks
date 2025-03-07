import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Clock, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { FrameData } from '../../types';

interface TimelineProps {
  frames: FrameData[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onFrameSelect: (frame: FrameData) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  frames,
  currentTime,
  duration,
  onSeek,
  onFrameSelect,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastFrameId = useRef<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to find the previous frame (or equal) to a given time
  const findNearestFrame = useCallback((time: number) => {
    if (frames.length === 0) return null;

    // Sort frames by timestamp (just to be safe)
    const sortedFrames = [...frames].sort((a, b) => a.timestamp - b.timestamp);

    // Find the last frame with timestamp <= current time
    for (let i = sortedFrames.length - 1; i >= 0; i--) {
      if (sortedFrames[i].timestamp <= time) {
        return sortedFrames[i];
      }
    }

    // If no frame is before current time, return the first frame
    return sortedFrames[0];
  }, [frames]);

  // Update frame selection when currentTime changes
  useEffect(() => {
    const nearestFrame = findNearestFrame(currentTime);

    if (nearestFrame && (!lastFrameId.current || lastFrameId.current !== nearestFrame.id)) {
      lastFrameId.current = nearestFrame.id;
      onFrameSelect(nearestFrame);
    }
  }, [currentTime, findNearestFrame, onFrameSelect]);

  const handleTimelineClick = useCallback(
    (event: React.MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const position = (event.clientX - rect.left) / rect.width;
      const newTime = position * duration;
      onSeek(newTime);
    },
    [duration, onSeek]
  );

  // Playback animation
  useEffect(() => {
    let lastTime = 0;
    const videoElement = document.querySelector('video'); // Find the video element in the DOM
    if (videoElement) {
      videoRef.current = videoElement;
    }

    const animate = (time: number) => {
      if (lastTime !== 0) {
        const deltaTime = (time - lastTime) / 1000;

        if (videoRef.current) {
          // Use video's currentTime if available
          onSeek(videoRef.current.currentTime);
        } else {
          // Otherwise incrementally update the time
          const newTime = Math.min(currentTime + deltaTime, duration);
          onSeek(newTime);

          // Loop back to beginning if reached the end
          if (newTime >= duration) {
            onSeek(0);
          }
        }
      }

      lastTime = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);

      // Also play the video element if it exists
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.play().catch(e => console.warn('Could not play video:', e));
      }
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }

      // Pause the video element if it exists
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, onSeek, onFrameSelect]);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipFrame = (direction: 'forward' | 'backward') => {
    const currentFrame = findNearestFrame(currentTime);
    if (!currentFrame) return;

    const currentIndex = frames.indexOf(currentFrame);
    const newIndex = direction === 'forward'
      ? Math.min(currentIndex + 1, frames.length - 1)
      : Math.max(currentIndex - 1, 0);

    const newFrame = frames[newIndex];
    onSeek(newFrame.timestamp);
    onFrameSelect(newFrame);
  };

  // Render frames as markers on the timeline
  const renderFrameMarkers = () => {
    return frames.map(frame => (
      <div
        key={frame.id}
        className={`absolute w-1 h-4 bg-green-500 -mt-2 cursor-pointer ${
          lastFrameId.current === frame.id ? 'bg-yellow-500' : 'bg-green-500'
        }`}
        style={{
          left: `${(frame.timestamp / duration) * 100}%`,
          top: '50%',
          transform: 'translateX(-50%)',
        }}
        onClick={() => {
          onSeek(frame.timestamp);
          onFrameSelect(frame);
        }}
        title={`Frame at ${formatTime(frame.timestamp)}`}
      />
    ));
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => skipFrame('backward')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlayback}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => skipFrame('forward')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <SkipForward className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-6 bg-gray-200 rounded cursor-pointer"
        onClick={handleTimelineClick}
      >
        {/* Timeline progress */}
        <div
          className="absolute h-full bg-blue-500 rounded"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        {/* Frame markers */}
        {renderFrameMarkers()}

        {/* Current position handle */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -mt-1"
          style={{
            left: `calc(${(currentTime / duration) * 100}% - 0.5rem)`,
            top: '50%',
          }}
        />
      </div>
    </div>
  );
};
