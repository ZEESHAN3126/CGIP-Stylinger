import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Sliders,
  RefreshCw,
  Download,
  AlertCircle,
  Eye,
  Columns,
  Image as ImageIcon,
  Layers,
  Info,
  Cpu,
  Zap,
  Split,
  Clock,
  ExternalLink,
} from 'lucide-react';

import { CATALOG_ITEMS } from './catalog';
import { CompareSlider } from './components/CompareSlider';
import { PipelineTelemetryPanel } from './components/PipelineTelemetryPanel';
import type {
  GarmentCategory,
  GarmentItem,
  TransformSettings,
  TryOnResult,
  HealthStatus,
  StudioMode,
  EngineStatus,
} from './types';

const CATEGORY_TABS: GarmentCategory[] = [
  'All',
  'T-Shirts',
  'Shirts',
  'Outerwear',
];

const DEFAULT_SETTINGS: TransformSettings = {
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  featherRadius: 3,
  opacity: 1.0,
  matchLighting: true,
};

interface AIResultState {
  resultImage: string;
  maskImage?: string;
  durationSeconds?: number;
  modelInfo?: {
    engine: string;
    space: string;
    type: string;
  };
}

export const App: React.FC = () => {
  // Mode Selection: 'compare' is default demonstration mode
  const [studioMode, setStudioMode] = useState<StudioMode>('compare');

  // Health Telemetry
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Ingestion State (Shared between both engines)
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [userDimensions, setUserDimensions] = useState<{ width: number; height: number } | null>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);

  // Garment Selection State (Shared between both engines)
  const [categoryFilter, setCategoryFilter] = useState<GarmentCategory>('All');
  const [selectedGarment, setSelectedGarment] = useState<GarmentItem>(CATALOG_ITEMS[0]);
  const [customGarmentFile, setCustomGarmentFile] = useState<File | null>(null);
  const customGarmentInputRef = useRef<HTMLInputElement>(null);

  // Classical Fitting Parameters
  const [settings, setSettings] = useState<TransformSettings>(DEFAULT_SETTINGS);

  // Classical Engine State
  const [classicalStatus, setClassicalStatus] = useState<EngineStatus>('idle');
  const [activePhase, setActivePhase] = useState<string>('');
  const [classicalResult, setClassicalResult] = useState<TryOnResult | null>(null);
  const [segmentationOverlay, setSegmentationOverlay] = useState<string | null>(null);
  const [classicalError, setClassicalError] = useState<string | null>(null);
  const [classicalWarning, setClassicalWarning] = useState<string | null>(null);
  const [activeClassicalTab, setActiveClassicalTab] = useState<'result' | 'original' | 'compare' | 'overlay'>('result');

  // AI IDM-VTON Engine State
  const [aiStatus, setAiStatus] = useState<EngineStatus>('idle');
  const [aiResult, setAiResult] = useState<AIResultState | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState<string>('');
  const pollTimerRef = useRef<number | null>(null);

  // Compare Tab State
  const [compareTab, setCompareTab] = useState<'split' | 'side-by-side' | 'inputs'>('split');

  // Fetch Health & API telemetry on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        setHealthLoading(true);
        const res = await fetch('/api/health');
        if (res.ok) {
          const data: HealthStatus = await res.json();
          setHealth(data);
        }
      } catch {
        setHealth(null);
      } finally {
        setHealthLoading(false);
      }
    };
    checkHealth();
  }, []);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Clear previous outputs when input images change
  const clearResults = useCallback(() => {
    setClassicalResult(null);
    setAiResult(null);
    setClassicalStatus('idle');
    setAiStatus('idle');
    setClassicalError(null);
    setAiError(null);
    setSegmentationOverlay(null);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Handle User Photo Selection
  const handleUserPhotoChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setClassicalError('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }
    clearResults();
    setUserPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUserPhoto(dataUrl);

      const img = new Image();
      img.onload = () => {
        setUserDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Garment Upload
  const handleCustomGarmentChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setClassicalError('Please select a valid apparel PNG or JPG.');
      return;
    }
    clearResults();
    setCustomGarmentFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const customItem: GarmentItem = {
        id: 'custom_upload',
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'T-Shirts',
        apiCategory: 'T-Shirt',
        palette: 'Custom Asset',
        description: 'User-provided apparel layer.',
        image: dataUrl,
      };
      setSelectedGarment(customItem);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCatalogGarment = (item: GarmentItem) => {
    clearResults();
    setCustomGarmentFile(null);
    setSelectedGarment(item);
  };

  // Run Segmentation Preview (Classical)
  const handleInspectLandmarks = async () => {
    if (!userPhotoFile && !userPhoto) {
      setClassicalError('Please upload a portrait first to extract body landmarks.');
      return;
    }
    setClassicalStatus('processing');
    setActivePhase('Extracting GrabCut contours & shoulder inflection points...');
    setClassicalError(null);

    try {
      const formData = new FormData();
      if (userPhotoFile) {
        formData.append('user_image', userPhotoFile);
      } else if (userPhoto) {
        formData.append('user_image_base64', userPhoto);
      }

      const res = await fetch('/api/tryon/segment-preview', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error?.message || data.error || `HTTP ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }

      if (data.overlay_base64) {
        setSegmentationOverlay(data.overlay_base64);
        setActiveClassicalTab('overlay');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Segmentation failed';
      setClassicalError(msg);
    } finally {
      setClassicalStatus('idle');
      setActivePhase('');
    }
  };

  // Execute Classical Try-On Pipeline
  const handleRunClassicalTryOn = async () => {
    if (!userPhoto) {
      setClassicalError('Please upload a portrait photograph first.');
      return;
    }
    if (!selectedGarment) {
      setClassicalError('Please select a clothing item from the catalog.');
      return;
    }

    setClassicalStatus('processing');
    setActivePhase('Executing Classical CG/IP 2D Affine & Feathering Pipeline...');
    setClassicalError(null);
    setClassicalWarning(null);

    try {
      const formData = new FormData();

      if (userPhotoFile) {
        formData.append('user_image', userPhotoFile);
      } else {
        formData.append('user_image_base64', userPhoto);
      }

      if (customGarmentFile) {
        formData.append('garment_image', customGarmentFile);
      } else if (selectedGarment.image.startsWith('data:')) {
        formData.append('garment_image_base64', selectedGarment.image);
      } else {
        formData.append('garment_image_url', selectedGarment.image);
      }

      formData.append('category', selectedGarment.apiCategory);
      formData.append('scale', settings.scale.toString());
      formData.append('offset_x', settings.offsetX.toString());
      formData.append('offset_y', settings.offsetY.toString());
      formData.append('rotation', settings.rotation.toString());
      formData.append('feather_radius', settings.featherRadius.toString());
      formData.append('opacity', settings.opacity.toString());
      formData.append('match_lighting', settings.matchLighting ? 'true' : 'false');

      const res = await fetch('/api/tryon/process', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error?.message || data.error || `HTTP ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }

      const resultImg = data.image_base64 || data.result_base64 || (data.result_url ? `/api${data.result_url}` : null);
      if (!resultImg) {
        throw new Error('Pipeline completed without returning a valid output image.');
      }

      setClassicalResult({
        resultImage: resultImg,
        originalImage: userPhoto,
        segmentationOverlay: data.segmentation_overlay || data.overlay_base64,
        telemetry: data.telemetry,
        timestamp: new Date().toLocaleTimeString(),
        garmentName: selectedGarment.name,
        category: selectedGarment.category,
        warnings: data.warnings,
      });

      if (data.warnings && data.warnings.length > 0) {
        setClassicalWarning(data.warnings.join(' • '));
      }

      setClassicalStatus('completed');
      setActiveClassicalTab('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Try-on processing encountered an error.';
      setClassicalError(msg);
      setClassicalStatus('failed');
    } finally {
      setActivePhase('');
    }
  };

  // Execute AI Try-On (IDM-VTON)
  const handleRunAiTryOn = async () => {
    if (!userPhoto) {
      setAiError('Please upload a portrait photograph first.');
      return;
    }
    if (!selectedGarment) {
      setAiError('Please select a clothing item from the catalog.');
      return;
    }

    setAiStatus('processing');
    setAiError(null);
    setAiProgress('Submitting to IDM-VTON ZeroGPU queue on Hugging Face...');

    try {
      const formData = new FormData();
      if (userPhotoFile) {
        formData.append('person_image', userPhotoFile);
      } else {
        formData.append('person_image_base64', userPhoto);
      }

      if (customGarmentFile) {
        formData.append('garment_image', customGarmentFile);
      } else {
        formData.append('garment_image_base64', selectedGarment.image);
      }

      formData.append('category', selectedGarment.apiCategory);
      formData.append('garment_description', `${selectedGarment.name} (${selectedGarment.category})`);

      const res = await fetch('/api/tryon/ai/jobs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error?.message || data.error || `HTTP ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }

      const jobId = data.job_id;
      pollAiJob(jobId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit AI inference request';
      setAiError(msg);
      setAiStatus('failed');
    }
  };

  // Poll AI Job Status
  const pollAiJob = (jobId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/tryon/ai/jobs/${jobId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!data.success || !data.job) return;

        const job = data.job;
        setAiProgress(job.progress_message || `Inference status: ${job.status}`);

        if (job.status === 'completed') {
          setAiStatus('completed');
          setAiResult({
            resultImage: job.result_image_base64,
            maskImage: job.mask_image_base64,
            durationSeconds: job.duration_seconds,
            modelInfo: job.model_info,
          });
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } else if (job.status === 'failed') {
          setAiStatus('failed');
          setAiError(job.error || 'AI inference failed on remote GPU.');
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error polling AI job status';
        setAiStatus('failed');
        setAiError(msg);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    }, 2500);
  };

  // Master Action: Run Both Engines
  const handleRunBoth = () => {
    handleRunClassicalTryOn();
    handleRunAiTryOn();
  };

  // Download Output PNG
  const handleDownloadImage = (imageSrc: string, engineName: string) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `stylinger-${engineName}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGarments =
    categoryFilter === 'All'
      ? CATALOG_ITEMS
      : CATALOG_ITEMS.filter((g) => g.category === categoryFilter);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>
      {/* Top Header / Branding Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Sparkles size={13} />
            Haute Numérique Atelier • Academic Virtual Styling Studio
          </div>
          <h1 className="title-display">Stylinger Studio</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Dual-Engine Fashion Try-On: Classical CG/IP (OpenCV + NumPy) vs. Diffusion AI (IDM-VTON).
          </p>
        </div>

        {/* System & Health Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {healthLoading ? (
            <span className="badge">Probing System...</span>
          ) : health ? (
            <>
              <span
                className={`badge ${health.tryon_service.online ? 'badge-emerald' : 'badge-amber'}`}
                title="Local Classical OpenCV Microservice on Port 5001"
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: health.tryon_service.online ? '#10b981' : '#f59e0b',
                  }}
                />
                Classical CV: {health.tryon_service.online ? 'Online' : 'Standby'}
              </span>
              <span
                className={`badge ${health.ai_service?.token_configured ? 'badge-emerald' : 'badge-amber'}`}
                title="IDM-VTON Pretrained Diffusion Space on Hugging Face"
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: health.ai_service?.token_configured ? '#10b981' : '#f59e0b',
                  }}
                />
                IDM-VTON AI: {health.ai_service?.token_configured ? 'Connected' : 'Anon Rate-Limit'}
              </span>
            </>
          ) : (
            <span className="badge badge-amber">Flask Offline</span>
          )}
        </div>
      </header>

      {/* Mode Switcher Nav Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '0.5rem',
          marginBottom: '1.75rem',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '12px',
        }}
      >
        <button
          onClick={() => setStudioMode('compare')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: studioMode === 'compare' ? '1px solid #c8a97e' : '1px solid transparent',
            backgroundColor: studioMode === 'compare' ? 'rgba(200, 169, 126, 0.15)' : 'transparent',
            color: studioMode === 'compare' ? '#dfc299' : '#8e95a5',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          <Split size={16} />
          MODE C — Compare Both Engines
        </button>

        <button
          onClick={() => setStudioMode('classical')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: studioMode === 'classical' ? '1px solid #c8a97e' : '1px solid transparent',
            backgroundColor: studioMode === 'classical' ? 'rgba(200, 169, 126, 0.15)' : 'transparent',
            color: studioMode === 'classical' ? '#dfc299' : '#8e95a5',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          <Cpu size={16} />
          MODE A — Classical CG/IP Engine
        </button>

        <button
          onClick={() => setStudioMode('ai')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: studioMode === 'ai' ? '1px solid #c8a97e' : '1px solid transparent',
            backgroundColor: studioMode === 'ai' ? 'rgba(200, 169, 126, 0.15)' : 'transparent',
            color: studioMode === 'ai' ? '#dfc299' : '#8e95a5',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          <Zap size={16} />
          MODE B — AI Virtual Try-On (IDM-VTON)
        </button>
      </div>

      {/* Error Banners */}
      {classicalError && (
        <div
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fda4af',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} color="#f43f5e" />
          <span><strong>Classical Engine:</strong> {classicalError}</span>
        </div>
      )}

      {aiError && (
        <div
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fda4af',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} color="#f43f5e" />
          <span><strong>IDM-VTON AI:</strong> {aiError}</span>
        </div>
      )}

      {classicalWarning && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fcd34d',
            fontSize: '0.85rem',
          }}
        >
          <Info size={18} color="#f59e0b" />
          <span>{classicalWarning}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '2rem' }}>
        {/* Left Column: Shared Ingestion & Controls Rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Portrait Ingestion */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="eyebrow">Input 01 • Subject Portrait</span>
              {userDimensions && (
                <span className="badge">
                  {userDimensions.width} × {userDimensions.height} px
                </span>
              )}
            </div>

            {userPhoto ? (
              <div style={{ position: 'relative', width: '100%', height: '260px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <img src={userPhoto} alt="Subject Portrait Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} />
                <button
                  onClick={() => {
                    clearResults();
                    setUserPhoto(null);
                    setUserPhotoFile(null);
                    setUserDimensions(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 10px',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div
                onClick={() => userFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleUserPhotoChange(e.dataTransfer.files[0]);
                }}
                style={{
                  height: '180px',
                  border: '2px dashed var(--border-hairline)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  transition: 'background-color 200ms',
                }}
              >
                <Upload size={28} color="#c8a97e" style={{ marginBottom: '0.6rem' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f1f3f7' }}>
                  Drag & drop portrait or browse
                </span>
                <span style={{ fontSize: '0.72rem', color: '#8e95a5', marginTop: '0.25rem' }}>
                  PNG, JPG, or WEBP (Max 16 MB)
                </span>
              </div>
            )}
            <input
              type="file"
              ref={userFileInputRef}
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleUserPhotoChange(e.target.files[0]);
              }}
            />
          </div>

          {/* Section 2: Garment Catalog & Selection */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="eyebrow">Input 02 • Garment Asset</span>
              <button
                className="btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                onClick={() => customGarmentInputRef.current?.click()}
              >
                <Upload size={12} /> Custom Apparel
              </button>
              <input
                type="file"
                ref={customGarmentInputRef}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCustomGarmentChange(e.target.files[0]);
                }}
              />
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: categoryFilter === cat ? '#c8a97e' : 'rgba(255,255,255,0.08)',
                    backgroundColor: categoryFilter === cat ? 'rgba(200, 169, 126, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: categoryFilter === cat ? '#dfc299' : '#8e95a5',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Garment Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {filteredGarments.map((item) => {
                const isSelected = selectedGarment.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCatalogGarment(item)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? '#c8a97e' : 'rgba(255,255,255,0.06)',
                      backgroundColor: isSelected ? 'rgba(200, 169, 126, 0.08)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 150ms',
                    }}
                  >
                    <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isSelected ? '#dfc299' : '#f1f3f7', textAlign: 'center' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#8e95a5', marginTop: '0.15rem' }}>{item.category}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Classical Spatial Fitting Controls (Shown in Classical & Compare modes) */}
          {(studioMode === 'classical' || studioMode === 'compare') && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={15} color="#c8a97e" />
                  <span className="eyebrow">Classical 2D Geometric Controls</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                >
                  Reset
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8e95a5', marginBottom: '0.35rem' }}>
                    <span>Garment Scale</span>
                    <span style={{ color: '#dfc299', fontWeight: 600 }}>{settings.scale.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={settings.scale}
                    onChange={(e) => setSettings({ ...settings, scale: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8e95a5', marginBottom: '0.35rem' }}>
                    <span>Horizontal Offset (X)</span>
                    <span style={{ color: '#dfc299', fontWeight: 600 }}>{settings.offsetX} px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={settings.offsetX}
                    onChange={(e) => setSettings({ ...settings, offsetX: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8e95a5', marginBottom: '0.35rem' }}>
                    <span>Vertical Offset (Y)</span>
                    <span style={{ color: '#dfc299', fontWeight: 600 }}>{settings.offsetY} px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={settings.offsetY}
                    onChange={(e) => setSettings({ ...settings, offsetY: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8e95a5', marginBottom: '0.35rem' }}>
                    <span>Alpha Feather Radius</span>
                    <span style={{ color: '#dfc299', fontWeight: 600 }}>{settings.featherRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={settings.featherRadius}
                    onChange={(e) => setSettings({ ...settings, featherRadius: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visualization & Execution Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Master Action Header */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {/* Action Buttons based on Active Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {studioMode === 'compare' && (
                <>
                  <button
                    className="btn-gold"
                    onClick={handleRunBoth}
                    disabled={classicalStatus === 'processing' || aiStatus === 'processing' || !userPhoto}
                    title="Execute both Classical CG/IP and IDM-VTON AI engines concurrently with identical inputs"
                  >
                    {classicalStatus === 'processing' || aiStatus === 'processing' ? (
                      <>
                        <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        Running Both Engines...
                      </>
                    ) : (
                      <>
                        <Split size={15} /> Run Both Engines
                      </>
                    )}
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={handleRunClassicalTryOn}
                    disabled={classicalStatus === 'processing' || !userPhoto}
                  >
                    <Cpu size={15} /> Run Classical Only
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={handleRunAiTryOn}
                    disabled={aiStatus === 'processing' || !userPhoto}
                  >
                    <Zap size={15} /> Generate AI Only
                  </button>
                </>
              )}

              {studioMode === 'classical' && (
                <>
                  <button
                    className="btn-gold"
                    onClick={handleRunClassicalTryOn}
                    disabled={classicalStatus === 'processing' || !userPhoto}
                  >
                    {classicalStatus === 'processing' ? (
                      <>
                        <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        Draping Garment...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Run Classical Try-On
                      </>
                    )}
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={handleInspectLandmarks}
                    disabled={classicalStatus === 'processing' || !userPhoto}
                    title="Inspect GrabCut contours and body landmarks"
                  >
                    <Eye size={15} /> Inspect Landmarks
                  </button>
                </>
              )}

              {studioMode === 'ai' && (
                <button
                  className="btn-gold"
                  onClick={handleRunAiTryOn}
                  disabled={aiStatus === 'processing' || !userPhoto}
                >
                  {aiStatus === 'processing' ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      Running Remote Diffusion...
                    </>
                  ) : (
                    <>
                      <Zap size={15} /> Generate IDM-VTON Try-On
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quick Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {aiStatus === 'processing' && (
                <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={12} />
                  {aiProgress || 'AI Queueing...'}
                </span>
              )}
              {classicalStatus === 'processing' && (
                <span className="badge badge-emerald">Classical Processing...</span>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEWPORT MODE C: DUAL-ENGINE COMPARISON (Primary Showcase) */}
          {/* ======================================================== */}
          {studioMode === 'compare' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Compare Mode Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: compareTab === 'split' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: compareTab === 'split' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setCompareTab('split')}
                >
                  <Columns size={14} /> Split Curtain (Classical vs AI)
                </button>

                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: compareTab === 'side-by-side' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: compareTab === 'side-by-side' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setCompareTab('side-by-side')}
                >
                  Side-by-Side Dual Cards
                </button>

                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: compareTab === 'inputs' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: compareTab === 'inputs' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setCompareTab('inputs')}
                >
                  Input Assets
                </button>
              </div>

              {/* View 1: Interactive Split Curtain (Classical vs AI) */}
              {compareTab === 'split' && (
                <div
                  className="glass-panel"
                  style={{
                    minHeight: '520px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '1rem',
                  }}
                >
                  {classicalResult?.resultImage && aiResult?.resultImage ? (
                    <div style={{ width: '100%', height: '520px' }}>
                      <CompareSlider
                        originalImage={classicalResult.resultImage}
                        resultImage={aiResult.resultImage}
                        leftLabel="Classical CG/IP (OpenCV 2D Affine)"
                        rightLabel="AI Diffusion (IDM-VTON)"
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8e95a5', padding: '3rem' }}>
                      <Split size={48} color="#5a6170" style={{ margin: '0 auto 1rem' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 500, color: '#f1f3f7', marginBottom: '0.4rem' }}>
                        Curtain Ready for Dual Comparison
                      </div>
                      <div style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '0 auto' }}>
                        Click <strong>"Run Both Engines"</strong> above to generate the Classical CG/IP and IDM-VTON AI results side-by-side.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Side-by-Side Independent Cards */}
              {compareTab === 'side-by-side' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  {/* Classical Result Card */}
                  <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Cpu size={16} color="#c8a97e" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dfc299' }}>Classical CG/IP Engine</span>
                      </div>
                      {classicalResult && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => handleDownloadImage(classicalResult.resultImage, 'classical')}
                        >
                          <Download size={12} /> Download
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8e95a5', marginBottom: '0.75rem' }}>
                      Deterministic OpenCV 2D Affine transform & Gaussian matting • Local execution
                    </div>
                    <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                      {classicalResult?.resultImage ? (
                        <img src={classicalResult.resultImage} alt="Classical CG/IP Result" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#5a6170' }}>Classical result pending</span>
                      )}
                    </div>
                    {classicalResult?.telemetry && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#8e95a5', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Runtime: <strong>{classicalResult.telemetry.total_time_ms} ms</strong></span>
                        <span style={{ color: '#10b981' }}>100% Deterministic</span>
                      </div>
                    )}
                  </div>

                  {/* AI IDM-VTON Result Card */}
                  <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={16} color="#c8a97e" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dfc299' }}>AI IDM-VTON Engine</span>
                      </div>
                      {aiResult && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => handleDownloadImage(aiResult.resultImage, 'idm-vton')}
                        >
                          <Download size={12} /> Download
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8e95a5', marginBottom: '0.75rem' }}>
                      Pretrained Diffusion UNet model hosted on Hugging Face ZeroGPU
                    </div>
                    <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                      {aiResult?.resultImage ? (
                        <img src={aiResult.resultImage} alt="IDM-VTON Result" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#5a6170' }}>{aiStatus === 'processing' ? aiProgress || 'Running diffusion...' : 'AI result pending'}</span>
                      )}
                    </div>
                    {aiResult && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#8e95a5', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Runtime: <strong>{aiResult.durationSeconds ? `${aiResult.durationSeconds} s` : '~33 s'}</strong></span>
                        <span style={{ color: '#38bdf8' }}>Diffusion Generative</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 3: Input Assets Review */}
              {compareTab === 'inputs' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Source Person Portrait</div>
                    <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
                      {userPhoto ? (
                        <img src={userPhoto} alt="Original Subject" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#5a6170', fontSize: '0.8rem' }}>No portrait uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Source Garment Item</div>
                    <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
                      {selectedGarment ? (
                        <img src={selectedGarment.image} alt={selectedGarment.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#5a6170', fontSize: '0.8rem' }}>No garment selected</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEWPORT MODE A: CLASSICAL CG/IP ENGINE                    */}
          {/* ======================================================== */}
          {studioMode === 'classical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Classical Viewport Mode Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: activeClassicalTab === 'result' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: activeClassicalTab === 'result' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setActiveClassicalTab('result')}
                >
                  <ImageIcon size={14} /> Styled Result
                </button>

                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: activeClassicalTab === 'original' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: activeClassicalTab === 'original' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setActiveClassicalTab('original')}
                >
                  Original
                </button>

                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: activeClassicalTab === 'compare' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: activeClassicalTab === 'compare' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setActiveClassicalTab('compare')}
                >
                  <Columns size={14} /> Split Curtain
                </button>

                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    backgroundColor: activeClassicalTab === 'overlay' ? 'rgba(200, 169, 126, 0.2)' : 'transparent',
                    color: activeClassicalTab === 'overlay' ? '#dfc299' : '#8e95a5',
                  }}
                  onClick={() => setActiveClassicalTab('overlay')}
                >
                  <Layers size={14} /> Landmarks
                </button>
              </div>

              {/* Classical Visual Canvas */}
              <div
                className="glass-panel"
                style={{
                  minHeight: '520px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '1rem',
                }}
              >
                {activeClassicalTab === 'result' && (
                  classicalResult?.resultImage ? (
                    <div style={{ width: '100%', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={classicalResult.resultImage}
                        alt="Classical Try-On Result"
                        style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px' }}
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8e95a5', padding: '3rem' }}>
                      <ImageIcon size={48} color="#5a6170" style={{ margin: '0 auto 1rem' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 500, color: '#f1f3f7', marginBottom: '0.4rem' }}>
                        Classical Canvas Ready
                      </div>
                      <div style={{ fontSize: '0.8rem', maxWidth: '340px', margin: '0 auto' }}>
                        Click "Run Classical Try-On" to execute 2D affine warping and alpha matting.
                      </div>
                    </div>
                  )
                )}

                {activeClassicalTab === 'original' && (
                  userPhoto ? (
                    <div style={{ width: '100%', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={userPhoto} alt="Original Portrait" style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8e95a5' }}>No original portrait uploaded yet.</div>
                  )
                )}

                {activeClassicalTab === 'compare' && (
                  userPhoto && classicalResult?.resultImage ? (
                    <CompareSlider originalImage={userPhoto} resultImage={classicalResult.resultImage} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8e95a5', padding: '3rem' }}>
                      <Columns size={40} color="#5a6170" style={{ margin: '0 auto 1rem' }} />
                      <div>Run Classical Try-On first to enable the comparison curtain.</div>
                    </div>
                  )
                )}

                {activeClassicalTab === 'overlay' && (
                  segmentationOverlay ? (
                    <div style={{ width: '100%', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={segmentationOverlay.startsWith('data:') ? segmentationOverlay : `data:image/png;base64,${segmentationOverlay}`}
                        alt="Body Regions and Contour Landmarks"
                        style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px' }}
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8e95a5', padding: '3rem' }}>
                      <Layers size={40} color="#5a6170" style={{ margin: '0 auto 1rem' }} />
                      <div>Click "Inspect Landmarks" above to extract GrabCut contours and torso points.</div>
                    </div>
                  )
                )}
              </div>

              {/* Bottom Telemetry & Diagnostics Rail */}
              <PipelineTelemetryPanel
                telemetry={classicalResult?.telemetry}
                isProcessing={classicalStatus === 'processing'}
                activePhase={activePhase}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEWPORT MODE B: AI VIRTUAL TRY-ON (IDM-VTON)             */}
          {/* ======================================================== */}
          {studioMode === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                className="glass-panel"
                style={{
                  minHeight: '520px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '1.5rem',
                }}
              >
                {aiResult?.resultImage ? (
                  <div style={{ width: '100%', height: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={aiResult.resultImage}
                      alt="IDM-VTON Virtual Try-On Output"
                      style={{ maxWidth: '100%', maxHeight: '460px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#dfc299' }}>
                        Inference Duration: <strong>{aiResult.durationSeconds}s</strong>
                      </span>
                      <button
                        className="btn-secondary"
                        onClick={() => handleDownloadImage(aiResult.resultImage, 'idm-vton')}
                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}
                      >
                        <Download size={13} /> Download AI Result
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#8e95a5', padding: '3rem' }}>
                    <Zap size={48} color="#5a6170" style={{ margin: '0 auto 1rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 500, color: '#f1f3f7', marginBottom: '0.4rem' }}>
                      IDM-VTON Pretrained Diffusion Ready
                    </div>
                    <div style={{ fontSize: '0.8rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
                      Runs hosted inference via Hugging Face ZeroGPU. Click <strong>"Generate IDM-VTON Try-On"</strong> to submit the request.
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Academic Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: '#8e95a5',
                }}
              >
                <div>
                  <strong style={{ color: '#dfc299' }}>Model Attribution:</strong> IDM-VTON (Improving Diffusion Models for Virtual Try-On, Choi et al.).
                  <div style={{ marginTop: '0.2rem' }}>Pretrained model running through hosted Hugging Face Space API. We did not train or fine-tune this model.</div>
                </div>
                <a
                  href="https://huggingface.co/spaces/yisol/IDM-VTON"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#c8a97e', textDecoration: 'none' }}
                >
                  HF Space <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
