import os
import logging
from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.responses import StreamingResponse
from typing import Optional
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Enhance prompt with category context
def enhance_prompt(original_prompt: str, selected_category: Optional[str] = None) -> str:
    enhancement_prefix = (
        "You are an expert AI assistant. Please provide a detailed, accurate, and helpful response to the following query. Be specific, include examples where appropriate, and structure your response clearly.\n\n"
    )
    
    # Add category-specific context if provided
    if selected_category:
        category_context = f"Context: The user is working in the '{selected_category}' domain. Please tailor your response accordingly.\n\n"
        enhancement_prefix += category_context
    
    enhancement_prefix += "Query: "
    enhancement_suffix = "\n\nPlease ensure your response is:\n- Accurate and well-researched\n- Clear and easy to understand\n- Includes practical examples if relevant\n- Structured with proper formatting\n- Comprehensive yet concise"
    
    return enhancement_prefix + original_prompt + enhancement_suffix

# Helper: Call DeepSeek API
async def call_external_ai_api(prompt: str, model: str, user_id: str) -> str:
    # Log the API call for debugging
    logger.info(f"Calling AI API for user {user_id} with model {model}")
    
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
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint["url"], json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            # Assume the response JSON has a 'result' field with the AI's reply
            result = response.json().get("result", "[No response from AI]")
            logger.info(f"Successfully received response for user {user_id}")
            return result
    except Exception as e:
        logger.error(f"Error calling AI API for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")

# Helper: Process uploaded document
async def process_uploaded_document(file: UploadFile, user_id: str) -> dict:
    """Process uploaded document and return metadata"""
    try:
        # Validate file type
        allowed_types = {
            "application/pdf": "pdf",
            "text/plain": "txt",
            "application/msword": "doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Validate file size (10MB limit)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        # Read file content
        content = await file.read()
        
        # In a real implementation, you would:
        # 1. Save the file to storage
        # 2. Process the content (extract text, analyze, etc.)
        # 3. Store metadata in database
        # 4. Return document ID and metadata
        
        logger.info(f"Document uploaded by user {user_id}: {file.filename} ({len(content)} bytes)")
        
        return {
            "filename": file.filename,
            "size": len(content),
            "type": allowed_types[file.content_type],
            "user_id": user_id,
            "status": "uploaded",
            "message": "Document uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"Error processing document for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document processing error: {str(e)}")

# --- API Endpoints ---

@app.post("/api/message")
async def send_message(
    data: dict = Body(...),
):
    """Enhanced message endpoint with user ID and category support"""
    try:
        content = data.get("content")
        is_enhanced = data.get("is_enhanced", False)
        history = data.get("history", [])
        model = data.get("model", "deepseek")
        user_id = data.get("user_id", "unknown")
        selected_category = data.get("selected_category")
        
        # Validate required fields
        if not content or not isinstance(content, str):
            raise HTTPException(status_code=400, detail="Content is required")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        logger.info(f"Processing message for user {user_id} with category: {selected_category}")
        
        # Build context from conversation history
        context = "\n".join([
            f"{msg['sender']}: {msg['content']}" for msg in history if 'sender' in msg and 'content' in msg
        ])
        
        # Enhance prompt with category context
        prompt_to_send = enhance_prompt(content, selected_category) if is_enhanced else content
        
        if context:
            prompt_to_send = f"Previous conversation:\n{context}\n\nCurrent: {prompt_to_send}"
        
        # Call external AI API
        ai_response = await call_external_ai_api(prompt_to_send, model, user_id)
        
        # Stream the response
        async def stream_response(text: str):
            for i in range(0, len(text), 30):
                yield text[i:i+30]
                import asyncio
                await asyncio.sleep(0.05)
        
        return StreamingResponse(stream_response(ai_response), media_type="text/plain")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Body(..., embed=True)
):
    """Upload and process document endpoint"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        if not file:
            raise HTTPException(status_code=400, detail="File is required")
        
        # Process the uploaded document
        result = await process_uploaded_document(file, user_id)
        
        logger.info(f"Document upload completed for user {user_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload_document: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/prompt-templates")
def get_prompt_templates():
    """Return empty array since templates are managed on frontend"""
    return []

@app.get("/api/prompt-templates/{category}")
def get_prompt_templates_by_category(category: str):
    """Return empty array since templates are managed on frontend"""
    return []

@app.post("/api/enhance-prompt")
def enhance_prompt_endpoint(
    data: dict = Body(...),
):
    """Enhance prompt endpoint"""
    try:
        prompt = data.get("prompt")
        selected_category = data.get("selected_category")
        
        if not prompt or not isinstance(prompt, str):
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        enhanced = enhance_prompt(prompt, selected_category)
        return {"originalPrompt": prompt, "enhancedPrompt": enhanced}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in enhance_prompt: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 