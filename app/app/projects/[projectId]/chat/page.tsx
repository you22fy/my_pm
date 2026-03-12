import ChatContainer from '@/components/ChatContainer';
import { getConversationByProject } from '@/lib/db';

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const conversation = getConversationByProject(projectId);

  return <ChatContainer initialConversationId={conversation?.id} />;
}
