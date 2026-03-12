import { NextRequest, NextResponse } from 'next/server';
import {
  createProject,
  createConversation,
  getConversation,
  addMessage,
  getRecentMessages,
  getProject,
} from '@/lib/db';
import { callGemini } from '@/lib/gemini';
import { getSystemPrompt } from '@/lib/prompts';
import { handlePhaseCompletion } from '@/lib/phases';
import type { ChatRequest, ChatResponse, Phase } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, selectedChoiceIds } = body;
    let { conversationId } = body;

    // Build user message content
    let userContent = message;
    if (selectedChoiceIds?.length) {
      userContent += `\n[選択: ${selectedChoiceIds.join(', ')}]`;
    }

    let conversation;
    let project;

    if (conversationId) {
      conversation = getConversation(conversationId);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      project = getProject(conversation.project_id);
    } else {
      // New conversation: create project + conversation
      project = createProject();
      conversation = createConversation(project.id);
      conversationId = conversation.id;
    }

    // Save user message
    addMessage(conversationId, 'user', userContent);

    // Build context for prompts
    const context = JSON.parse(conversation.context_json || '{}');
    const phase = conversation.phase as Phase;
    const systemPrompt = getSystemPrompt(phase, context);

    // Get message history
    const history = getRecentMessages(conversationId, 20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Remove last message (just added) from history since we pass it separately
    history.pop();

    // Call Gemini
    const geminiResponse = await callGemini(systemPrompt, userContent, history);

    // Check phase completion
    let currentPhase = phase;
    const phaseResult = await handlePhaseCompletion(
      getConversation(conversationId)!,
      geminiResponse
    );

    if (phaseResult) {
      currentPhase = phaseResult.nextPhase;
      // Refresh conversation after phase transition
      conversation = getConversation(conversationId)!;
    }

    // Save assistant message
    addMessage(
      conversationId,
      'assistant',
      geminiResponse.message,
      JSON.stringify(geminiResponse),
      'structured'
    );

    const response: ChatResponse = {
      conversationId,
      projectId: conversation.project_id,
      phase: currentPhase,
      message: geminiResponse.message,
      structured_data: geminiResponse,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
