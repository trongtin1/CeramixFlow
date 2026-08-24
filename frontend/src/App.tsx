import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OrderPromptBar } from './components/OrderPromptBar';
import { AiReviewModal } from './components/AiReviewModal';
import { KanbanBoard } from './components/KanbanBoard';
import { QcIncidentModal } from './components/QcIncidentModal';
import { BatchDetailModal } from './components/BatchDetailModal';
import { LiveTelegramFeed } from './components/LiveTelegramFeed';
import {
  parseOrderWithAi,
  createBatch,
  getAllBatches,
  advanceBatchStage,
  reportQcIncident,
  getDashboardData,
  resetDemoData,
} from './services/api';
import { Batch, AiParsedOrder, DashboardStats, SystemEventLog, Priority } from './types';
import { Sparkles, Layers, ShieldAlert, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBatches: 0,
    inProgressBatches: 0,
    completedBatches: 0,
    totalIncidents: 0,
  });
  const [logs, setLogs] = useState<SystemEventLog[]>([]);

  // AI & Form states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [parsedData, setParsedData] = useState<AiParsedOrder | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Workflow action states
  const [isAdvancingId, setIsAdvancingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Modals
  const [selectedQcBatch, setSelectedQcBatch] = useState<Batch | null>(null);
  const [isQcSubmitting, setIsQcSubmitting] = useState(false);

  const [selectedDetailBatch, setSelectedDetailBatch] = useState<Batch | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load initial data
  const fetchData = async () => {
    try {
      const [batchesData, dashData] = await Promise.all([
        getAllBatches(),
        getDashboardData(),
      ]);
      setBatches(batchesData);
      setStats(dashData.stats);
      setLogs(dashData.recentLogs);
    } catch (err: any) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-polling dashboard logs every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1. Handle AI Analysis
  const handleAnalyzePrompt = async (promptText: string) => {
    setIsAnalyzing(true);
    setCurrentPrompt(promptText);
    try {
      const result = await parseOrderWithAi(promptText);
      setParsedData(result);
      setIsAiModalOpen(true);
      showToast('AI đã bóc tách & ước tính thông số kỹ thuật thành công!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi bóc tách AI', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Confirm & Create Batch
  const handleConfirmBatch = async (finalData: {
    raw_description: string;
    product_name: string;
    quantity: number;
    priority: Priority;
    deadline_days: number | null;
    technical_specs: any;
  }) => {
    setIsCreatingBatch(true);
    try {
      await createBatch(finalData);
      setIsAiModalOpen(false);
      await fetchData();
      showToast('Đã khởi tạo quy trình mẻ gốm và gửi thông báo Telegram!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khởi tạo mẻ gốm', 'error');
    } finally {
      setIsCreatingBatch(false);
    }
  };

  // 3. Advance Stage
  const handleAdvanceStage = async (batchId: string) => {
    setIsAdvancingId(batchId);
    try {
      await advanceBatchStage(batchId);
      await fetchData();
      showToast('Đã chuyển công đoạn & bắn cập nhật Telegram!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi chuyển công đoạn', 'error');
    } finally {
      setIsAdvancingId(null);
    }
  };

  // 4. Report QC Incident
  const handleReportQc = async (
    batchId: string,
    data: { defect_count: number; reason: string; severity: 'WARNING' | 'CRITICAL' }
  ) => {
    setIsQcSubmitting(true);
    try {
      await reportQcIncident(batchId, data);
      setSelectedQcBatch(null);
      await fetchData();
      showToast('Đã ghi nhận sự cố QC và phát cảnh báo đỏ tới Telegram!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi báo cáo sự cố', 'error');
    } finally {
      setIsQcSubmitting(false);
    }
  };

  // 5. Reset Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn làm mới dữ liệu về mẻ demo ban đầu?')) return;
    setIsResetting(true);
    try {
      await resetDemoData();
      await fetchData();
      showToast('Đã làm mới dữ liệu thành công!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi reset', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: `1px solid ${toastMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {toastMessage.type === 'success' ? '✅ ' : '❌ '} {toastMessage.text}
        </div>
      )}

      {/* Top Header */}
      <Header stats={stats} onResetDemo={handleResetDemo} isResetting={isResetting} />

      {/* Natural Language AI Prompt Bar */}
      <OrderPromptBar onAnalyze={handleAnalyzePrompt} isLoading={isAnalyzing} />

      {/* Main Kanban Board (6 Sequential Stages) */}
      <KanbanBoard
        batches={batches}
        onAdvanceStage={handleAdvanceStage}
        onOpenQcModal={(batch) => setSelectedQcBatch(batch)}
        onOpenDetailModal={(batch) => setSelectedDetailBatch(batch)}
        isAdvancingId={isAdvancingId}
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
              🤖 <strong>AI Copilot + Pre-flight Review:</strong> AI tự động ước tính công thức vật liệu dựa trên kích thước & độ cao sản phẩm, cho phép Quản đốc xưởng kiểm duyệt trước khi kích hoạt.
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
      />

    </div>
  );
};
