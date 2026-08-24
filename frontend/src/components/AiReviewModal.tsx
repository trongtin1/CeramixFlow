import React, { useState } from 'react';
import { Sparkles, CheckCircle2, X, AlertTriangle, Layers, Flame, Gauge, FileCode, Check } from 'lucide-react';
import { AiParsedOrder, Priority } from '../types';

interface AiReviewModalProps {
  parsedData: AiParsedOrder | null;
  rawText: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalData: {
    raw_description: string;
    product_name: string;
    quantity: number;
    priority: Priority;
    deadline_days: number | null;
    technical_specs: any;
  }) => Promise<void>;
  isCreating: boolean;
}

export const AiReviewModal: React.FC<AiReviewModalProps> = ({
  parsedData,
  rawText,
  isOpen,
  onClose,
  onConfirm,
  isCreating,
}) => {
  if (!isOpen || !parsedData) return null;

  const [productName, setProductName] = useState(parsedData.product_name);
  const [quantity, setQuantity] = useState(parsedData.quantity);
  const [priority, setPriority] = useState<Priority>(parsedData.priority);
  const [deadlineDays, setDeadlineDays] = useState<number | null>(parsedData.deadline_days);

  // Technical specs
  const [clayKg, setClayKg] = useState(parsedData.technical_specs.estimated_clay_kg);
  const [glazeType, setGlazeType] = useState(parsedData.technical_specs.glaze_type);
  const [tempC, setTempC] = useState(parsedData.technical_specs.firing_specs.target_temperature_c);
  const [durationHours, setDurationHours] = useState(parsedData.technical_specs.firing_specs.estimated_duration_hours);
  const [heightCm, setHeightCm] = useState(parsedData.technical_specs.dimensions?.height_cm || 30);

  const [showJson, setShowJson] = useState(false);

  const handleConfirm = () => {
    const finalPayload = {
      raw_description: rawText,
      product_name: productName,
      quantity: Number(quantity),
      priority,
      deadline_days: deadlineDays ? Number(deadlineDays) : null,
      technical_specs: {
        ...parsedData.technical_specs,
        estimated_clay_kg: Number(clayKg),
        glaze_type: glazeType,
        dimensions: {
          ...parsedData.technical_specs.dimensions,
          height_cm: Number(heightCm),
        },
        firing_specs: {
          ...parsedData.technical_specs.firing_specs,
          target_temperature_c: Number(tempC),
          estimated_duration_hours: Number(durationHours),
        },
      },
    };
    onConfirm(finalPayload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Kiểm Duyệt Thông Số AI Bóc Tách (Pre-flight Review)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Dữ liệu do AI ước tính - Quản đốc xưởng có thể kiểm tra & điều chỉnh trước khi kích hoạt
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* AI Reasoning Box */}
        {parsedData.ai_reasoning && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '12.5px',
              color: '#93c5fd',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Lập luận của AI Agent:</strong> {parsedData.ai_reasoning}
            </div>
          </div>
        )}

        {/* Core Order Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Tên sản phẩm
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#fff',
                fontSize: '13.5px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Số lượng (chiếc)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#fff',
                fontSize: '13.5px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#fff',
                fontSize: '13.5px',
              }}
            >
              <option value="LOW">LOW - Bình thường</option>
              <option value="MEDIUM">MEDIUM - Tiêu chuẩn</option>
              <option value="HIGH">HIGH - Ưu tiên cao</option>
              <option value="URGENT">URGENT - Khẩn cấp / Gấp</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Thời hạn hoàn thành (ngày)
            </label>
            <input
              type="number"
              value={deadlineDays || ''}
              onChange={(e) => setDeadlineDays(e.target.value ? Number(e.target.value) : null)}
              placeholder="Chưa xác định"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#fff',
                fontSize: '13.5px',
              }}
            />
          </div>
        </div>

        {/* Dynamic Technical Specs (Hybrid JSONB values) */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Layers size={15} style={{ color: '#ea580c' }} />
            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>Thông Số Kỹ Thuật Động (Lưu JSONB)</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                🧱 Đất sét dự tính (kg)
              </label>
              <input
                type="number"
                value={clayKg}
                onChange={(e) => setClayKg(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                🔥 Nhiệt độ lò (°C)
              </label>
              <input
                type="number"
                value={tempC}
                onChange={(e) => setTempC(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#fb923c',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ⏱ Thời gian nung (giờ)
              </label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                🎨 Loại men sử dụng
              </label>
              <input
                type="text"
                value={glazeType}
                onChange={(e) => setGlazeType(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                📏 Chiều cao (cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>

        {/* JSON Inspector Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowJson(!showJson)}
            style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileCode size={14} />
            {showJson ? 'Ẩn JSON Schema Chuẩn' : 'Xem Raw JSON Schema Chuẩn từ AI'}
          </button>
          {showJson && (
            <pre
              style={{
                marginTop: '10px',
                background: '#0a0d14',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                color: '#34d399',
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-terracotta"
            onClick={handleConfirm}
            disabled={isCreating}
            style={{ minWidth: '220px' }}
          >
            {isCreating ? (
              'Đang khởi tạo 6 công đoạn...'
            ) : (
              <>
                <Check size={16} />
                Khởi Tạo Mẻ Sản Xuất & Bắn Telegram
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
