import React, { useState } from 'react';
import { Sparkles, ArrowRight, Wand2, Zap, Bot, MessageSquare } from 'lucide-react';

interface OrderPromptBarProps {
  onAnalyze: (promptText: string) => Promise<void>;
  isLoading: boolean;
  onOpenRagChat: (initialText?: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    title: '🏺 Đơn Bình Sen Men Lam',
    text: 'Đơn 200 Bình gốm họa tiết sen men lam cao 35cm, yêu cầu nung nhiệt độ cao 1280°C, hoàn thành trong 10 ngày',
    tag: 'Tiêu chuẩn',
  },
  {
    title: '☕ Đơn Ấm Chén Men Rạn (Xuất khẩu)',
    text: 'Sản xuất 80 bộ ấm chén men rạn cổ Bát Tràng bọc đồng cao cấp, nung lò 1200°C, đơn hàng xuất khẩu giao gấp trong 4 ngày',
    tag: 'Khẩn cấp',
  },
  {
    title: '🌿 Đơn Bình Phong Thủy Men Ngọc',
    text: 'Làm 120 Bình hút tài lộc men ngọc Celadon cao 42cm họa tiết đắp nổi Thuận Buồm Xuôi Gió, nung nhiệt 1260°C trong 15 ngày',
    tag: 'Men ngọc',
  },
];

export const OrderPromptBar: React.FC<OrderPromptBarProps> = ({
  onAnalyze,
  isLoading,
  onOpenRagChat,
}) => {
  const [promptText, setPromptText] = useState(
    'Đơn 200 Bình gốm họa tiết sen men lam cao 35cm, yêu cầu nung nhiệt độ cao 1280°C, hoàn thành trong 10 ngày'
  );

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isLoading) return;
    onAnalyze(promptText);
  };

  const handleOpenChat = () => {
    onOpenRagChat(promptText.trim());
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 24px',
        marginBottom: '24px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#38bdf8' }} />
          <h2 style={{ fontSize: '15.5px', fontWeight: 700, color: '#f8fafc' }}>
            Trung Tâm Tiếp Nhận & Lập Kế Hoạch Sản Xuất Bằng AI (AI Manufacturing Hub)
          </h2>
        </div>
      </div>

      {/* Input Box with Dual Action Buttons */}
      <form onSubmit={handleQuickAnalyze}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Nhập mô tả đơn hàng (Ví dụ: Đơn 200 bình hoa sen men lam cao 35cm, nung nhiệt 1280 độ C trong 10 ngày)..."
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13.5px',
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: 1.5,
            }}
          />

          {/* 🌟 2 Main AI Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              💡 <em>Chọn 1 trong 2 chế độ xử lý AI bên dưới:</em>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Nút 1: Bóc tách nhanh 1-click */}
              <button
                type="submit"
                disabled={isLoading || !promptText.trim()}
                className="btn btn-primary"
                style={{
                  padding: '9px 18px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                title="Bóc tách tức thì đoạn văn bản trên và mở bảng kiểm duyệt thông số"
              >
                {isLoading ? (
                  <>
                    <Wand2 size={15} className="spin" />
                    Đang bóc tách...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    ⚡ Bóc Tách Nhanh (1-Click)
                  </>
                )}
              </button>

              {/* Nút 2: Chat tư vấn kỹ sư AI (RAG) */}
              <button
                type="button"
                onClick={handleOpenChat}
                className="btn btn-terracotta"
                style={{
                  padding: '9px 18px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px rgba(234, 88, 12, 0.35)',
                }}
                title="Mở hội thoại tương tác để Kỹ Sư AI hỏi thêm các thông số kỹ thuật còn thiếu"
              >
                <Bot size={16} />
                💬 Chat Tư Vấn Kỹ Sư AI
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 1-Click Sample Prompts */}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={12} style={{ color: '#f59e0b' }} /> Mẫu tham khảo:
        </span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setPromptText(sample.text);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              padding: '4px 10px',
              fontSize: '11.5px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{sample.title}</span>
            <span style={{ fontSize: '9.5px', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>
              {sample.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
