export type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

export interface Hotspot {
  x: number;
  y: number;
}

export interface ImageHistoryItem {
  file: File;
  url: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  prompt: string;
  gradient: string;
}

export interface AdjustmentPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export interface AspectRatio {
  id: string;
  name: string;
  value: number | undefined;
}
