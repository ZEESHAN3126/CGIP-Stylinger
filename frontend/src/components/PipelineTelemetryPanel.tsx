import React from 'react';
import { Activity, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { PipelineTelemetry } from '../types';

interface PipelineTelemetryProps {
  telemetry?: PipelineTelemetry;
  isProcessing: boolean;
  activePhase?: string;
}

export const PipelineTelemetryPanel: React.FC<PipelineTelemetryProps> = ({
  telemetry,
  isProcessing,
  activePhase,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="#c8a97e" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pipeline Telemetry & Diagnostics
          </span>
        </div>
        {telemetry?.total_time_ms ? (
          <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} />
            {telemetry.total_time_ms} ms total
          </span>
        ) : (
          <span className="badge" style={{ color: '#8e95a5' }}>
            {isProcessing ? 'Processing...' : 'Awaiting Execution'}
          </span>
        )}
      </div>

      {/* Real-time processing active phase indicator */}
      {isProcessing && activePhase && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(200, 169, 126, 0.1)',
            border: '1px solid rgba(200, 169, 126, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#c8a97e',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontSize: '0.82rem', color: '#e4caa4' }}>{activePhase}</span>
        </div>
      )}

      {/* Latency Breakdown Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#8e95a5', marginBottom: '0.2rem' }}>1. Decode & Norm</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f3f7' }}>
            {telemetry?.decode_ms !== undefined ? `${telemetry.decode_ms} ms` : '—'}
          </div>
        </div>

        <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#8e95a5', marginBottom: '0.2rem' }}>2. Preprocessing</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f3f7' }}>
            {telemetry?.preprocess_ms !== undefined ? `${telemetry.preprocess_ms} ms` : '—'}
          </div>
        </div>

        <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#8e95a5', marginBottom: '0.2rem' }}>3. Segmentation</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f3f7' }}>
            {telemetry?.segmentation_ms !== undefined ? `${telemetry.segmentation_ms} ms` : '—'}
          </div>
        </div>

        <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#8e95a5', marginBottom: '0.2rem' }}>4. Affine Warping</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f3f7' }}>
            {telemetry?.transform_ms !== undefined ? `${telemetry.transform_ms} ms` : '—'}
          </div>
        </div>

        <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#8e95a5', marginBottom: '0.2rem' }}>5. Compositing</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f3f7' }}>
            {telemetry?.composite_ms !== undefined ? `${telemetry.composite_ms} ms` : '—'}
          </div>
        </div>
      </div>

      {/* Academic Constraint Verification Badge */}
      <div
        style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#8e95a5',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#10b981" />
          Deterministic OpenCV & NumPy (Zero Deep Learning)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckCircle2 size={13} color="#c8a97e" />
          In-Memory Execution
        </span>
      </div>
    </div>
  );
};
