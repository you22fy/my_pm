'use client';

import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TaskItem from './TaskItem';
import type { Deliverable, Milestone, Task } from '@/lib/types';

interface DeliverableWithMilestones extends Deliverable {
  milestones: (Milestone & { tasks: Task[] })[];
}

export default function DeliverableSection({ deliverable }: { deliverable: DeliverableWithMilestones }) {
  const allTasks = deliverable.milestones.flatMap(m => m.tasks);
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <AccordionItem value={deliverable.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="font-medium">{deliverable.name}</span>
          <Badge variant="outline" className="text-xs">
            {doneTasks}/{allTasks.length}
          </Badge>
          <div className="w-24 ml-auto mr-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-sm text-muted-foreground mb-2">{deliverable.description}</p>
        <p className="text-xs text-muted-foreground mb-3">測定基準: {deliverable.measurement}</p>

        {deliverable.milestones.map(milestone => (
          <div key={milestone.id} className="mb-4 last:mb-0">
            <h4 className="text-sm font-medium mb-1 pl-2 border-l-2 border-primary">
              {milestone.name}
            </h4>
            <p className="text-xs text-muted-foreground mb-2 pl-2">{milestone.description}</p>
            <div className="pl-2">
              {milestone.tasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
              {milestone.tasks.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">タスクなし</p>
              )}
            </div>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
