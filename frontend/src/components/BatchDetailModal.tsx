import React from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, Layers, Flame, FileText, Sparkles } from 'lucide-react';
import { Batch, StageNameType } from '../types';

interface BatchDetailModalProps {
  batch: Batch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({ batch, isOpen, onClose }) => {
  if (!isOpen || !batch) return null;

  const specs = batch.technicalSpecs || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '700px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
                #{batch.batchCode}
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{batch.productName}</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Khởi tạo lúc: {new Date(batch.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Raw prompt quote */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderLeft: '3px solid #3b82f6',
            padding: '10px 14px',
            fontSize: '12.5px',
            color: '#cbd5e1',
            borderRadius: '0 8px 8px 0',
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: '#93c5fd' }}>Mô tả đầu vào gốc:</strong> "{batch.rawDescription}"
        </div>

        {/* Specs Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div className="glass-panel" style={{ padding: '12px', background: '#0f172a' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số lượng & Ưu tiên</span>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
              {batch.quantity} chiếc ({batch.priority})
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: '#0f172a' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Khối lượng đất sét</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#93c5fd', marginTop: '4px' }}>
              {specs.estimated_clay_kg || 'N/A'} kg
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: '#0f172a' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nhiệt độ nung lò</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fb923c', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={14} /> {specs.firing_specs?.target_temperature_c || '1250'}°C
            </div>
          </div>
        </div>

        {/* Extended Specs Details */}
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#f8fafc' }}>
            Chi Tiết Thông Số Kỹ Thuật Động (PostgreSQL JSONB)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Loại men: </span>
              <strong>{specs.glaze_type || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Thời gian nung: </span>
              <strong>{specs.firing_specs?.estimated_duration_hours || '12'} giờ</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Kiểu nung lò: </span>
              <strong>{specs.firing_specs?.firing_curve || 'Nung khử tiêu chuẩn'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Kỹ thuật tạo hình: </span>
              <strong>{specs.craft_technique || 'Vuốt tay thủ công'}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chi tiết hoa văn: </span>
              <strong>{specs.artwork_details || 'Họa tiết thủ công Bát Tràng'}</strong>
            </div>
          </div>

          {specs.additional_notes && specs.additional_notes.length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Ghi chú kỹ thuật:</span>
              <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                {specs.additional_notes.map((n: string, i: number) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Stage Timeline */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#f8fafc' }}>
            Nhật Ký Tiến Độ 6 Công Đoạn
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {batch.stages?.map((stage, idx) => {
              const isCompleted = stage.status === 'COMPLETED';
              const isInProgress = stage.status === 'IN_PROGRESS';

              return (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isInProgress
                      ? 'rgba(59, 130, 246, 0.15)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(255,255,255,0.02)',
                    border: isInProgress ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                    ) : isInProgress ? (
                      <Clock size={16} className="spin" style={{ color: '#3b82f6' }} />
                    ) : (
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                    )}
                    <span style={{ fontSize: '12.5px', fontWeight: isInProgress ? 700 : 500 }}>
                      Bước {idx + 1}: {stage.stageName}
                    </span>
                  </div>

                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isCompleted
                      ? `Xong: ${stage.completedAt ? new Date(stage.completedAt).toLocaleTimeString('vi-VN') : 'Đã duyệt'}`
                      : isInProgress
                      ? 'Đang thực hiện...'
                      : 'Chờ đến lượt'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident reports list */}
        {batch.incidents && batch.incidents.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#f87171' }}>
              Lịch Sử Sự Cố QC ({batch.incidents.length})
            </h4>
            {batch.incidents.map((inc) => (
              <div
                key={inc.id}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5', fontWeight: 600 }}>
                  <span>⚠️ Hỏng {inc.defectCount} chiếc tại {inc.stageName}</span>
                  <span>{new Date(inc.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
                <p style={{ color: '#fff', marginTop: '3px' }}>{inc.reason}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
