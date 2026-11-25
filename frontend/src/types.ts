export type GarmentCategory = 'All' | 'T-Shirts' | 'Shirts' | 'Outerwear' | 'Dresses' | 'Jeans';

export interface GarmentItem {
  id: string;
  name: string;
  category: string;
  apiCategory: string;
  palette: string;
  description: string;
  image: string;
}

export interface TransformSettings {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  featherRadius: number;
  opacity: number;
  matchLighting: boolean;
}

export interface PipelineTelemetry {
  decode_ms?: number;
  preprocess_ms?: number;
  segmentation_ms?: number;
  transform_ms?: number;
  composite_ms?: number;
  total_time_ms?: number;
}

export interface TryOnResult {
  resultImage: string;
  originalImage: string;
  segmentationOverlay?: string;
  telemetry?: PipelineTelemetry;
  timestamp: string;
  garmentName: string;
  category: string;
  warnings?: string[];
}

export type StudioMode = 'classical' | 'ai' | 'compare';

export type EngineStatus = 'idle' | 'processing' | 'completed' | 'failed';

export interface AIJobRecord {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: number;
  started_at?: number;
  completed_at?: number;
  duration_seconds?: number;
  progress_message: string;
  result_image_base64?: string;
  mask_image_base64?: string;
  error?: string;
  error_code?: string;
  model_info?: {
    engine: string;
    space: string;
    type: string;
  };
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  phase: string;
  academic_scope: string;
  tryon_service: {
    online: boolean;
    url: string;
    opencv_version?: string;
  };
  ai_service?: {
    engine: string;
    space: string;
    token_configured: boolean;
    type: string;
  };
}
