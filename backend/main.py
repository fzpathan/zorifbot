import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.responses import StreamingResponse

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Enhance prompt
def enhance_prompt(original_prompt: str) -> str:
    enhancement_prefix = (
        "You are an expert AI assistant. Please provide a detailed, accurate, and helpful response to the following query. Be specific, include examples where appropriate, and structure your response clearly.\n\nQuery: "
    )
    enhancement_suffix = "\n\nPlease ensure your response is:\n- Accurate and well-researched\n- Clear and easy to understand\n- Includes practical examples if relevant\n- Structured with proper formatting\n- Comprehensive yet concise"
    return enhancement_prefix + original_prompt + enhancement_suffix

# Helper: Call DeepSeek API
async def call_external_ai_api(prompt: str, model: str) -> str:
    # Placeholder URLs and API keys - replace with your real endpoints and keys
    endpoints = {
        "deepseek": {
            "url": "https://api.deepseek.com/v1/chat",
            "api_key": os.getenv("DEEPSEEK_API_KEY", "your_deepseek_api_key")
        },
        "phi4": {
            "url": "https://api.phi4.com/v1/chat",
            "api_key": os.getenv("PHI4_API_KEY", "your_phi4_api_key")
        }
    }
    model_key = model if model in endpoints else "deepseek"
    endpoint = endpoints[model_key]
    headers = {"Authorization": f"Bearer {endpoint['api_key']}"}
    payload = {"prompt": prompt, "model": model_key}
    async with httpx.AsyncClient() as client:
        response = await client.post(endpoint["url"], json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        # Assume the response JSON has a 'result' field with the AI's reply
        return response.json().get("result", "[No response from AI]")

# --- API Endpoints ---

@app.post("/api/message")
async def send_message(
    data: dict = Body(...),
):
    content = data.get("content")
    is_enhanced = data.get("is_enhanced", False)
    history = data.get("history", [])
    model = data.get("model", "deepseek")
    if not content or not isinstance(content, str):
        raise HTTPException(status_code=400, detail="Content is required")
    context = "\n".join([
        f"{msg['sender']}: {msg['content']}" for msg in history if 'sender' in msg and 'content' in msg
    ])
    prompt_to_send = enhance_prompt(content) if is_enhanced else content
    if context:
        prompt_to_send = f"Previous conversation:\n{context}\n\nCurrent: {prompt_to_send}"

    # Use httpx to call the external AI API
    ai_response = await call_external_ai_api(prompt_to_send, model)

    async def fake_stream_response(text: str):
        for i in range(0, len(text), 30):
            yield text[i:i+30]
            import asyncio
            await asyncio.sleep(0.05)

    return StreamingResponse(fake_stream_response(ai_response), media_type="text/plain")

@app.get("/api/prompt-templates")
def get_prompt_templates():
    return []  # Prompt templates are now managed on the frontend only

@app.get("/api/prompt-templates/{category}")
def get_prompt_templates_by_category(category: str):
    return []  # Prompt templates are now managed on the frontend only

@app.post("/api/enhance-prompt")
def enhance_prompt_endpoint(
    data: dict = Body(...),
):
    prompt = data.get("prompt")
    if not prompt or not isinstance(prompt, str):
        raise HTTPException(status_code=400, detail="Prompt is required")
    enhanced = enhance_prompt(prompt)
    return {"originalPrompt": prompt, "enhancedPrompt": enhanced} 