# backend/app/api/v1/ai.py
"""
AI chat endpoint — SSE streaming with hybrid provider chain.
Together.ai (Llama 3.3 70B) → Claude (premium fallback) → Ollama (local).
Stores conversations + messages in PostgreSQL.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.conversation import AIConversation, AIMessage, MessageRole
from app.services.ai.prompts import build_system_prompt
from app.services.ai.router import get_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])

# Rate limiting handled by app-level middleware in main.py

StrID = Annotated[str, BeforeValidator(str)]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=32_768)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=50)
    conversation_id: int | None = None
    context_page: str | None = Field(None, max_length=64)
    context_data: dict[str, Any] | None = None
    max_tokens: int = Field(1024, ge=64, le=4096)


class ConversationOut(BaseModel):
    id: StrID
    title: str | None
    context_page: str | None
    created_at: datetime
    message_count: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/chat")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    SSE streaming chat with hybrid AI provider chain.
    Creates / updates a conversation record and saves messages.
    """
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found for user")

    # Resolve or create conversation
    conversation: AIConversation | None = None
    if chat_request.conversation_id:
        conversation = await db.scalar(
            select(AIConversation).where(
                AIConversation.id == chat_request.conversation_id,
                AIConversation.brewery_id == brewery.id,
            )
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Auto-title from first user message
        title = chat_request.messages[0].content[:80] if chat_request.messages else None
        conversation = AIConversation(
            brewery_id=brewery.id,
            user_id=current_user.id,
            title=title,
            context_page=chat_request.context_page,
            context_data=chat_request.context_data,
        )
        db.add(conversation)
        await db.flush()

    # Save user messages
    for msg in chat_request.messages:
        if msg.role == "user":
            db.add(
                AIMessage(
                    conversation_id=conversation.id,
                    role=MessageRole.user,
                    content=msg.content,
                )
            )
    await db.commit()
    await db.refresh(conversation)

    system_prompt = build_system_prompt(
        context_page=chat_request.context_page,
        context_data=chat_request.context_data,
    )
    raw_messages = [{"role": m.role, "content": m.content} for m in chat_request.messages]

    async def event_generator():
        full_text = ""
        in_tokens: int | None = None
        out_tokens: int | None = None

        # Send conversation id first so client can track it
        yield f"data: {json.dumps({'conversation_id': conversation.id})}\n\n"

        try:
            router = get_router()
            async for chunk, it, ot in router.stream(raw_messages, system_prompt, chat_request.max_tokens):
                if chunk:
                    full_text += chunk
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                if it is not None:
                    in_tokens, out_tokens = it, ot
        except Exception as exc:
            logger.error("Streaming error: %s", exc)
            yield f"data: {json.dumps({'error': 'Streaming interrupted'})}\n\n"
            return
        finally:
            # Persist assistant reply
            if full_text:
                async with db.begin_nested():
                    db.add(
                        AIMessage(
                            conversation_id=conversation.id,
                            role=MessageRole.assistant,
                            content=full_text,
                            input_tokens=in_tokens,
                            output_tokens=out_tokens,
                        )
                    )
                    await db.commit()

        yield f"data: {json.dumps({'done': True, 'input_tokens': in_tokens, 'output_tokens': out_tokens})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    rows = await db.execute(
        select(AIConversation)
        .where(AIConversation.brewery_id == brewery.id)
        .order_by(AIConversation.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    convs = rows.scalars().all()
    if not convs:
        return []

    # Single query to get message counts for all conversations (avoids N+1)
    conv_ids = [c.id for c in convs]
    count_rows = await db.execute(
        select(AIMessage.conversation_id, func.count(AIMessage.id))
        .where(AIMessage.conversation_id.in_(conv_ids))
        .group_by(AIMessage.conversation_id)
    )
    counts = dict(count_rows.all())

    return [
        ConversationOut(
            id=c.id,
            title=c.title,
            context_page=c.context_page,
            created_at=c.created_at,
            message_count=counts.get(c.id, 0),
        )
        for c in convs
    ]


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    conv = await db.scalar(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.brewery_id == brewery.id,
        )
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = await db.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.id)
    )
    messages = msgs.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role.value,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "input_tokens": m.input_tokens,
            "output_tokens": m.output_tokens,
        }
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    conv = await db.scalar(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.brewery_id == brewery.id,
        )
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)
    await db.commit()


@router.get("/providers")
async def list_providers(current_user=Depends(get_current_user)):
    """Show configured AI providers and their status."""
    router = get_router()
    availability = await router.check_providers()
    return {
        "chain": [p.name for p in router.providers],
        "primary": router.primary.name,
        "providers": {
            p.name: {
                "available": availability.get(p.name, False),
                "model": getattr(p, "model", "unknown"),
            }
            for p in router.providers
        },
    }
