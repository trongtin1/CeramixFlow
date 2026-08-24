import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Flame,
  Clock,
  Tag,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { chatWithAssistant } from '../services/api';
import { AiParsedOrder } from '../types';

interface RagChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateBatch: (parsedData: AiParsedOrder, rawPrompt: string) => void;
  initialText?: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  is_complete?: boolean;
  missing_fields?: string[];
  suggested_options?: string[];
  extracted_specs?: AiParsedOrder | null;
  timestamp: string;
}

const DEFAULT_WELCOME_MESSAGE: MessageItem = {
  id: 'welcome-1',
  role: 'assistant',
  content:
    'Chào Quản đốc! Tôi là **Kỹ Sư Trưởng AI (RAG Copilot)** của xưởng gốm sứ. Hãy mô tả ý tưởng hoặc đơn đặt hàng của bạn, tôi sẽ tính toán công thức đất sét, nhiệt độ lò, loại men và bóc tách thông số kỹ thuật chuẩn. Nếu còn thiếu thông tin gì, tôi sẽ hỏi thêm để hoàn thiện kế hoạch sản xuất!',
  suggested_options: [
    'Tư vấn đơn 150 bình hút lộc men ngọc',
    'Lập kế hoạch 80 bộ ấm chén men rạn bọc đồng',
    'Sản xuất 300 ly gốm mộc quà tặng',
  ],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const RagChatModal: React.FC<RagChatModalProps> = ({
  isOpen,
  onClose,
  onActivateBatch,
  initialText = '',
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<MessageItem[]>([DEFAULT_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: MessageItem = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Chuẩn bị payload gửi backend
      const apiPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatWithAssistant(apiPayload);

      const assistantMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        is_complete: res.is_complete,
        missing_fields: res.missing_fields,
        suggested_options: res.suggested_options,
        extracted_specs: res.extracted_specs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Lỗi xử lý: ${err.message || 'Không thể kết nối AI Copilot'}. Vui lòng thử lại.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickOptionClick = (optionText: string) => {
    handleSendMessage(optionText);
  };

  const handleClearChat = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '0',
          maxWidth: '840px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#0c1222',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Trợ Lý AI RAG Chuyên Gia Xưởng Gốm
                </h3>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                  }}
                >
                  🟢 Trực tuyến
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Hội thoại tương tác, tự phát hiện thiếu thông số & tư vấn công thức gốm Bát Tràng
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleClearChat}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', color: 'var(--text-muted)' }}
              title="Xóa cuộc trò chuyện để bắt đầu mẻ mới"
            >
              <RefreshCw size={13} /> Làm mới
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px', borderRadius: '8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.2)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Bot size={16} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Bubble Text */}
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                        : 'rgba(30, 41, 59, 0.8)',
                      border: isUser
                        ? '1px solid rgba(56, 189, 248, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '13px',
                      lineHeight: 1.55,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Missing Fields Alert */}
                  {msg.missing_fields && msg.missing_fields.length > 0 && (
                    <div
                      style={{
                        marginTop: '10px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        color: '#fcd34d',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                        <AlertCircle size={14} /> Cần bổ sung thêm thông số:
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        {msg.missing_fields.map((f, i) => (
                          <span
                            key={i}
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                            }}
                          >
                            ⚠️ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Suggestion Chips */}
                  {msg.suggested_options && msg.suggested_options.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gợi ý nhanh:</span>
                      {msg.suggested_options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickOptionClick(opt)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            padding: '4px 9px',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          + {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 🚀 Ready Extracted JSON Specs Card */}
                  {msg.is_complete && msg.extracted_specs && (
                    <div
                      style={{
                        marginTop: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '10px',
                        padding: '14px',
                        width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '13px' }}>
                          <CheckCircle2 size={16} /> ĐÃ BÓC TÁCH HOÀN THIỆN ĐẦY ĐỦ THÔNG SỐ
                        </div>
                        <span className="badge badge-high">{msg.extracted_specs.priority}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
                        <div>📦 <strong>Sản phẩm:</strong> {msg.extracted_specs.product_name}</div>
                        <div>🔢 <strong>Số lượng:</strong> {msg.extracted_specs.quantity} chiếc</div>
                        <div>🧱 <strong>Đất sét:</strong> {msg.extracted_specs.technical_specs?.estimated_clay_kg} kg</div>
                        <div>🔥 <strong>Nhiệt độ nung:</strong> {msg.extracted_specs.technical_specs?.firing_specs?.target_temperature_c}°C</div>
                        <div>🎨 <strong>Loại men:</strong> {msg.extracted_specs.technical_specs?.glaze_type}</div>
                        <div>⏳ <strong>Hạn giao:</strong> {msg.extracted_specs.deadline_days} ngày</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (msg.extracted_specs) {
                            onActivateBatch(msg.extracted_specs, msg.content);
                            onClose();
                          }
                        }}
                        className="btn btn-terracotta"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: 700,
                          borderRadius: '8px',
                        }}
                      >
                        <Zap size={15} /> Kích Hoạt Mẻ Sản Xuất Này Vào Bảng Kanban
                      </button>
                    </div>
                  )}

                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(234, 88, 12, 0.2)',
                      border: '1px solid rgba(234, 88, 12, 0.3)',
                      color: '#fb923c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={16} />
              </div>
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={14} className="spin" /> Kỹ Sư Trưởng AI đang phân tích dữ liệu gốm sứ...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="Nhập yêu cầu (ví dụ: Làm 120 bình hút lộc men ngọc, hoặc trả lời câu hỏi của AI)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '11px 16px',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="btn btn-primary"
              style={{
                padding: '11px 20px',
                borderRadius: '10px',
                opacity: !inputText.trim() || isLoading ? 0.5 : 1,
              }}
            >
              <Send size={16} /> Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
