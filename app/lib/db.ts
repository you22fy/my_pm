import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Conversation, Message, Deliverable, Milestone, Task, Phase } from './types';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'data', 'mypm.db');
  const fs = require('fs');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planning',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      phase TEXT NOT NULL DEFAULT 'project_input',
      context_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      structured_data TEXT,
      message_type TEXT NOT NULL DEFAULT 'text',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      measurement TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      deliverable_id TEXT NOT NULL REFERENCES deliverables(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      milestone_id TEXT NOT NULL REFERENCES milestones(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      estimated_minutes INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'pending',
      sort_order INTEGER NOT NULL DEFAULT 0,
      depends_on TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

// Projects
export function createProject(name: string = '', goal: string = ''): Project {
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO projects (id, name, goal) VALUES (?, ?, ?)').run(id, name, goal);
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
}

export function getProject(id: string): Project | undefined {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function getAllProjects(): Project[] {
  return getDb().prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
}

export function updateProject(id: string, data: Partial<Pick<Project, 'name' | 'goal' | 'status'>>): void {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.goal !== undefined) { sets.push('goal = ?'); values.push(data.goal); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

// Conversations
export function createConversation(projectId: string, phase: Phase = 'project_input'): Conversation {
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO conversations (id, project_id, phase) VALUES (?, ?, ?)').run(id, projectId, phase);
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation;
}

export function getConversation(id: string): Conversation | undefined {
  return getDb().prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined;
}

export function getConversationByProject(projectId: string): Conversation | undefined {
  return getDb().prepare('SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId) as Conversation | undefined;
}

export function updateConversationPhase(id: string, phase: Phase, contextJson?: string): void {
  const db = getDb();
  if (contextJson !== undefined) {
    db.prepare("UPDATE conversations SET phase = ?, context_json = ?, updated_at = datetime('now') WHERE id = ?").run(phase, contextJson, id);
  } else {
    db.prepare("UPDATE conversations SET phase = ?, updated_at = datetime('now') WHERE id = ?").run(phase, id);
  }
}

// Messages
export function addMessage(conversationId: string, role: string, content: string, structuredData?: string, messageType: string = 'text'): Message {
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, structured_data, message_type) VALUES (?, ?, ?, ?, ?, ?)').run(id, conversationId, role, content, structuredData || null, messageType);
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
}

export function getMessages(conversationId: string, limit: number = 20): Message[] {
  return getDb().prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?').all(conversationId, limit) as Message[];
}

export function getRecentMessages(conversationId: string, limit: number = 20): Message[] {
  const rows = getDb().prepare(
    'SELECT * FROM (SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?) ORDER BY created_at ASC'
  ).all(conversationId, limit) as Message[];
  return rows;
}

// Deliverables
export function createDeliverable(projectId: string, name: string, description: string, measurement: string, sortOrder: number): Deliverable {
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO deliverables (id, project_id, name, description, measurement, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(id, projectId, name, description, measurement, sortOrder);
  return db.prepare('SELECT * FROM deliverables WHERE id = ?').get(id) as Deliverable;
}

export function getDeliverables(projectId: string): Deliverable[] {
  return getDb().prepare('SELECT * FROM deliverables WHERE project_id = ? ORDER BY sort_order ASC').all(projectId) as Deliverable[];
}

// Milestones
export function createMilestone(deliverableId: string, name: string, description: string, sortOrder: number): Milestone {
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO milestones (id, deliverable_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)').run(id, deliverableId, name, description, sortOrder);
  return db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as Milestone;
}

export function getMilestones(deliverableId: string): Milestone[] {
  return getDb().prepare('SELECT * FROM milestones WHERE deliverable_id = ? ORDER BY sort_order ASC').all(deliverableId) as Milestone[];
}

// Tasks
export function createTask(milestoneId: string, name: string, description: string, estimatedMinutes: number, sortOrder: number, dependsOn?: string): Task {
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO tasks (id, milestone_id, name, description, estimated_minutes, sort_order, depends_on) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, milestoneId, name, description, estimatedMinutes, sortOrder, dependsOn || null);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
}

export function getTasks(milestoneId: string): Task[] {
  return getDb().prepare('SELECT * FROM tasks WHERE milestone_id = ? ORDER BY sort_order ASC').all(milestoneId) as Task[];
}

export function updateTaskStatus(taskId: string, status: string): void {
  getDb().prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, taskId);
}

export function getAllTasksForProject(projectId: string): Task[] {
  return getDb().prepare(`
    SELECT t.* FROM tasks t
    JOIN milestones m ON t.milestone_id = m.id
    JOIN deliverables d ON m.deliverable_id = d.id
    WHERE d.project_id = ?
    ORDER BY d.sort_order, m.sort_order, t.sort_order
  `).all(projectId) as Task[];
}
