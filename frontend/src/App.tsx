import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OrderPromptBar } from './components/OrderPromptBar';
import { AiReviewModal } from './components/AiReviewModal';
import { KanbanBoard } from './components/KanbanBoard';
import { QcIncidentModal } from './components/QcIncidentModal';
import { BatchDetailModal } from './components/BatchDetailModal';
import { EditBatchModal } from './components/EditBatchModal';
import { RagChatModal } from './components/RagChatModal';
import { LiveTelegramFeed } from './components/LiveTelegramFeed';
import {
  parseOrderWithAi,
  createBatch,
  getAllBatches,
  updateBatch,
  reorderBatches,
  advanceBatchStage,
  reportQcIncident,
  getDashboardData,
  resetDemoData,
} from './services/api';
import { Batch, AiParsedOrder, DashboardStats, SystemEventLog, Priority, StageNameType } from './types';
import { Sparkles, Layers, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, Info, X, Zap, Bot } from 'lucide-react';

const STAGE_ORDER: StageNameType[] = [
  'TAO_HINH_MOC',
  'PHOI_SUA_MOC',
  'VE_HOA_TIET',
  'TRANG_MEN',
  'VAO_LO_NUNG',
  'QC_DONG_GOI',
];

const STAGE_TITLES: Record<string, string> = {
  TAO_HINH_MOC: '1. Tạo hình mộc',
  PHOI_SUA_MOC: '2. Phơi sấy & Sửa',
  VE_HOA_TIET: '3. Vẽ họa tiết',
  TRANG_MEN: '4. Tráng men',
  VAO_LO_NUNG: '5. Vào lò nung',
  QC_DONG_GOI: '6. QC & Đóng gói',
};

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export const App: React.FC = () => {
  // Instant hydration from local storage to prevent blank screen flash on refresh
  const [batches, setBatches] = useState<Batch[]>(() => {
    try {
      const cached = localStorage.getItem('ceramixflow_batches');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<DashboardStats>(() => {
    try {
      const cached = localStorage.getItem('ceramixflow_stats');
      return cached ? JSON.parse(cached) : {
        totalBatches: 0,
        inProgressBatches: 0,
        completedBatches: 0,
        totalIncidents: 0,
      };
    } catch {
      return {
        totalBatches: 0,
        inProgressBatches: 0,
        completedBatches: 0,
        totalIncidents: 0,
      };
    }
  });

  const [logs, setLogs] = useState<SystemEventLog[]>(() => {
    try {
      const cached = localStorage.getItem('ceramixflow_logs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [isInitialLoading, setIsInitialLoading] = useState(batches.length === 0);

  // AI & Form states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [parsedData, setParsedData] = useState<AiParsedOrder | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRagChatOpen, setIsRagChatOpen] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Workflow action states
  const [isAdvancingId, setIsAdvancingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [selectedQcBatch, setSelectedQcBatch] = useState<Batch | null>(null);
  const [isQcSubmitting, setIsQcSubmitting] = useState(false);

  const [selectedDetailBatch, setSelectedDetailBatch] = useState<Batch | null>(null);

  const [selectedEditBatch, setSelectedEditBatch] = useState<Batch | null>(null);
  const [isUpdatingBatch, setIsUpdatingBatch] = useState(false);

  // High-performance Toast Queue
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const defaultTitle =
      title ||
      (type === 'success' ? 'Thành công' : type === 'error' ? 'Cảnh báo lỗi' : type === 'warning' ? 'Chú ý' : 'Thông báo');

    const newToast: ToastNotification = { id, title: defaultTitle, message, type };
    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Lock background body scroll when any modal is open
  const isAnyModalOpen = isAiModalOpen || isRagChatOpen || !!selectedQcBatch || !!selectedDetailBatch || !!selectedEditBatch;
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAnyModalOpen]);

  // Load data function
  const fetchData = async (showInitialShimmer = false) => {
    if (showInitialShimmer) setIsInitialLoading(true);
    try {
      const [batchesData, dashData] = await Promise.all([
        getAllBatches(),
        getDashboardData(),
      ]);
      setBatches(batchesData);
      setStats(dashData.stats);
      setLogs(dashData.recentLogs);

      // Cache to localStorage
      try {
        localStorage.setItem('ceramixflow_batches', JSON.stringify(batchesData));
        localStorage.setItem('ceramixflow_stats', JSON.stringify(dashData.stats));
        localStorage.setItem('ceramixflow_logs', JSON.stringify(dashData.recentLogs));
      } catch (e) {
        // ignore quota errors
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Manual Refresh Handler (Instant feedback)
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    showToast('Đang làm mới dữ liệu từ Database...', 'info', 'Đồng bộ');
    try {
      await fetchData();
      showToast('Đã tải lại toàn bộ mẻ sản xuất mới nhất!', 'success', 'Hoàn tất');
    } catch (err: any) {
      showToast(err.message || 'Lỗi làm mới dữ liệu', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Handle AI Analysis
  const handleAnalyzePrompt = async (promptText: string) => {
    setIsAnalyzing(true);
    setCurrentPrompt(promptText);
    showToast('AI Agent đang bóc tách ngôn ngữ tự nhiên & tính toán công thức...', 'info', 'Phân tích AI');
    try {
      const result = await parseOrderWithAi(promptText);
      setParsedData(result);
      setIsAiModalOpen(true);
      showToast('Bóc tách thành công! Vui lòng kiểm duyệt thông số trước khi kích hoạt.', 'success', 'AI Hoàn thành');
    } catch (err: any) {
      showToast(err.message || 'Lỗi bóc tách AI', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Confirm & Create Batch (Optimistic + Immediate Notification)
  const handleConfirmBatch = async (finalData: {
    raw_description: string;
    product_name: string;
    quantity: number;
    priority: Priority;
    deadline_days: number | null;
    technical_specs: any;
  }) => {
    setIsCreatingBatch(true);
    setIsAiModalOpen(false);
    showToast(`Đang khởi tạo quy trình mẻ [${finalData.product_name}] & bắn thông báo Telegram...`, 'info', 'Kích hoạt mẻ');

    try {
      await createBatch(finalData);
      await fetchData();
      showToast('Đã tạo thành công mẻ sản xuất và phát tín hiệu Telegram!', 'success', 'Khởi tạo thành công');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khởi tạo mẻ gốm', 'error');
      await fetchData();
    } finally {
      setIsCreatingBatch(false);
    }
  };

  // 3. Advance Stage (Optimistic 0ms Update + Immediate Notification)
  const handleAdvanceStage = async (batchId: string) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    if (!targetBatch) return;

    const currentIdx = STAGE_ORDER.indexOf(targetBatch.currentStage);
    const isFinalStage = currentIdx === STAGE_ORDER.length - 1;
    const nextStage = !isFinalStage ? STAGE_ORDER[currentIdx + 1] : targetBatch.currentStage;
    const nextOverallStatus = isFinalStage ? 'COMPLETED' : 'IN_PROGRESS';

    // ⚡ Optimistic UI Update 0ms: Cập nhật giao diện tức thì không cần đợi API
    setBatches((prevBatches) =>
      prevBatches.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            currentStage: nextStage,
            overallStatus: nextOverallStatus,
          };
        }
        return b;
      })
    );

    // ⚡ Bắn Toast thông báo tức thì (0ms)
    if (isFinalStage) {
      showToast(`🎉 Mẻ #${targetBatch.batchCode} đã hoàn tất kiểm định QC và xuất xưởng thành công!`, 'success', 'Hoàn thành mẻ');
    } else {
      showToast(`🚀 Đã chuyển mẻ #${targetBatch.batchCode} sang [${STAGE_TITLES[nextStage]}] & gửi Telegram!`, 'success', 'Chuyển công đoạn');
    }

    setIsAdvancingId(batchId);
    try {
      await advanceBatchStage(batchId);
      // Đồng bộ ngầm lại dữ liệu và audit log
      const dashData = await getDashboardData();
      setStats(dashData.stats);
      setLogs(dashData.recentLogs);
    } catch (err: any) {
      showToast(err.message || 'Lỗi chuyển công đoạn', 'error');
      await fetchData();
    } finally {
      setIsAdvancingId(null);
    }
  };

  // 4. Report QC Incident (Optimistic 0ms Update + Immediate Notification)
  const handleReportQc = async (
    batchId: string,
    data: { defect_count: number; reason: string; severity: 'WARNING' | 'CRITICAL' }
  ) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    setSelectedQcBatch(null);
    showToast(`🚨 Đã ghi nhận ${data.defect_count} sản phẩm lỗi ở mẻ #${targetBatch?.batchCode || ''} & phát cảnh báo đỏ Telegram!`, 'error', 'Cảnh báo QC');

    setIsQcSubmitting(true);
    try {
      await reportQcIncident(batchId, data);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi báo cáo sự cố', 'error');
      await fetchData();
    } finally {
      setIsQcSubmitting(false);
    }
  };

  // 5. Update Batch (Optimistic 0ms Update + Immediate Notification)
  const handleUpdateBatch = async (
    batchId: string,
    updatedData: {
      product_name: string;
      quantity: number;
      priority: Priority;
      deadline_days: number | null;
      technical_specs: any;
    }
  ) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    setSelectedEditBatch(null);

    // ⚡ Optimistic UI Update 0ms: Cập nhật thông số và thứ tự ưu tiên ngay lập tức
    setBatches((prevBatches) =>
      prevBatches.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            productName: updatedData.product_name,
            quantity: updatedData.quantity,
            priority: updatedData.priority,
            deadlineDays: updatedData.deadline_days,
            technicalSpecs: updatedData.technical_specs,
          };
        }
        return b;
      })
    );

    showToast(`✅ Đã lưu thông số & sắp xếp lại thứ tự ưu tiên mẻ #${targetBatch?.batchCode || ''}!`, 'success', 'Cập nhật thành công');

    setIsUpdatingBatch(true);
    try {
      await updateBatch(batchId, updatedData);
      const dashData = await getDashboardData();
      setLogs(dashData.recentLogs);
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật mẻ gốm', 'error');
      await fetchData();
    } finally {
      setIsUpdatingBatch(false);
    }
  };

  // 6. Drag & Drop Manual Reorder (Optimistic 0ms)
  const handleReorderBatches = async (orderedIds: string[]) => {
    // ⚡ Optimistic UI Update 0ms
    setBatches((prevBatches) => {
      const updated = prevBatches.map((b) => {
        const newRankIdx = orderedIds.indexOf(b.id);
        if (newRankIdx !== -1) {
          return {
            ...b,
            technicalSpecs: {
              ...(b.technicalSpecs || {}),
              custom_rank: newRankIdx + 1,
            },
          };
        }
        return b;
      });
      return updated;
    });

    showToast('🖐️ Đã hoán đổi vị trí thứ tự ưu tiên bằng kéo thả!', 'info', 'Thứ tự ưu tiên');

    try {
      await reorderBatches(orderedIds);
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu vị trí kéo thả', 'error');
      await fetchData();
    }
  };

  // 7. Reset Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nạp lại 9 mẻ gốm demo ban đầu?')) return;
    setIsResetting(true);
    showToast('Đang thiết lập lại và nạp 9 mẻ gốm mẫu...', 'info', 'Làm mới Demo');
    try {
      await resetDemoData();
      await fetchData();
      showToast('Đã nạp thành công 9 mẻ gốm mẫu đa dạng độ ưu tiên!', 'success', 'Hoàn tất');
    } catch (err: any) {
      showToast(err.message || 'Lỗi reset', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="app-container">
      {/* 🌟 Modern Floating Top-Right Notification Center (Immediate Feedback) */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100% - 40px)',
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';
          const isWarning = toast.type === 'warning';

          const accentColor = isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
          const bgColor = isSuccess
            ? 'rgba(6, 78, 59, 0.92)'
            : isError
            ? 'rgba(127, 29, 29, 0.92)'
            : isWarning
            ? 'rgba(120, 53, 15, 0.92)'
            : 'rgba(15, 23, 42, 0.92)';

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: bgColor,
                backdropFilter: 'blur(16px)',
                color: '#fff',
                padding: '14px 18px',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                border: `1px solid ${accentColor}`,
                borderLeft: `5px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
            >
              <div style={{ color: accentColor, flexShrink: 0, marginTop: '2px' }}>
                {isSuccess && <CheckCircle2 size={18} />}
                {isError && <AlertTriangle size={18} />}
                {isInfo && <Zap size={18} />}
                {isWarning && <AlertTriangle size={18} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Top Header */}
      <Header
        stats={stats}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Natural Language AI Prompt Bar (Dual Action AI Hub) */}
      <OrderPromptBar
        onAnalyze={handleAnalyzePrompt}
        isLoading={isAnalyzing}
        onOpenRagChat={(initialText) => {
          if (initialText) setCurrentPrompt(initialText);
          setIsRagChatOpen(true);
        }}
      />

      {/* Main Kanban Board (6 Sequential Stages) with Drag & Drop */}
      <KanbanBoard
        batches={batches}
        onAdvanceStage={handleAdvanceStage}
        onOpenQcModal={(batch) => setSelectedQcBatch(batch)}
        onOpenDetailModal={(batch) => setSelectedDetailBatch(batch)}
        onOpenEditModal={(batch) => setSelectedEditBatch(batch)}
        onReorderBatches={handleReorderBatches}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        isAdvancingId={isAdvancingId}
        isLoading={isInitialLoading}
      />

      {/* Bottom Row: System Rationale Card & Live Telegram Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Architecture & Design Highlights */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Cpu size={18} style={{ color: '#60a5fa' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
              Kiến Trúc Dữ Liệu Lai (Hybrid Architecture Rationale)
            </h3>
          </div>

          <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p>
              🏺 <strong>Giải quyết bài toán thiếu dữ liệu ngành gốm:</strong> Thay vì hard-code các cột rời rạc (lượng đất, nhiệt độ, chất men), hệ thống chia làm 2 tầng:
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              <li>
                <strong>Tầng Cố Định (SQL Relational):</strong> Quản lý mã mẻ, tiến độ 6 công đoạn liên hoàn, thời hạn, và audit log.
              </li>
              <li>
                <strong>Tầng Linh Hoạt (PostgreSQL JSONB):</strong> Chứa toàn bộ thông số kỹ thuật động do AI bóc tách. Thích ứng ngay lập tức với mọi dòng sản phẩm mới mà không cần migrate DB schema.
              </li>
            </ul>
            <p>
              🤖 <strong>AI Copilot + Pre-flight Review + RAG Chat:</strong> AI tự động ước tính công thức vật liệu dựa trên kích thước & độ cao sản phẩm, cho phép tương tác hội thoại nếu thiếu thông số hoặc kiểm duyệt trước khi kích hoạt.
            </p>
          </div>
        </div>

        {/* Live Telegram & Event Feed */}
        <LiveTelegramFeed logs={logs} onRefresh={fetchData} isLoading={false} />

      </div>

      {/* Modals */}
      <AiReviewModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        parsedData={parsedData}
        rawText={currentPrompt}
        onConfirm={handleConfirmBatch}
        isCreating={isCreatingBatch}
      />

      {/* Interactive RAG Chatbot Modal */}
      <RagChatModal
        isOpen={isRagChatOpen}
        onClose={() => setIsRagChatOpen(false)}
        initialText={currentPrompt}
        onActivateBatch={(data, rawPrompt) => {
          setParsedData(data);
          setCurrentPrompt(rawPrompt || data.product_name);
          setIsAiModalOpen(true);
        }}
      />

      <QcIncidentModal
        isOpen={!!selectedQcBatch}
        batch={selectedQcBatch}
        onClose={() => setSelectedQcBatch(null)}
        onSubmit={handleReportQc}
        isSubmitting={isQcSubmitting}
      />

      <BatchDetailModal
        isOpen={!!selectedDetailBatch}
        batch={selectedDetailBatch}
        onClose={() => setSelectedDetailBatch(null)}
        onOpenEdit={(batch) => setSelectedEditBatch(batch)}
      />

      <EditBatchModal
        isOpen={!!selectedEditBatch}
        batch={selectedEditBatch}
        onClose={() => setSelectedEditBatch(null)}
        onSave={handleUpdateBatch}
        isSaving={isUpdatingBatch}
      />

    </div>
  );
};
