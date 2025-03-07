import React, { useRef, useEffect, useState } from 'react';
import { FrameData, Point } from '../../types';

interface EditorProps {
  frame: FrameData;
  videoUrl: string;
  currentTime: number;
  onMaskUpdate: (points: Point[]) => void;
  onTimeUpdate: (time: number) => void;
}

export const Editor: React.FC<EditorProps> = ({
  frame,
  videoUrl,
  currentTime,
  onMaskUpdate,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const points = useRef<Point[]>([]);
  const [canvasScale, setCanvasScale] = useState({ x: 1, y: 1 });

  // Sync video with currentTime prop
  useEffect(() => {
    const video = videoRef.current;
    if (video && Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Calculate canvas scale factor when video loads or resizes
  useEffect(() => {
    const updateCanvasScale = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      // Calculate scale factors between actual video dimensions and displayed dimensions
      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;

      if (video.videoWidth && video.videoHeight && displayWidth && displayHeight) {
        setCanvasScale({
          x: video.videoWidth / displayWidth,
          y: video.videoHeight / displayHeight
        });
      }
    };

    const video = videoRef.current;
    if (video) {
      // Set initial canvas dimensions and calculate scale
      if (video.readyState >= 2) {
        updateCanvasScale();
      } else {
        video.addEventListener('loadeddata', updateCanvasScale);
      }

      // Update scale on window resize
      window.addEventListener('resize', updateCanvasScale);
    }

    return () => {
      if (video) {
        video.removeEventListener('loadeddata', updateCanvasScale);
      }
      window.removeEventListener('resize', updateCanvasScale);
    };
  }, [videoUrl]);

  // Handle drawing on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert screen coordinates to canvas coordinates
    const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
      const rect = canvas.getBoundingClientRect();

      // Calculate the coordinates relative to the canvas element's display size
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // Apply scaling to get the correct coordinates within the canvas's internal coordinate system
      return {
        x: relativeX * (canvas.width / rect.width),
        y: relativeY * (canvas.height / rect.height)
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDrawing.current = true;
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      points.current = [{ x, y }];
      drawPoints(ctx);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return;
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      points.current.push({ x, y });
      drawPoints(ctx);
    };

    const handleMouseUp = () => {
      if (isDrawing.current) {
        isDrawing.current = false;
        onMaskUpdate(points.current);
      }
    };

    const drawPoints = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (points.current.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(points.current[0].x, points.current[0].y);

      for (let i = 1; i < points.current.length; i++) {
        ctx.lineTo(points.current[i].x, points.current[i].y);
      }

      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (points.current.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fill();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [onMaskUpdate]);

  // Initialize canvas size to match video
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const setCanvasSize = () => {
      // Set the canvas's internal dimensions to match the video's actual dimensions
      // This ensures proper coordinate mapping and drawing precision
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    if (video.readyState >= 2) {
      setCanvasSize();
    } else {
      video.addEventListener('loadeddata', setCanvasSize);
    }

    return () => {
      video.removeEventListener('loadeddata', setCanvasSize);
    };
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      onTimeUpdate(video.currentTime);
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          onTimeUpdate={handleTimeUpdate}
          controls={false}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-auto"
          style={{
            touchAction: 'none' // Prevent default touch behaviors
          }}
        />
      </div>

      <div className="flex space-x-4">
        <p className="py-2">
          Current time: {currentTime.toFixed(2)}s - Frame ID: {frame.id}
        </p>
      </div>
    </div>
  );
};
