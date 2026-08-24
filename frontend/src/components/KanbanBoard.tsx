import React from 'react';
import {
  ChevronRight,
  Flame,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Palette,
  Eye,
  Check,
} from 'lucide-react';
import { Batch, StageNameType, Priority } from '../types';

interface KanbanBoardProps {
  batches: Batch[];
  onAdvanceStage: (batchId: string) => Promise<void>;
  onOpenQcModal: (batch: Batch) => void;
  onOpenDetailModal: (batch: Batch) => void;
  isAdvancingId: string | null;
}

const STAGES_CONFIG: { id: StageNameType; title: string; subtitle: string; icon: string; color: string }[] = [
  { id: 'TAO_HINH_MOC', title: '1. Tạo hình mộc', subtitle: 'Vuốt tay / Ép khuôn', icon: '🏺', color: '#3b82f6' },
  { id: 'PHOI_SUA_MOC', title: '2. Phơi sấy & Sửa', subtitle: 'Gọt tiện & sấy khô', icon: '☀️', color: '#0ea5e9' },
  { id: 'VE_HOA_TIET', title: '3. Vẽ họa tiết', subtitle: 'Họa sỹ tỉa hoa văn', icon: '🖌️', color: '#8b5cf6' },
  { id: 'TRANG_MEN', title: '4. Tráng men', subtitle: 'Nhúng & phun men', icon: '🎨', color: '#10b981' },
  { id: 'VAO_LO_NUNG', title: '5. Vào lò nung', subtitle: 'Nhiệt cao 1200-1300°C', icon: '🔥', color: '#ea580c' },
  { id: 'QC_DONG_GOI', title: '6. QC & Đóng gói', subtitle: 'Kiểm định xuất xưởng', icon: '📦', color: '#ec4899' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  batches,
  onAdvanceStage,
  onOpenQcModal,
  onOpenDetailModal,
  isAdvancingId,
}) => {
  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-urgent">🔥 Gấp / Khẩn</span>;
      case 'HIGH':
        return <span className="badge badge-high">⚡ Ưu tiên cao</span>;
      case 'LOW':
        return <span className="badge badge-low">Bình thường</span>;
      default:
        return <span className="badge badge-medium">Tiêu chuẩn</span>;
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: '#ea580c' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
            Bảng Điều Phối Quy Trình Sản Xuất Xưởng Gốm (6 Công Đoạn Liên Hoàn)
          </h2>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Kéo chuyển trạng thái hoặc bấm nút để tự động bắn thông báo cập nhật lên Telegram
        </span>
      </div>

      {/* 6 Columns Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(260px, 1fr))',
          gap: '14px',
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        {STAGES_CONFIG.map((stage, colIdx) => {
          const stageBatches = batches.filter(
            (b) => b.currentStage === stage.id && b.overallStatus === 'IN_PROGRESS'
          );

          return (
            <div
              key={stage.id}
              className="glass-panel"
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                borderTop: `3px solid ${stage.color}`,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '480px',
              }}
            >
              {/* Stage Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{stage.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>{stage.title}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stage.subtitle}</p>
                  </div>
                </div>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {stageBatches.length}
                </span>
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {stageBatches.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      margin: 'auto 0',
                    }}
                  >
                    Trống tại trạm này
                  </div>
                ) : (
                  stageBatches.map((batch) => {
                    const specs = batch.technicalSpecs || {};
                    const isKiln = stage.id === 'VAO_LO_NUNG';

                    return (
                      <div
                        key={batch.id}
                        className={`glass-panel ${isKiln ? 'flame-active' : ''}`}
                        style={{
                          background: '#131b2e',
                          padding: '14px',
                          borderRadius: '12px',
                          border: isKiln ? '1px solid rgba(234, 88, 12, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {/* Card Top */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>
                            #{batch.batchCode}
                          </span>
                          {getPriorityBadge(batch.priority)}
                        </div>

                        {/* Title */}
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            lineHeight: 1.35,
                            color: '#fff',
                            marginBottom: '10px',
                          }}
                        >
                          {batch.productName}
                        </h4>

                        {/* Specs Badges */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <span>Số lượng:</span>
                            <strong style={{ color: '#fff' }}>{batch.quantity} chiếc</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <span>Đất sét:</span>
                            <strong style={{ color: '#93c5fd' }}>{specs.estimated_clay_kg || 'N/A'} kg</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <span>Loại men:</span>
                            <span style={{ color: '#34d399', fontSize: '11px', maxWidth: '130px', textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {specs.glaze_type || 'Men truyền thống'}
                            </span>
                          </div>

                          {specs.firing_specs && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              <span>Nhiệt lò:</span>
                              <strong style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Flame size={11} /> {specs.firing_specs.target_temperature_c}°C
                              </strong>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onAdvanceStage(batch.id)}
                            disabled={isAdvancingId === batch.id}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              fontSize: '12px',
                              background: colIdx === 5 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
                            }}
                          >
                            {isAdvancingId === batch.id ? (
                              'Đang cập nhật...'
                            ) : colIdx === 5 ? (
                              <>
                                <Check size={13} /> Hoàn Thành Xuất Xưởng
                              </>
                            ) : (
                              <>
                                Chuyển Sang Bước {colIdx + 2}
                                <ChevronRight size={13} />
                              </>
                            )}
                          </button>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => onOpenQcModal(batch)}
                              style={{ flex: 1, padding: '6px', fontSize: '11px' }}
                              title="Báo cáo hàng hỏng / nứt men & bắn cảnh báo đỏ Telegram"
                            >
                              <AlertTriangle size={12} /> Báo Sự Cố QC
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => onOpenDetailModal(batch)}
                              style={{ padding: '6px 10px', fontSize: '11px' }}
                              title="Xem chi tiết toàn bộ thông số"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
