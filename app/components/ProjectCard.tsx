import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  planning: { label: '計画中', variant: 'outline' },
  active: { label: '進行中', variant: 'default' },
  completed: { label: '完了', variant: 'secondary' },
};

export default function ProjectCard({ project }: { project: Project }) {
  const status = STATUS_LABELS[project.status] || STATUS_LABELS.planning;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{project.name || '(未設定)'}</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.goal || 'プロジェクトの目標を設定中...'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            作成: {new Date(project.created_at).toLocaleDateString('ja-JP')}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
