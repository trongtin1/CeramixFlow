import { Batch, AiParsedOrder, DashboardStats, SystemEventLog, Priority } from '../types';

const API_BASE = '/api';

export async function parseOrderWithAi(text: string): Promise<AiParsedOrder> {
  const res = await fetch(`${API_BASE}/orders/parse-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi bóc tách AI');
  }
  return json.data;
}

export async function createBatch(data: {
  raw_description: string;
  product_name: string;
  quantity: number;
  priority: Priority;
  deadline_days?: number | null;
  technical_specs: any;
}): Promise<Batch> {
  const res = await fetch(`${API_BASE}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi khởi tạo mẻ');
  }
  return json.data;
}

export async function getAllBatches(): Promise<Batch[]> {
  const res = await fetch(`${API_BASE}/batches`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi tải danh sách mẻ');
  }
  return json.data;
}

export async function advanceBatchStage(batchId: string): Promise<Batch> {
  const res = await fetch(`${API_BASE}/batches/${batchId}/advance`, {
    method: 'PATCH',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi chuyển công đoạn');
  }
  return json.data;
}

export async function reportQcIncident(
  batchId: string,
  data: { defect_count: number; reason: string; severity?: 'WARNING' | 'CRITICAL' }
): Promise<any> {
  const res = await fetch(`${API_BASE}/batches/${batchId}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi báo cáo sự cố');
  }
  return json.data;
}

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentLogs: SystemEventLog[];
}> {
  const res = await fetch(`${API_BASE}/system/dashboard`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi tải dashboard');
  }
  return json.data;
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/system/reset-demo`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi reset');
  }
}
