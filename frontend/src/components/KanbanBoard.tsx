import React, { useState, useMemo } from 'react';
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
  Edit3,
  GripVertical,
  RefreshCw,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
import { Batch, StageNameType, Priority } from '../types';

interface KanbanBoardProps {
  batches: Batch[];
  onAdvanceStage: (batchId: string) => Promise<void>;
  onOpenQcModal: (batch: Batch) => void;
  onOpenDetailModal: (batch: Batch) => void;
  onOpenEditModal: (batch: Batch) => void;
  onReorderBatches?: (orderedIds: string[]) => Promise<void>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isAdvancingId: string | null;
  isLoading?: boolean;
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
  onOpenEditModal,
  onReorderBatches,
  onRefresh,
  isRefreshing = false,
  isAdvancingId,
  isLoading = false,
}) => {
  // High-Density Tools: Search, Filter, Compact View
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');

  // Drag & Drop States
  const [draggedBatchId, setDraggedBatchId] = useState<string | null>(null);
  const [dragOverBatchId, setDragOverBatchId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const getPriorityBadge = (priority: Priority, isCompact = false) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-urgent">{isCompact ? '🔥 Khẩn' : '🔥 Gấp / Khẩn'}</span>;
      case 'HIGH':
        return <span className="badge badge-high">{isCompact ? '⚡ Cao' : '⚡ Ưu tiên cao'}</span>;
      case 'LOW':
        return <span className="badge badge-low">{isCompact ? 'Bình thường' : 'Bình thường'}</span>;
      default:
        return <span className="badge badge-medium">{isCompact ? 'Chuẩn' : 'Tiêu chuẩn'}</span>;
    }
  };

  // Count priority statistics
  const priorityStats = useMemo(() => {
    const active = batches.filter((b) => b.overallStatus === 'IN_PROGRESS');
    return {
      all: active.length,
      urgent: active.filter((b) => b.priority === 'URGENT').length,
      high: active.filter((b) => b.priority === 'HIGH').length,
      medium: active.filter((b) => b.priority === 'MEDIUM').length,
      low: active.filter((b) => b.priority === 'LOW').length,
    };
  }, [batches]);

  // 1. Bắt đầu kéo thẻ
  const handleDragStart = (e: React.DragEvent, batch: Batch) => {
    setDraggedBatchId(batch.id);
    e.dataTransfer.setData('text/plain', batch.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 2. Kéo đè lên một thẻ khác
  const handleDragOverCard = (e: React.DragEvent, batchId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedBatchId !== batchId && dragOverBatchId !== batchId) {
      setDragOverBatchId(batchId);
    }
  };

  // 3. Kéo đè lên một cột công đoạn
  const handleDragOverStage = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  // 4. Thả thẻ vào một vị trí thẻ khác (Reorder trong cùng cột)
  const handleDropOnCard = async (
    e: React.DragEvent,
    targetBatch: Batch,
    stageBatches: Batch[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceBatchId = draggedBatchId;
    setDraggedBatchId(null);
    setDragOverBatchId(null);
    setDragOverStageId(null);

    if (!sourceBatchId || sourceBatchId === targetBatch.id) return;
    const sourceBatch = batches.find((b) => b.id === sourceBatchId);
    if (!sourceBatch) return;

    if (sourceBatch.currentStage === targetBatch.currentStage) {
      const currentIds = stageBatches.map((b) => b.id);
      const sourceIdx = currentIds.indexOf(sourceBatchId);
      const targetIdx = currentIds.indexOf(targetBatch.id);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const reordered = [...currentIds];
        reordered.splice(sourceIdx, 1);
        reordered.splice(targetIdx, 0, sourceBatchId);

        if (onReorderBatches) {
          await onReorderBatches(reordered);
        }
      }
    } else {
      await onAdvanceStage(sourceBatch.id);
    }
  };

  // 5. Thả thẻ vào cột công đoạn khác -> Chuyển công đoạn
  const handleDropOnStage = async (e: React.DragEvent, targetStageId: StageNameType) => {
    e.preventDefault();
    const sourceBatchId = draggedBatchId;
    setDraggedBatchId(null);
    setDragOverBatchId(null);
    setDragOverStageId(null);

    if (!sourceBatchId) return;
    const sourceBatch = batches.find((b) => b.id === sourceBatchId);
    if (!sourceBatch) return;

    if (sourceBatch.currentStage !== targetStageId) {
      await onAdvanceStage(sourceBatch.id);
    }
  };

  const handleDragEnd = () => {
    setDraggedBatchId(null);
    setDragOverBatchId(null);
    setDragOverStageId(null);
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* 🌟 Top Header & Quick High-Density Toolset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: '#ea580c' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
            Bảng Điều Phối Quy Trình Sản Xuất Xưởng Gốm (6 Công Đoạn Liên Hoàn)
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle: Detailed vs Compact */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: viewMode === 'detailed' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: viewMode === 'detailed' ? '#38bdf8' : 'var(--text-muted)',
              }}
              title="Xem đầy đủ thông số kỹ thuật từng thẻ"
            >
              <LayoutGrid size={13} /> Chi Tiết
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compact')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: viewMode === 'compact' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: viewMode === 'compact' ? '#38bdf8' : 'var(--text-muted)',
              }}
              title="Chế độ thu gọn: Hiển thị mật độ cao khi xưởng có nhiều mẻ gốm"
            >
              <List size={13} /> Thu Gọn
            </button>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onRefresh}
              disabled={isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(56, 189, 248, 0.08)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Tải lại dữ liệu mới nhất từ cơ sở dữ liệu"
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
              {isRefreshing ? 'Đang tải lại...' : 'Làm Mới Dữ Liệu'}
            </button>
          )}
        </div>
      </div>

      {/* 🌟 Search Bar & Priority Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '16px',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Main Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '1 1 320px',
              minWidth: '260px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '8px 14px',
            }}
          >
            <Search size={16} style={{ color: '#38bdf8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm thông minh theo Mã (#CF-801), Tên, Men gốm, Kỹ thuật, Nhiệt độ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '13px',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Priority Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={11} /> Lọc cấp độ:
            </span>

            <button
              type="button"
              onClick={() => setSelectedPriorityFilter('ALL')}
              style={{
                background: selectedPriorityFilter === 'ALL' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedPriorityFilter === 'ALL' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedPriorityFilter === 'ALL' ? '#38bdf8' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Tất cả ({priorityStats.all})
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriorityFilter('URGENT')}
              style={{
                background: selectedPriorityFilter === 'URGENT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedPriorityFilter === 'URGENT' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedPriorityFilter === 'URGENT' ? '#fca5a5' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🔥 Khẩn cấp ({priorityStats.urgent})
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriorityFilter('HIGH')}
              style={{
                background: selectedPriorityFilter === 'HIGH' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedPriorityFilter === 'HIGH' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedPriorityFilter === 'HIGH' ? '#fcd34d' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ⚡ Cao ({priorityStats.high})
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriorityFilter('MEDIUM')}
              style={{
                background: selectedPriorityFilter === 'MEDIUM' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedPriorityFilter === 'MEDIUM' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedPriorityFilter === 'MEDIUM' ? '#93c5fd' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              📌 Tiêu chuẩn ({priorityStats.medium})
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriorityFilter('LOW')}
              style={{
                background: selectedPriorityFilter === 'LOW' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedPriorityFilter === 'LOW' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedPriorityFilter === 'LOW' ? '#6ee7b7' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🌿 Bình thường ({priorityStats.low})
            </button>
          </div>
        </div>

        {/* Quick Search Chips & Search Status Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gợi ý tìm nhanh:</span>
            {['Bình sen', 'Celadon', 'Men rạn', '1280°C', '1300°C', 'Bọc đồng', 'Xuất khẩu'].map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => setSearchTerm(keyword)}
                style={{
                  background: searchTerm === keyword ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.04)',
                  border: searchTerm === keyword ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  color: searchTerm === keyword ? '#38bdf8' : '#94a3b8',
                  borderRadius: '4px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {keyword}
              </button>
            ))}
          </div>

          {(searchTerm || selectedPriorityFilter !== 'ALL') && (
            <div style={{ fontSize: '11.5px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>
                Đang áp dụng bộ lọc {searchTerm ? `từ khóa "${searchTerm}"` : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPriorityFilter('ALL');
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                }}
              >
                ✕ Xóa lọc
              </button>
            </div>
          )}
        </div>
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
          const PRIORITY_ORDER: Record<string, number> = {
            URGENT: 1,
            HIGH: 2,
            MEDIUM: 3,
            LOW: 4,
          };

          // Deep Search matching logic
          const stageBatches = batches
            .filter((b) => {
              if (b.currentStage !== stage.id || b.overallStatus !== 'IN_PROGRESS') return false;
              if (selectedPriorityFilter !== 'ALL' && b.priority !== selectedPriorityFilter) return false;
              if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchCode = b.batchCode.toLowerCase().includes(q);
                const matchName = b.productName.toLowerCase().includes(q);
                const matchDesc = (b.rawDescription || '').toLowerCase().includes(q);

                const specs = b.technicalSpecs || {};
                const matchGlaze = (specs.glaze_type || '').toLowerCase().includes(q);
                const matchTechnique = (specs.craft_technique || '').toLowerCase().includes(q);
                const matchArtwork = (specs.artwork_details || '').toLowerCase().includes(q);
                const matchTemp = specs.firing_specs?.target_temperature_c
                  ? String(specs.firing_specs.target_temperature_c).includes(q)
                  : false;
                const matchCustom = specs.custom_attributes
                  ? JSON.stringify(specs.custom_attributes).toLowerCase().includes(q)
                  : false;

                return (
                  matchCode ||
                  matchName ||
                  matchDesc ||
                  matchGlaze ||
                  matchTechnique ||
                  matchArtwork ||
                  matchTemp ||
                  matchCustom
                );
              }
              return true;
            })
            .sort((a, b) => {
              // 1. Cấp độ ưu tiên (URGENT > HIGH > MEDIUM > LOW)
              const pA = PRIORITY_ORDER[a.priority] || 99;
              const pB = PRIORITY_ORDER[b.priority] || 99;
              if (pA !== pB) return pA - pB;

              // 2. Thứ tự kéo thả thủ công (custom_rank)
              const specsA = a.technicalSpecs || {};
              const specsB = b.technicalSpecs || {};
              const rankA = typeof specsA.custom_rank === 'number' ? specsA.custom_rank : null;
              const rankB = typeof specsB.custom_rank === 'number' ? specsB.custom_rank : null;
              if (rankA !== null && rankB !== null && rankA !== rankB) {
                return rankA - rankB;
              } else if (rankA !== null && rankB === null) {
                return -1;
              } else if (rankA === null && rankB !== null) {
                return 1;
              }

              // 3. Đồng cấp ưu tiên & chưa kéo thả -> So sánh thời hạn hoàn thành (EDD)
              const deadlineA = a.deadlineDays !== null && a.deadlineDays !== undefined ? a.deadlineDays : 9999;
              const deadlineB = b.deadlineDays !== null && b.deadlineDays !== undefined ? b.deadlineDays : 9999;
              if (deadlineA !== deadlineB) return deadlineA - deadlineB;

              // 4. Cùng thời hạn -> Áp dụng FIFO
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

          const isColumnHovered = dragOverStageId === stage.id && draggedBatchId !== null;

          return (
            <div
              key={stage.id}
              className="glass-panel"
              onDragOver={(e) => handleDragOverStage(e, stage.id)}
              onDrop={(e) => handleDropOnStage(e, stage.id)}
              style={{
                background: isColumnHovered ? 'rgba(30, 58, 138, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                borderTop: `3px solid ${stage.color}`,
                border: isColumnHovered ? `2px dashed ${stage.color}` : undefined,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '480px',
                maxHeight: '680px',
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              {/* Stage Column Header (Sticky) */}
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

              {/* Cards List (Cuộn mượt riêng biệt từng cột khi dữ liệu nhiều) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: viewMode === 'compact' ? '8px' : '12px',
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {isLoading && stageBatches.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
                    <div className="skeleton-shimmer" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
                  </div>
                ) : stageBatches.length === 0 ? (
                  <div
                    style={{
                      border: isColumnHovered ? '2px dashed #60a5fa' : '1px dashed rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: isColumnHovered ? '#60a5fa' : 'var(--text-muted)',
                      fontSize: '12px',
                      margin: 'auto 0',
                    }}
                  >
                    {isColumnHovered ? 'Thả mẻ gốm vào trạm này 🎯' : 'Trống tại trạm này'}
                  </div>
                ) : (
                  stageBatches.map((batch, batchIdx) => {
                    const specs = batch.technicalSpecs || {};
                    const isKiln = stage.id === 'VAO_LO_NUNG';
                    const isBeingDragged = draggedBatchId === batch.id;
                    const isDragTarget = dragOverBatchId === batch.id && !isBeingDragged;

                    // 📑 1. Chế Độ Thu Gọn (Compact View - Siêu mỏng khi nhiều data)
                    if (viewMode === 'compact') {
                      return (
                        <div
                          key={batch.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, batch)}
                          onDragOver={(e) => handleDragOverCard(e, batch.id)}
                          onDrop={(e) => handleDropOnCard(e, batch, stageBatches)}
                          onDragEnd={handleDragEnd}
                          className={`glass-panel card-fade-in ${isKiln ? 'flame-active' : ''}`}
                          style={{
                            background: isBeingDragged ? '#0f172a' : '#131b2e',
                            padding: '9px 10px',
                            borderRadius: '8px',
                            border: isDragTarget
                              ? '2px solid #38bdf8'
                              : isBeingDragged
                              ? '2px dashed rgba(255,255,255,0.3)'
                              : isKiln
                              ? '1px solid rgba(234, 88, 12, 0.5)'
                              : '1px solid rgba(255,255,255,0.08)',
                            opacity: isBeingDragged ? 0.45 : 1,
                            cursor: 'grab',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <GripVertical size={12} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                              <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#94a3b8' }}>
                                #{batchIdx + 1}
                              </span>
                              <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa' }}>
                                #{batch.batchCode}
                              </span>
                            </div>
                            {getPriorityBadge(batch.priority, true)}
                          </div>

                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {batch.productName}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                            <span>{batch.quantity} chiếc {batch.deadlineDays ? `• ⏳ ${batch.deadlineDays}d` : ''}</span>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              <button
                                type="button"
                                onClick={() => onAdvanceStage(batch.id)}
                                disabled={isAdvancingId === batch.id}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  color: '#60a5fa',
                                  borderRadius: '4px',
                                  padding: '2px 5px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                                title="Chuyển bước kế tiếp"
                              >
                                {colIdx === 5 ? '✓ Xuất' : '➔ Bước ' + (colIdx + 2)}
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenDetailModal(batch)}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  padding: '2px 5px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                                title="Xem chi tiết"
                              >
                                <Eye size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 📋 2. Chế Độ Chi Tiết (Detailed View - Đầy đủ thông số kỹ thuật)
                    return (
                      <div
                        key={batch.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, batch)}
                        onDragOver={(e) => handleDragOverCard(e, batch.id)}
                        onDrop={(e) => handleDropOnCard(e, batch, stageBatches)}
                        onDragEnd={handleDragEnd}
                        className={`glass-panel card-fade-in ${isKiln ? 'flame-active' : ''}`}
                        style={{
                          background: isBeingDragged ? '#0f172a' : '#131b2e',
                          padding: '14px',
                          borderRadius: '12px',
                          border: isDragTarget
                            ? '2px solid #38bdf8'
                            : isBeingDragged
                            ? '2px dashed rgba(255,255,255,0.3)'
                            : isKiln
                            ? '1px solid rgba(234, 88, 12, 0.5)'
                            : '1px solid rgba(255,255,255,0.08)',
                          opacity: isBeingDragged ? 0.45 : 1,
                          transform: isDragTarget ? 'translateY(-2px)' : 'none',
                          cursor: 'grab',
                          position: 'relative',
                          transition: 'border 0.2s, transform 0.2s, background 0.2s, opacity 0.2s',
                          boxShadow: isDragTarget ? '0 0 16px rgba(56, 189, 248, 0.4)' : undefined,
                        }}
                      >
                        {/* Card Top: Drag Handle Grip, Rank Order, Code & Priority Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', alignItems: 'center' }}
                              title="Nhấp giữ và kéo thả để đổi thứ tự ưu tiên"
                            >
                              <GripVertical size={14} />
                            </div>

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                background: batchIdx === 0 && batch.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)',
                                color: batchIdx === 0 && batch.priority === 'URGENT' ? '#fca5a5' : '#94a3b8',
                                border: batchIdx === 0 && batch.priority === 'URGENT' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                padding: '1px 5px',
                              }}
                              title={`Thứ tự ưu tiên xử lý trong trạm: #${batchIdx + 1}`}
                            >
                              #{batchIdx + 1}
                            </span>
                            <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>
                              #{batch.batchCode}
                            </span>
                          </div>
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

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <span>Thời hạn:</span>
                            {batch.deadlineDays ? (
                              <strong style={{ color: batch.deadlineDays <= 3 ? '#f87171' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {batch.deadlineDays} ngày {batch.deadlineDays <= 3 ? '🔥 Gấp' : ''}
                              </strong>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Kéo thả tự do</span>
                            )}
                          </div>
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
                              <AlertTriangle size={12} /> Báo QC
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => onOpenEditModal(batch)}
                              style={{ padding: '6px 8px', fontSize: '11px', color: '#fb923c' }}
                              title="Chỉnh sửa thông số & thay đổi độ ưu tiên"
                            >
                              <Edit3 size={12} /> Sửa
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => onOpenDetailModal(batch)}
                              style={{ padding: '6px 9px', fontSize: '11px' }}
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
