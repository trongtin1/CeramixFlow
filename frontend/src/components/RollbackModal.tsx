import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, ArrowLeftRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Batch, StageNameType } from '../types';

interface RollbackModalProps {
  isOpen: boolean;
  batch: Batch | null;
  initialTargetStage?: StageNameType | null;
  onClose: () => void;
  onSubmit: (batchId: string, targetStage: string, reason: string) => Promise<void>;
  isSubmitting: boolean;
}

const STAGE_ORDER: StageNameType[] = [
  'TAO_HINH_MOC',
  'PHOI_SUA_MOC',
  'VE_HOA_TIET',
  'TRANG_MEN',
  'VAO_LO_NUNG',
  'QC_DONG_GOI',
];

const STAGE_TITLES: Record<StageNameType, string> = {
  TAO_HINH_MOC: '1. Tạo hình mộc',
  PHOI_SUA_MOC: '2. Phơi sấy & Sửa',
  VE_HOA_TIET: '3. Vẽ họa tiết',
  TRANG_MEN: '4. Tráng men',
  VAO_LO_NUNG: '5. Vào lò nung',
  QC_DONG_GOI: '6. QC & Đóng gói',
};

const PRESET_REASONS = [
  'Phôi mộc chưa đủ độ phẳng, cần tiện gọt lại',
  'Lớp men bị bọt khí / loãng men, cần cạo rửa tráng lại',
  'Họa tiết vẽ bị nhòe nét / sai mẫu thiết kế',
  'Độ ẩm phôi mộc chưa đạt chuẩn để vẽ hoa văn',
  'Yêu cầu chỉnh sửa kích thước miệng bình',
];

export const RollbackModal: React.FC<RollbackModalProps> = ({
  isOpen,
  batch,
  initialTargetStage,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen || !batch) return null;

  const currentIdx = STAGE_ORDER.indexOf(batch.currentStage);
  // Các công đoạn hợp lệ để lùi (phải trước công đoạn hiện tại)
  const availablePreviousStages = STAGE_ORDER.slice(0, currentIdx);

  const [selectedTargetStage, setSelectedTargetStage] = useState<StageNameType>(
    initialTargetStage && availablePreviousStages.includes(initialTargetStage)
      ? initialTargetStage
      : availablePreviousStages[availablePreviousStages.length - 1] || 'TAO_HINH_MOC'
  );
  const [reason, setReason] = useState(PRESET_REASONS[0]);

  React.useEffect(() => {
    if (batch) {
      const currentIdx = STAGE_ORDER.indexOf(batch.currentStage);
      const prevStages = STAGE_ORDER.slice(0, currentIdx);
      if (initialTargetStage && prevStages.includes(initialTargetStage)) {
        setSelectedTargetStage(initialTargetStage);
      } else if (prevStages.length > 0) {
        setSelectedTargetStage(prevStages[prevStages.length - 1]);
      }
    }
  }, [batch, initialTargetStage, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !selectedTargetStage || isSubmitting) return;
    const currentTarget = selectedTargetStage;
    const currentReason = reason.trim();
    onClose(); // ⚡ Đóng modal tức thì (0ms) ngay khi bấm để phản hồi tức thì
    await onSubmit(batch.id, currentTarget, currentReason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                Xác Nhận Chuyển Lùi Công Đoạn (Rework)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Quy trình sửa chữa & tái chế phôi mộc trong xưởng gốm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning & Target Transition Banner */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fcd34d' }}>
              Mẻ #{batch.batchCode} — {batch.productName}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
            }}
          >
            <div style={{ color: '#94a3b8' }}>
              Hiện tại: <strong style={{ color: '#f8fafc' }}>{STAGE_TITLES[batch.currentStage]}</strong>
            </div>
            <ArrowLeftRight size={14} style={{ color: '#f59e0b' }} />
            <div style={{ color: '#94a3b8' }}>
              Chuyển về: <strong style={{ color: '#38bdf8' }}>{STAGE_TITLES[selectedTargetStage]}</strong>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Select Target Stage */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              🎯 Chọn Trạm Cần Chuyển Về Sửa Chữa:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {availablePreviousStages.map((stg) => (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setSelectedTargetStage(stg)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    border:
                      selectedTargetStage === stg
                        ? '1px solid #38bdf8'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    background:
                      selectedTargetStage === stg
                        ? 'rgba(56, 189, 248, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)',
                    color: selectedTargetStage === stg ? '#38bdf8' : '#cbd5e1',
                  }}
                >
                  <span>{STAGE_TITLES[stg]}</span>
                  {selectedTargetStage === stg && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Reasons */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              💡 Lý Do Chuyển Lùi / Yêu Cầu Sửa Chữa:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(preset)}
                  style={{
                    background:
                      reason === preset ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border:
                      reason === preset ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: reason === preset ? '#fcd34d' : '#94a3b8',
                    padding: '4px 9px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập chi tiết lỗi hoặc lý do cần trả về trạm trước..."
              rows={3}
              required
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '12.5px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} style={{ color: '#f59e0b' }} />
            Thao tác này sẽ ghi nhận vào Audit Log và phát thông báo điều phối lại tới Telegram.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              disabled={isSubmitting}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                padding: '9px 16px',
                fontSize: '13px',
                borderRadius: '8px',
              }}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="btn btn-terracotta"
              style={{
                padding: '9px 20px',
                fontSize: '13px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <>Đang lưu...</>
              ) : (
                <>
                  <RotateCcw size={15} />
                  Xác Nhận Chuyển Lùi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
