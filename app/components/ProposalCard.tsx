import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Proposal } from '@/lib/types';

interface ProposalCardProps {
  proposals: Proposal[];
}

export default function ProposalCard({ proposals }: ProposalCardProps) {
  return (
    <div className="flex flex-col gap-2 my-2">
      {proposals.map((proposal, i) => (
        <Card key={proposal.id || i} className="bg-muted/30">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{i + 1}</Badge>
              {proposal.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3 pb-2 text-xs text-muted-foreground">
            <p>{proposal.description}</p>
            {proposal.measurement && (
              <p className="mt-1">測定基準: {proposal.measurement}</p>
            )}
            {proposal.estimated_minutes && (
              <p className="mt-1">見積: {proposal.estimated_minutes}分</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
