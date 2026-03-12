import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatus } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: 'taskId and status are required' }, { status: 400 });
    }

    updateTaskStatus(taskId, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
