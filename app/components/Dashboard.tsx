'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DeliverableSection from './DeliverableSection';
import type { Project, Deliverable, Milestone, Task } from '@/lib/types';

interface DeliverableWithMilestones extends Deliverable {
  milestones: (Milestone & { tasks: Task[] })[];
}

interface ProjectData {
  project: Project;
  deliverables: DeliverableWithMilestones[];
  conversation: { id: string; phase: string } | null;
}

export default function Dashboard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">プロジェクトが見つかりません</div>;

  const { project, deliverables, conversation } = data;
  const allTasks = deliverables.flatMap(d => d.milestones.flatMap(m => m.tasks));
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const totalProgress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  const totalMinutes = allTasks.reduce((sum, t) => sum + t.estimated_minutes, 0);
  const doneMinutes = allTasks.filter(t => t.status === 'done').reduce((sum, t) => sum + t.estimated_minutes, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{project.name || '(未設定)'}</h1>
          <Badge>{project.status === 'active' ? '進行中' : project.status === 'completed' ? '完了' : '計画中'}</Badge>
        </div>
        <p className="text-muted-foreground">{project.goal}</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>全体進捗</span>
          <span className="font-medium">{totalProgress}% ({doneTasks}/{allTasks.length} タスク)</span>
        </div>
        <Progress value={totalProgress} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>完了: {doneMinutes}分</span>
          <span>合計: {totalMinutes}分 ({Math.round(totalMinutes / 60)}時間)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {conversation && conversation.phase !== 'completed' && (
          <Link href={`/projects/${projectId}/chat`}>
            <Button variant="outline" size="sm">計画を再開</Button>
          </Link>
        )}
      </div>

      {/* Deliverables */}
      {deliverables.length > 0 ? (
        <Accordion defaultValue={deliverables.map(d => d.id)}>
          {deliverables.map(d => (
            <DeliverableSection key={d.id} deliverable={d} />
          ))}
        </Accordion>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          まだ成果物が定義されていません。
          {conversation && (
            <Link href={`/projects/${projectId}/chat`} className="text-primary ml-1 underline">
              計画を続ける
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
