import React, { useState } from 'react';
import { AlertTriangle, Send, X, ShieldAlert, Check } from 'lucide-react';
import { Batch } from '../types';

interface QcIncidentModalProps {
  batch: Batch | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (batchId: string, data: { defect_count: number; reason: string; severity: 'WARNING' | 'CRITICAL' }) => Promise<void>;
  isSubmitting: boolean;
}

const COMMON_REASONS = [
  'Phát hiện nứt men rạn xương gốm sau khi nung lò',
  'Méo lệch hình thể do nhiệt độ vượt mức cho phép',
  'Màu men lam bị loang ố / không đều màu',
  'Bọt khí li ti trên bề mặt sản phẩm mộc',
  'Lỗi nét vẽ hoa văn bị nhòe ở trạm vẽ',
];

export const QcIncidentModal: React.FC<QcIncidentModalProps> = ({
  batch,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen || !batch) return null;

  const [defectCount, setDefectCount] = useState<number>(10);
  const [reason, setReason] = useState<string>('Công đoạn QC phát hiện 10 sản phẩm nứt men sau khi ra lò');
  const [severity, setSeverity] = useState<'WARNING' | 'CRITICAL'>('CRITICAL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectCount || !reason.trim()) return;
    onSubmit(batch.id, {
      defect_count: Number(defectCount),
      reason,
      severity,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '560px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fca5a5' }}>
                Báo Cáo Sự Cố QC & Bắn Cảnh Báo Đỏ
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Mẻ sản xuất: <strong>#{batch.batchCode}</strong> - {batch.productName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Defect count & Severity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Số lượng sản phẩm lỗi (chiếc)
              </label>
              <input
                type="number"
                min={1}
                max={batch.quantity}
                value={defectCount}
                onChange={(e) => setDefectCount(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '15px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Mức độ nghiêm trọng
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'WARNING' | 'CRITICAL')}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="CRITICAL">🔴 CRITICAL (Báo động đỏ khẩn cấp)</option>
                <option value="WARNING">🟡 WARNING (Cảnh báo thông thường)</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Mô tả chi tiết nguyên nhân lỗi
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Nhập chi tiết hiện tượng phát hiện tại xưởng..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#fff',
                fontSize: '13px',
                resize: 'none',
              }}
            />
          </div>

          {/* Quick select reasons */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Gợi ý lý do phổ biến:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {COMMON_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  • {r}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting}
              style={{ minWidth: '220px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: '#fff' }}
            >
              {isSubmitting ? (
                'Đang phát cảnh báo...'
              ) : (
                <>
                  <Send size={15} />
                  Bắn Cảnh Báo Đỏ Về Telegram
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
