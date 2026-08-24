import React, { useState } from 'react';
import { Sparkles, ArrowRight, Wand2, Zap } from 'lucide-react';

interface OrderPromptBarProps {
  onAnalyze: (promptText: string) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_PROMPTS = [
  {
    title: '🏺 Đề bài mẫu (Bình sen men lam)',
    text: 'Đơn 200 Bình gốm họa tiết sen men lam cao 35cm, yêu cầu nung nhiệt độ cao 1280°C, hoàn thành trong 10 ngày',
    tag: 'Đề bài 2',
  },
  {
    title: '☕ Đơn xuất khẩu (Ấm chén men rạn)',
    text: 'Sản xuất 80 bộ ấm chén men rạn cổ Bát Tràng bọc đồng cao cấp, nung lò 1200°C, đơn hàng xuất khẩu giao gấp trong 4 ngày',
    tag: 'Khẩn cấp',
  },
  {
    title: '🌿 Đơn phong thủy (Men ngọc hỏa biến)',
    text: 'Làm 120 Bình hút tài lộc men ngọc Celadon cao 42cm họa tiết đắp nổi Thuận Buồm Xuôi Gió, nung nhiệt 1260°C trong 15 ngày',
    tag: 'Men ngọc',
  },
];

export const OrderPromptBar: React.FC<OrderPromptBarProps> = ({ onAnalyze, isLoading }) => {
  const [promptText, setPromptText] = useState(
    'Đơn 200 Bình gốm họa tiết sen men lam cao 35cm, yêu cầu nung nhiệt độ cao 1280°C, hoàn thành trong 10 ngày'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onAnalyze(promptText);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#60a5fa' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
            Tiếp Nhận & Bóc Tách Đơn Hàng Tự Động (AI Natural Language Agent)
          </h2>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Nhập tiếng Việt tự nhiên $\rightarrow$ AI tính toán đất sét, men, lò & bóc tách JSON
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            alignItems: 'center',
          }}
        >
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ví dụ: Đơn 200 bình hoa sen men lam cao 35cm, nung nhiệt 1280 độ C trong 10 ngày..."
            rows={2}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !promptText.trim()}
            style={{ minWidth: '190px', height: '46px' }}
          >
            {isLoading ? (
              <>
                <Wand2 size={16} className="spin" />
                Đang phân tích AI...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Bóc Tách & Ước Tính AI
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* 1-Click Sample Prompts */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={13} style={{ color: '#f59e0b' }} /> Prompt mẫu 1-click:
        </span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setPromptText(sample.text);
              onAnalyze(sample.text);
            }}
            className="btn-ghost"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{sample.title}</span>
            <span style={{ fontSize: '10px', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
              {sample.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
