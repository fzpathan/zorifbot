import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import httpx

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
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "default_key")
async def call_deepseek_api(prompt: str) -> str:
    # Replace with actual DeepSeek API call
    # Simulate response for now
    return f'I understand you\'re asking about: "{prompt[:100]}..."\n\nThis is a simulated response from the DeepSeek model.'

# --- API Endpoints ---

@app.post("/api/message")
async def send_message(
    data: dict = Body(...),
):
    content = data.get("content")
    is_enhanced = data.get("is_enhanced", False)
    if not content or not isinstance(content, str):
        raise HTTPException(status_code=400, detail="Content is required")
    prompt_to_send = enhance_prompt(content) if is_enhanced else content
    ai_response = await call_deepseek_api(prompt_to_send)
    return {"userMessage": content, "aiMessage": ai_response}

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