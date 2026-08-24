import React from 'react';
import { Send, Bell, ShieldAlert, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { SystemEventLog } from '../types';

interface LiveTelegramFeedProps {
  logs: SystemEventLog[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const LiveTelegramFeed: React.FC<LiveTelegramFeedProps> = ({ logs, onRefresh, isLoading }) => {
  const getEventBadge = (type: string) => {
    switch (type) {
      case 'QC_ALERT':
        return <span className="badge badge-urgent">🚨 QC Cảnh Báo Đỏ</span>;
      case 'ORDER_CREATED':
        return <span className="badge badge-medium">✨ Mẻ Mới Tạo</span>;
      case 'BATCH_COMPLETED':
        return <span className="badge badge-success">🎉 Xuất Xưởng</span>;
      default:
        return <span className="badge badge-high">🔄 Chuyển Trạm</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <Send size={15} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Live Telegram & Automation Feed</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thời gian thực (Realtime Event Logs)</span>
          </div>
        </div>

        <button
          className="btn-ghost"
          onClick={onRefresh}
          disabled={isLoading}
          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer' }}
          title="Làm mới bảng log"
        >
          <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {/* Logs Scroll Area */}
      <div
        style={{
          flex: 1,
          maxHeight: '420px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Chưa có thông báo nào được phát sinh.
          </div>
        ) : (
          logs.map((log) => {
            const isAlert = log.eventType === 'QC_ALERT';

            return (
              <div
                key={log.id}
                style={{
                  background: isAlert ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                  border: isAlert ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '12px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  {getEventBadge(log.eventType)}
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: isAlert ? '#fca5a5' : '#cbd5e1',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-line',
                    fontFamily: 'inherit',
                  }}
                  dangerouslySetInnerHTML={{ __html: log.message.trim() }}
                />
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
