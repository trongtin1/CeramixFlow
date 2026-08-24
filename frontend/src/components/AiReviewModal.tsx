import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Layers,
  FileCode,
  Check,
  Plus,
  Trash2,
  Tag,
  Sliders,
} from 'lucide-react';
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

interface SpecRowItem {
  id: string;
  key: string;
  value: string;
}

const COMMON_CUSTOM_PRESETS = [
  { key: 'Tỷ lệ co ngót nhiệt', value: '12.5%' },
  { key: 'Độ ẩm phôi mộc', value: '16%' },
  { key: 'Thời gian ủ men', value: '24 giờ' },
  { key: 'Độ dày thành gốm', value: '4.5 mm' },
  { key: 'Kỹ thuật viền miệng', value: 'Bọc đồng thủ công' },
  { key: 'Thời gian giữ nhiệt đỉnh (Soaking)', value: '150 phút' },
  { key: 'Áp suất buồng lò nung', value: '0.05 MPa (Áp suất dương)' },
];

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

  // Dynamic Technical Specifications List (Toàn bộ lưu JSONB dạng Key-Value)
  const [specsList, setSpecsList] = useState<SpecRowItem[]>(() => {
    const raw = parsedData.technical_specs || {};
    const items: SpecRowItem[] = [
      { id: '1', key: 'Đất sét dự tính (kg)', value: String(raw.estimated_clay_kg || 100) },
      { id: '2', key: 'Nhiệt độ nung lò (°C)', value: String(raw.firing_specs?.target_temperature_c || 1280) },
      { id: '3', key: 'Thời gian nung (giờ)', value: String(raw.firing_specs?.estimated_duration_hours || 12) },
      { id: '4', key: 'Loại men sử dụng', value: raw.glaze_type || 'Men lam cổ truyền' },
      { id: '5', key: 'Chiều cao (cm)', value: String(raw.dimensions?.height_cm || 35) },
      { id: '6', key: 'Kỹ thuật chế tác', value: raw.craft_technique || 'Vuốt tay bàn xoay & tiện mộc' },
      { id: '7', key: 'Chi tiết hoa văn', value: raw.artwork_details || 'Họa tiết thủ công Bát Tràng' },
    ];

    // Thêm các thuộc tính tùy biến đã có nếu có
    if (raw.custom_attributes) {
      Object.entries(raw.custom_attributes).forEach(([k, v], idx) => {
        items.push({ id: `c_${idx}`, key: k, value: String(v) });
      });
    }

    return items;
  });

  const [showJson, setShowJson] = useState(false);

  // Thêm một dòng thông số kỹ thuật mới
  const handleAddSpecRow = (key = '', value = '') => {
    setSpecsList((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), key, value },
    ]);
  };

  // Xóa một dòng thông số
  const handleRemoveSpecRow = (id: string) => {
    setSpecsList((prev) => prev.filter((item) => item.id !== id));
  };

  // Cập nhật giá trị một dòng
  const handleUpdateSpecRow = (id: string, field: 'key' | 'value', val: string) => {
    setSpecsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Biên dịch danh sách key-value thành JSONB chuẩn
  const getCompiledJsonb = () => {
    const compiled: Record<string, any> = {
      ...parsedData.technical_specs,
      dimensions: { ...(parsedData.technical_specs?.dimensions || {}) },
      firing_specs: { ...(parsedData.technical_specs?.firing_specs || {}) },
      custom_attributes: {},
    };

    specsList.forEach((row) => {
      const k = row.key.trim();
      const v = row.value.trim();
      if (!k) return;

      const lowerK = k.toLowerCase();
      if (lowerK.includes('đất sét') || lowerK.includes('clay')) {
        const num = parseFloat(v);
        compiled.estimated_clay_kg = !isNaN(num) ? num : v;
      } else if (lowerK.includes('nhiệt độ') || lowerK.includes('temp')) {
        const num = parseFloat(v);
        compiled.firing_specs.target_temperature_c = !isNaN(num) ? num : v;
      } else if (lowerK.includes('thời gian nung') || lowerK.includes('duration')) {
        const num = parseFloat(v);
        compiled.firing_specs.estimated_duration_hours = !isNaN(num) ? num : v;
      } else if (lowerK.includes('loại men') || lowerK.includes('glaze')) {
        compiled.glaze_type = v;
      } else if (lowerK.includes('chiều cao') || lowerK.includes('height')) {
        const num = parseFloat(v);
        compiled.dimensions.height_cm = !isNaN(num) ? num : v;
      } else if (lowerK.includes('kỹ thuật chế tác') || lowerK.includes('technique')) {
        compiled.craft_technique = v;
      } else if (lowerK.includes('hoa văn') || lowerK.includes('artwork')) {
        compiled.artwork_details = v;
      } else {
        // Thuộc tính tùy biến linh hoạt
        compiled.custom_attributes[k] = v;
        compiled[k] = v;
      }
    });

    return compiled;
  };

  const handleConfirm = () => {
    const finalPayload = {
      raw_description: rawText,
      product_name: productName,
      quantity: Number(quantity),
      priority,
      deadline_days: deadlineDays ? Number(deadlineDays) : null,
      technical_specs: getCompiledJsonb(),
    };
    onConfirm(finalPayload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '28px', maxWidth: '780px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
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
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Kiểm Duyệt Thông Số Kỹ Thuật (Lưu JSONB)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Dữ liệu do AI ước tính - Quản đốc có thể thêm, bớt hoặc chỉnh sửa bất kỳ thông số nào
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
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

        {/* 🌟 Unified Dynamic Technical Specifications Section (Toàn Bộ Lưu JSONB) */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.45)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} style={{ color: '#38bdf8' }} />
              <strong style={{ fontSize: '14px', color: '#38bdf8' }}>
                Thông Số Kỹ Thuật Động (Lưu PostgreSQL JSONB)
              </strong>
            </div>
          </div>

          {/* Quick presets chips */}
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Tag size={11} /> Gợi ý thêm nhanh:
            </span>
            {COMMON_CUSTOM_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddSpecRow(preset.key, preset.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                + {preset.key}
              </button>
            ))}
          </div>

          {/* Specs List Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {specsList.map((spec) => (
              <div key={spec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Tên thông số kỹ thuật (ví dụ: Đất sét, Nhiệt độ lò, Độ co ngót...)"
                  value={spec.key}
                  onChange={(e) => handleUpdateSpecRow(spec.id, 'key', e.target.value)}
                  style={{
                    flex: 1.1,
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#38bdf8',
                    fontWeight: 600,
                    fontSize: '12.5px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Giá trị thông số (ví dụ: 120 kg, 1280°C, 12%...)"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpecRow(spec.id, 'value', e.target.value)}
                  style={{
                    flex: 1.6,
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '12.5px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecRow(spec.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                  }}
                  title="Xóa thông số này"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Dấu cộng thêm thông số ở ngay bên dưới */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => handleAddSpecRow()}
              className="btn btn-ghost"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#38bdf8',
                border: '1px dashed rgba(56, 189, 248, 0.3)',
              }}
            >
              <Plus size={15} /> Thêm Thông Số Kỹ Thuật Mới
            </button>
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
            {showJson ? 'Ẩn Live JSONB Payload' : 'Xem Trực Quan Live JSONB Payload Sẽ Lưu Vào PostgreSQL'}
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
              {JSON.stringify(getCompiledJsonb(), null, 2)}
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
