import type { Phase, GeminiResponse, Conversation } from './types';
import {
  getConversation,
  updateConversationPhase,
  getProject,
  updateProject,
  createDeliverable,
  getDeliverables,
  createMilestone,
  getMilestones,
  createTask,
} from './db';

interface PhaseResult {
  nextPhase: Phase;
  contextUpdate?: Record<string, unknown>;
}

export async function handlePhaseCompletion(
  conversation: Conversation,
  response: GeminiResponse
): Promise<PhaseResult | null> {
  if (!response.is_phase_complete || !response.confirmed_items) return null;

  const phase = conversation.phase as Phase;
  const context = JSON.parse(conversation.context_json || '{}');

  switch (phase) {
    case 'project_input':
      return handleProjectInputComplete(conversation, response, context);
    case 'deliverables':
      return handleDeliverablesComplete(conversation, response, context);
    case 'milestones':
      return handleMilestonesComplete(conversation, response, context);
    case 'tasks':
      return handleTasksComplete(conversation, response, context);
    default:
      return null;
  }
}

function handleProjectInputComplete(
  conversation: Conversation,
  response: GeminiResponse,
  _context: Record<string, unknown>
): PhaseResult {
  const item = response.confirmed_items![0] as { project_name: string; project_goal: string };
  updateProject(conversation.project_id, {
    name: item.project_name,
    goal: item.project_goal,
  });

  const project = getProject(conversation.project_id)!;
  const newContext = { project: { name: project.name, goal: project.goal } };
  updateConversationPhase(conversation.id, 'deliverables', JSON.stringify(newContext));

  return { nextPhase: 'deliverables', contextUpdate: newContext };
}

function handleDeliverablesComplete(
  conversation: Conversation,
  response: GeminiResponse,
  context: Record<string, unknown>
): PhaseResult {
  const items = response.confirmed_items as { name: string; description: string; measurement: string }[];
  for (let i = 0; i < items.length; i++) {
    createDeliverable(conversation.project_id, items[i].name, items[i].description, items[i].measurement, i);
  }

  const deliverables = getDeliverables(conversation.project_id);
  const newContext = {
    ...context,
    deliverables,
    currentDeliverableIndex: 0,
    currentDeliverable: deliverables[0],
  };
  updateConversationPhase(conversation.id, 'milestones', JSON.stringify(newContext));

  return { nextPhase: 'milestones', contextUpdate: newContext };
}

function handleMilestonesComplete(
  conversation: Conversation,
  response: GeminiResponse,
  context: Record<string, unknown>
): PhaseResult {
  const deliverables = getDeliverables(conversation.project_id);
  const currentIndex = (context.currentDeliverableIndex as number) || 0;
  const currentDeliverable = deliverables[currentIndex];

  const items = response.confirmed_items as { name: string; description: string }[];
  for (let i = 0; i < items.length; i++) {
    createMilestone(currentDeliverable.id, items[i].name, items[i].description, i);
  }

  // Move to next deliverable or to tasks phase
  const nextIndex = currentIndex + 1;
  if (nextIndex < deliverables.length) {
    const newContext = {
      ...context,
      currentDeliverableIndex: nextIndex,
      currentDeliverable: deliverables[nextIndex],
    };
    updateConversationPhase(conversation.id, 'milestones', JSON.stringify(newContext));
    return { nextPhase: 'milestones', contextUpdate: newContext };
  }

  // All deliverables have milestones, move to tasks
  const allMilestones = deliverables.flatMap(d => getMilestones(d.id));
  const newContext = {
    ...context,
    currentMilestoneIndex: 0,
    currentMilestone: allMilestones[0],
    allMilestones,
  };
  updateConversationPhase(conversation.id, 'tasks', JSON.stringify(newContext));
  return { nextPhase: 'tasks', contextUpdate: newContext };
}

function handleTasksComplete(
  conversation: Conversation,
  response: GeminiResponse,
  context: Record<string, unknown>
): PhaseResult {
  const deliverables = getDeliverables(conversation.project_id);
  const allMilestones = deliverables.flatMap(d => getMilestones(d.id));
  const currentMilestoneIndex = (context.currentMilestoneIndex as number) || 0;
  const currentMilestone = allMilestones[currentMilestoneIndex];

  const items = response.confirmed_items as { name: string; description: string; estimated_minutes: number; depends_on?: string }[];
  for (let i = 0; i < items.length; i++) {
    createTask(currentMilestone.id, items[i].name, items[i].description, items[i].estimated_minutes || 30, i, items[i].depends_on || undefined);
  }

  // Move to next milestone or complete
  const nextIndex = currentMilestoneIndex + 1;
  if (nextIndex < allMilestones.length) {
    const newContext = {
      ...context,
      currentMilestoneIndex: nextIndex,
      currentMilestone: allMilestones[nextIndex],
      allMilestones,
    };
    updateConversationPhase(conversation.id, 'tasks', JSON.stringify(newContext));
    return { nextPhase: 'tasks', contextUpdate: newContext };
  }

  // All milestones have tasks, project planning is complete
  updateProject(conversation.project_id, { status: 'active' });
  updateConversationPhase(conversation.id, 'completed', JSON.stringify(context));
  return { nextPhase: 'completed' };
}
