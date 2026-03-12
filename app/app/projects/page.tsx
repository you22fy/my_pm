import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/components/ProjectCard';
import { getAllProjects } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">プロジェクト</h1>
        <Link href="/projects/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>プロジェクトがありません。</p>
          <Link href="/projects/new" className="text-primary underline mt-2 inline-block">
            最初のプロジェクトを作成する
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
