import React from 'react';
import { Sparkles, Database, Send, Layers, RefreshCw } from 'lucide-react';
import { DashboardStats } from '../types';

interface HeaderProps {
  stats: DashboardStats;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onResetDemo,
  isResetting,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 8px 16px rgba(29, 78, 216, 0.35)',
            }}
          >
            🏺
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                CERAMIX<span style={{ color: '#ea580c' }}>FLOW</span>
              </h1>
              <span className="badge badge-medium" style={{ fontSize: '10px' }}>AI MES v2.0</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Hệ Thống Điều Phối & Giám Sát Quy Trình Sản Xuất Xưởng Gốm Đa Bước
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tổng mẻ:</span>
            <strong className="font-mono" style={{ fontSize: '14px', color: '#fff' }}>{stats.totalBatches}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đang chạy:</span>
            <strong className="font-mono" style={{ fontSize: '14px', color: '#10b981' }}>{stats.inProgressBatches}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sự cố QC:</span>
            <strong className="font-mono" style={{ fontSize: '14px', color: '#ef4444' }}>{stats.totalIncidents}</strong>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-glass)' }} />

          {/* Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-success" title="PostgreSQL Hybrid Relational + JSONB">
              <Database size={11} /> Hybrid DB
            </span>
            <span className="badge badge-medium" title="Google Gemini 2.5 Flash">
              <Sparkles size={11} /> Gemini AI
            </span>
            <span className="badge badge-high" title="Telegram Bot Automation">
              <Send size={11} /> Telegram
            </span>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-glass)' }} />

          {/* Single Action: Reset Demo */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onResetDemo}
            disabled={isResetting}
            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '8px' }}
            title="Nạp lại dữ liệu 9 mẻ gốm mẫu ban đầu"
          >
            <RefreshCw size={12} className={isResetting ? 'spin' : ''} />
            {isResetting ? 'Đang reset...' : 'Nạp Mẻ Mẫu (Demo)'}
          </button>
        </div>

      </div>
    </header>
  );
};
