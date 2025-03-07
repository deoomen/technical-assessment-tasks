export interface Point {
  x: number;
  y: number;
}

export interface Mask {
  id: string;
  points: Point[];
  label: string;
  confidence: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface FrameData {
  id: string;
  timestamp: number;
  segmentation: {
    masks: Mask[];
    labels: Label[];
    confidence: number[];
  };
  thumbnail: string;
}

export interface ProcessedVideoData {
  frames: FrameData[];
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
}

export interface SegmentationUpdate {
  maskId: string;
  points?: Point[];
  label?: string;
  confidence?: number;
}

export interface VideoProcessorProps {
  videoFile: File;
  onProcessingComplete?: (data: ProcessedVideoData) => void;
  onError?: (error: Error) => void;
}
