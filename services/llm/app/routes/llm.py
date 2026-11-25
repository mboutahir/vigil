import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.background import BackgroundTask

from app.config import settings
from app.ollama import OllamaException, stream_chat
from app.prompts import alert_prompt, ask_prompt
from app.ratelimit import ConcurrencyLimiter, FixedWindowLimiter, Slot
from app.schemas import AskRequest, ForwardRequest

router = APIRouter()

logger = logging.getLogger(__name__)

UNAVAILABLE = "Analysis unavailable"

#our user limiter
ask_limiter = FixedWindowLimiter(settings.llm_ask_limit, settings.llm_ask_window_seconds)
#ollama limiter
ollama_limiter = ConcurrencyLimiter(settings.llm_max_concurrent, settings.llm_queue_wait_seconds)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

#getting word by word
async def _formatter(tokens: AsyncIterator[str], first: str, slot: Slot) -> AsyncIterator[str]:
    try:
        yield _sse("token", {"token": first})
        async for token in tokens:
            yield _sse("token", {"token": token})
        yield _sse("done", {})
    except OllamaException:
        logger.exception("llm stream failed")
        yield _sse("error", {"message": UNAVAILABLE})
    finally:
        await tokens.aclose()
        slot.release()

#testing ollama is working by getting the first word
async def _stream(messages: list[dict[str, str]]):
    slot = await ollama_limiter.acquire()
    if slot is None:
        #if all slots are busy we wait a bit before saying it's busy
        wait = max(1, round(ollama_limiter.wait_seconds))
        return JSONResponse(status_code=503, content={"message": f"llm busy; retry in {wait} seconds"})

    tokens = stream_chat(messages)
    try:
        #get the next word
        first = await anext(tokens)
    except (OllamaException, StopAsyncIteration):
        logger.exception("ollama unavailable")
        await tokens.aclose()
        slot.release()
        return JSONResponse(status_code=503, content={"message": UNAVAILABLE})

    return StreamingResponse(
        _formatter(tokens, first, slot),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
        #fastapi func that executes after the response finishes (safety net)
        background=BackgroundTask(slot.release),
    )



@router.post("/internal/llm/forward")
async def forward(req: ForwardRequest):
    return await _stream(alert_prompt(req))



@router.post("/internal/llm/ask")
#x_vigil_user_id the user id is sent in a header, we tell fastapi to read it from the header not the body
async def ask(req: AskRequest, x_vigil_user_id: str = Header(min_length=1, max_length=64)):
    retry = ask_limiter.try_acquire(x_vigil_user_id)
    if retry:
        return JSONResponse(status_code=429, content={"message": f"rate limited; retry in {retry} seconds"})
    return await _stream(ask_prompt(req))
