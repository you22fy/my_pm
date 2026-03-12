'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';

export default function TaskItem({ task }: { task: Task }) {
  const [status, setStatus] = useState(task.status);

  const toggleStatus = async () => {
    const newStatus = status === 'done' ? 'pending' : 'done';
    setStatus(newStatus);

    await fetch(`/api/projects/${encodeURIComponent('_')}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, status: newStatus }),
    });
  };

  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50">
      <Checkbox
        checked={status === 'done'}
        onCheckedChange={toggleStatus}
      />
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {task.name}
        </span>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
        )}
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {task.estimated_minutes}分
      </Badge>
    </div>
  );
}
