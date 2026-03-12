import { NextRequest, NextResponse } from 'next/server';
import { getProject, getDeliverables, getMilestones, getTasks, getConversationByProject } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const deliverables = getDeliverables(projectId).map(d => ({
      ...d,
      milestones: getMilestones(d.id).map(m => ({
        ...m,
        tasks: getTasks(m.id),
      })),
    }));

    const conversation = getConversationByProject(projectId);

    return NextResponse.json({
      project,
      deliverables,
      conversation: conversation ? { id: conversation.id, phase: conversation.phase } : null,
    });
  } catch (error) {
    console.error('Project detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
