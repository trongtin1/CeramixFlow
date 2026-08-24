export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type StageNameType =
  | 'TAO_HINH_MOC'
  | 'PHOI_SUA_MOC'
  | 'VE_HOA_TIET'
  | 'TRANG_MEN'
  | 'VAO_LO_NUNG'
  | 'QC_DONG_GOI';

export interface StageLog {
  id: string;
  stageName: StageNameType;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: string | null;
  completedAt: string | null;
  notes?: string | null;
}

export interface IncidentReport {
  id: string;
  batchId: string;
  stageName: string;
  defectCount: number;
  reason: string;
  severity: 'WARNING' | 'CRITICAL';
  createdAt: string;
}

export interface TechnicalSpecs {
  dimensions?: {
    height_cm?: number;
    diameter_cm?: number;
    width_cm?: number;
  };
  estimated_clay_kg: number;
  glaze_type: string;
  firing_specs: {
    target_temperature_c: number;
    estimated_duration_hours: number;
    firing_curve?: string;
  };
  craft_technique?: string;
  artwork_details?: string;
  additional_notes?: string[];
  [key: string]: any;
}

export interface Batch {
  id: string;
  batchCode: string;
  rawDescription: string;
  productName: string;
  quantity: number;
  priority: Priority;
  overallStatus: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentStage: StageNameType;
  deadlineDays: number | null;
  technicalSpecs: TechnicalSpecs;
  createdAt: string;
  updatedAt: string;
  stages?: StageLog[];
  incidents?: IncidentReport[];
}

export interface AiParsedOrder {
  product_name: string;
  quantity: number;
  deadline_days: number | null;
  priority: Priority;
  technical_specs: TechnicalSpecs;
  ai_reasoning?: string;
}

export interface SystemEventLog {
  id: string;
  eventType: string;
  title: string;
  message: string;
  metadata: any;
  createdAt: string;
}

export interface DashboardStats {
  totalBatches: number;
  inProgressBatches: number;
  completedBatches: number;
  totalIncidents: number;
}
