import type { Phase } from '@/lib/types';

const PHASES: { key: Phase; label: string }[] = [
  { key: 'project_input', label: '目標設定' },
  { key: 'deliverables', label: '成果物' },
  { key: 'milestones', label: 'マイルストーン' },
  { key: 'tasks', label: 'タスク' },
  { key: 'completed', label: '完了' },
];

export default function PhaseIndicator({ currentPhase }: { currentPhase: Phase }) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase);

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-muted/50 border-b text-xs">
      {PHASES.map((phase, i) => (
        <div key={phase.key} className="flex items-center gap-1">
          <div
            className={`px-2 py-0.5 rounded-full ${
              i < currentIndex
                ? 'bg-primary text-primary-foreground'
                : i === currentIndex
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {phase.label}
          </div>
          {i < PHASES.length - 1 && (
            <span className="text-muted-foreground">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
