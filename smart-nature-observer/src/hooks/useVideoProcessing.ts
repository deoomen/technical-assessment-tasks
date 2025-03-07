import { useState, useCallback } from 'react';
import { ProcessedVideoData, FrameData } from '../types';

export function useVideoProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processVideo = useCallback(async (file: File): Promise<ProcessedVideoData> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Process the video in the main thread
      const videoUrl = URL.createObjectURL(file);

      // Create a video element to get metadata
      const video = document.createElement('video');

      // Important: Set muted to true to allow autoplay in most browsers
      video.muted = true;

      // Set crossOrigin to anonymous to avoid CORS issues with canvas
      video.crossOrigin = 'anonymous';

      // Set preload to auto to ensure we get all metadata including duration
      video.preload = 'auto';

      setProgress(5);

      // Wait for video to be fully loaded before proceeding
      await new Promise<void>((resolve, reject) => {
        // Set up event listeners first
        const onLoadedData = () => {
          video.removeEventListener('loadeddata', onLoadedData);
          resolve();
        };

        const onError = () => {
          video.removeEventListener('error', onError);
          reject(new Error("Failed to load video"));
        };

        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('error', onError);

        // Then set the source (after event listeners are set up)
        video.src = videoUrl;

        // Set timeout in case video loading hangs
        const timeout = setTimeout(() => {
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          reject(new Error("Video load timeout"));
        }, 20000);

        // Clear timeout if video loads successfully
        video.onloadeddata = () => {
          clearTimeout(timeout);
        };
      });

      setProgress(20);

      // For some browsers, we need to actually play the video to get a valid duration
      try {
        video.currentTime = 0;
        await video.play();
        // Immediately pause after starting playback
        video.pause();
      } catch (playError) {
        console.warn('Could not autoplay video:', playError);
        // Continue anyway, we might still have valid metadata
      }

      // Get video duration directly from the video element
      let duration = 0;

      // Try multiple methods to get a valid duration
      // if (isFinite(video.duration) && video.duration > 0) {
      //   duration = video.duration;
      // } else {
        console.warn('First attempt to get duration failed, trying alternative method');

        // Try seeking to the end to see if we can get the duration
        video.currentTime = 1000000; // A very large time to force seeking to the end

        await new Promise<void>(resolve => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);

          // Set timeout in case seeking hangs
          setTimeout(() => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          }, 5000);
        });

        if (isFinite(video.duration) && video.duration > 0) {
          duration = video.duration;
        } else {
          // If we still can't get duration, estimate from file size
          // This is very rough but better than nothing
          const fileSizeMB = file.size / (1024 * 1024);
          // Assume ~1MB per second for standard quality video
          duration = Math.max(fileSizeMB, 10);
          console.warn(`Could not determine video duration, estimated from file size: ${duration}s`);
        }
      // }

      // Make sure we reset to the beginning before extracting frames
      video.currentTime = 0;

      console.log('Final duration:', duration);

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      setProgress(30);

      // Generate frames at regular intervals - use at most 20 frames or 1 frame per second, whichever is less
      const frameCount = Math.ceil(duration / 5);
      const frames: FrameData[] = [];
      console.log('Frame count:', frameCount);

      // Create canvas for thumbnails
      const canvas = document.createElement('canvas');
      const thumbnailWidth = 320; // Thumbnail width
      canvas.width = thumbnailWidth;
      canvas.height = Math.floor(thumbnailWidth * (height / width)); // Maintain aspect ratio
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error("Could not create canvas context");
      }

      // Calculate interval between frames
      const frameInterval = duration / frameCount;

      // Extract frames
      for (let i = 0; i < frameCount; i++) {
        setProgress(30 + Math.floor((i / frameCount) * 60));

        // Calculate timestamp for this frame
        const timestamp = i * frameInterval;

        try {
          // Seek to the timestamp
          video.currentTime = timestamp;

          // Wait for seeking to complete
          await new Promise<void>((resolve, reject) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            };

            video.addEventListener('seeked', onSeeked);

            // Set timeout in case seeking hangs
            setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              resolve(); // Resolve anyway to continue processing
            }, 5000);
          });

          // Draw the frame to canvas and create thumbnail
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

          // Create frame data
          frames.push({
            id: `frame-${i}`,
            timestamp,
            segmentation: {
              masks: [],
              labels: [],
              confidence: [],
            },
            thumbnail,
          });
        } catch (frameError) {
          console.error(`Error extracting frame at ${timestamp}s:`, frameError);
          // Continue with the next frame
        }
      }

      // Ensure we have at least one frame
      if (frames.length === 0) {
        try {
          // Try to get at least a single frame at the beginning
          video.currentTime = 0;
          await new Promise<void>(resolve => setTimeout(resolve, 500));

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

          frames.push({
            id: 'frame-0',
            timestamp: 0,
            segmentation: {
              masks: [],
              labels: [],
              confidence: [],
            },
            thumbnail,
          });
        } catch (e) {
          console.error('Failed to extract even a single frame:', e);
          // Add an empty frame as a fallback
          frames.push({
            id: 'frame-0',
            timestamp: 0,
            segmentation: {
              masks: [],
              labels: [],
              confidence: [],
            },
            thumbnail: '',
          });
        }
      }

      setProgress(90);

      // Clean up video element and URL
      video.pause();
      video.removeAttribute('src');
      video.load(); // Forces unloading
      URL.revokeObjectURL(videoUrl);

      const result: ProcessedVideoData = {
        frames,
        duration,
        resolution: {
          width,
          height,
        },
      };

      setProgress(100);
      return result;
    } catch (err) {
      console.error('Video processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred processing the video';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processVideo,
    isProcessing,
    progress,
    error,
  };
}
