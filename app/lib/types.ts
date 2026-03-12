export type Phase = 'project_input' | 'deliverables' | 'milestones' | 'tasks' | 'completed';

export interface Project {
  id: string;
  name: string;
  goal: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  phase: Phase;
  context_json: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  structured_data: string | null;
  message_type: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  name: string;
  description: string;
  measurement: string;
  status: string;
  sort_order: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  deliverable_id: string;
  name: string;
  description: string;
  status: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  milestone_id: string;
  name: string;
  description: string;
  estimated_minutes: number;
  status: string;
  sort_order: number;
  depends_on: string | null;
  created_at: string;
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
}

export interface Proposal {
  id: string;
  name: string;
  description: string;
  measurement?: string;
  estimated_minutes?: number;
  depends_on?: string;
}

export interface GeminiResponse {
  message: string;
  choices?: Choice[];
  proposals?: Proposal[];
  is_phase_complete: boolean;
  confirmed_items?: Record<string, unknown>[];
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  selectedChoiceIds?: string[];
}

export interface ChatResponse {
  conversationId: string;
  projectId: string;
  phase: Phase;
  message: string;
  structured_data: GeminiResponse | null;
}
