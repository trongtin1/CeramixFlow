import React, { useState } from 'react';
import {
  X,
  Edit3,
  Layers,
  Save,
  Trash2,
  Plus,
  Tag,
} from 'lucide-react';
import { Batch, Priority } from '../types';

interface EditBatchModalProps {
  batch: Batch | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    batchId: string,
    updatedData: {
      product_name: string;
      quantity: number;
      priority: Priority;
      deadline_days: number | null;
      technical_specs: any;
    }
  ) => Promise<void>;
  isSaving: boolean;
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

export const EditBatchModal: React.FC<EditBatchModalProps> = ({
  batch,
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  if (!isOpen || !batch) return null;

  const rawSpecs = batch.technicalSpecs || {};

  const [productName, setProductName] = useState(batch.productName);
  const [quantity, setQuantity] = useState(batch.quantity);
  const [priority, setPriority] = useState<Priority>(batch.priority);
  const [deadlineDays, setDeadlineDays] = useState<number | null>(batch.deadlineDays);

  // Dynamic Technical Specifications List
  const [specsList, setSpecsList] = useState<SpecRowItem[]>(() => {
    const items: SpecRowItem[] = [
      { id: '1', key: 'Đất sét dự tính (kg)', value: String(rawSpecs.estimated_clay_kg || 100) },
      { id: '2', key: 'Nhiệt độ nung lò (°C)', value: String(rawSpecs.firing_specs?.target_temperature_c || 1250) },
      { id: '3', key: 'Thời gian nung (giờ)', value: String(rawSpecs.firing_specs?.estimated_duration_hours || 12) },
      { id: '4', key: 'Loại men sử dụng', value: rawSpecs.glaze_type || 'Men lam cổ truyền' },
      { id: '5', key: 'Chiều cao (cm)', value: String(rawSpecs.dimensions?.height_cm || 30) },
      { id: '6', key: 'Kỹ thuật chế tác', value: rawSpecs.craft_technique || 'Vuốt tay bàn xoay & tiện mộc' },
      { id: '7', key: 'Chi tiết hoa văn', value: rawSpecs.artwork_details || 'Họa tiết thủ công Bát Tràng' },
    ];

    if (rawSpecs.custom_attributes) {
      Object.entries(rawSpecs.custom_attributes).forEach(([k, v], idx) => {
        items.push({ id: `c_${idx}`, key: k, value: String(v) });
      });
    }

    return items;
  });

  const handleAddSpecRow = (key = '', value = '') => {
    setSpecsList((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), key, value },
    ]);
  };

  const handleRemoveSpecRow = (id: string) => {
    setSpecsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateSpecRow = (id: string, field: 'key' | 'value', val: string) => {
    setSpecsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const compiled: Record<string, any> = {
      ...rawSpecs,
      dimensions: { ...(rawSpecs.dimensions || {}) },
      firing_specs: { ...(rawSpecs.firing_specs || {}) },
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
        compiled.custom_attributes[k] = v;
        compiled[k] = v;
      }
    });

    await onSave(batch.id, {
      product_name: productName,
      quantity: Number(quantity),
      priority,
      deadline_days: deadlineDays ? Number(deadlineDays) : null,
      technical_specs: compiled,
    });
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
                background: 'rgba(234, 88, 12, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c',
              }}
            >
              <Edit3 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Chỉnh Sửa Thông Số Mẻ Sản Xuất</h3>
                <span className="badge badge-medium">#{batch.batchCode}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Thay đổi tên sản phẩm, số lượng, độ ưu tiên & thông số kỹ thuật động (PostgreSQL JSONB)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Tên sản phẩm
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
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
                min={1}
                required
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
                Thời hạn (ngày)
              </label>
              <input
                type="number"
                value={deadlineDays || ''}
                onChange={(e) => setDeadlineDays(e.target.value ? Number(e.target.value) : null)}
                placeholder="Chưa định"
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

            {/* Quick Presets */}
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

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {specsList.map((spec) => (
                <div key={spec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tên thông số (ví dụ: Đất sét, Nhiệt độ...)"
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
                    placeholder="Giá trị (ví dụ: 120 kg, 1280°C...)"
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

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-terracotta"
              disabled={isSaving}
              style={{ minWidth: '180px' }}
            >
              {isSaving ? (
                'Đang lưu thay đổi...'
              ) : (
                <>
                  <Save size={16} />
                  Lưu & Cập Nhật Thứ Tự
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
