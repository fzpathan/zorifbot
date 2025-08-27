import os
import logging
import time
from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.responses import StreamingResponse
from typing import Optional
import json
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

# Helper: Generate fallback response
def generate_fallback_response(prompt: str) -> str:
    """Generate a helpful fallback response when API is not available"""
    prompt_lower = prompt.lower().strip()
    
    # Simple keyword-based responses
    if any(word in prompt_lower for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm your AI assistant. I'm currently in offline mode due to missing API key, but I'm here to help. How can I assist you today?"
    
    elif any(word in prompt_lower for word in ['code', 'programming', 'function', 'algorithm']):
        return f"I see you're asking about code: '{prompt}'. While I'm in offline mode, I can suggest that you:\n\n1. Check the syntax and structure of your code\n2. Look for common programming patterns\n3. Consider edge cases and error handling\n4. Test with different inputs\n\nWould you like me to help you with any specific programming concepts when the API is available?"
    
    elif any(word in prompt_lower for word in ['explain', 'what is', 'how does']):
        return f"You're asking: '{prompt}'. This is a great question! While I'm in offline mode, I'd recommend:\n\n1. Breaking down the concept into smaller parts\n2. Looking for real-world examples\n3. Checking official documentation\n4. Practicing with simple examples\n\nI'll be able to provide more detailed explanations once the API is available."
    
    elif any(word in prompt_lower for word in ['help', 'assist', 'support']):
        return "I'm here to help! While I'm currently in offline mode, I can still guide you. What specific area do you need assistance with? I'll be able to provide more detailed help once the API connection is restored."
    
    else:
        return f"Thank you for your message: '{prompt}'. I'm currently in offline mode due to missing API key, but I'm here to assist you. I'll be able to provide more comprehensive responses once the API connection is available. Is there anything specific I can help you with?"

# Helper: Call AI API (OpenRouter with Phi-4)
async def call_external_ai_api(prompt: str, model: str, user_id: str) -> str:
    logger.info(f"Calling AI API for user {user_id} with model {model}")
    
    # OpenRouter API configuration
    if model == "phi4":
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            logger.warning("OpenRouter API key not configured, using fallback response")
            return generate_fallback_response(prompt)
        
        try:
            # Initialize OpenAI client with OpenRouter configuration
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            
            # Create completion using OpenRouter
            completion = client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",  # Your frontend URL
                    "X-Title": "ZorifBot",  # Your app name
                },
                model="microsoft/phi-4",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            result = completion.choices[0].message.content
            logger.info(f"Successfully received OpenRouter Phi-4 response for user {user_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error calling OpenRouter API for user {user_id}: {str(e)}")
            return generate_fallback_response(prompt)
    
    # DeepSeek API configuration (fallback)
    elif model == "deepseek":
        url = "https://api.deepseek.com/v1/chat/completions"
        api_key = os.getenv("DEEPSEEK_API_KEY")
        
        if not api_key:
            logger.warning("DeepSeek API key not configured, using fallback response")
            return generate_fallback_response(prompt)
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {api_key}"
        }
        
        # DeepSeek expects messages array format
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
                
                # Handle specific error codes
                if response.status_code == 402:
                    logger.error("DeepSeek API: Payment required - insufficient credits or billing not set up")
                    return generate_fallback_response(prompt)
                
                response.raise_for_status()
                
                # Parse DeepSeek response format
                response_data = response.json()
                if 'choices' in response_data and len(response_data['choices']) > 0:
                    result = response_data['choices'][0]['message']['content']
                    logger.info(f"Successfully received DeepSeek response for user {user_id}")
                    return result
                else:
                    raise HTTPException(status_code=500, detail="Invalid response format from DeepSeek")
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"DeepSeek API HTTP error: {e.response.status_code} - {e.response.text}")
            return generate_fallback_response(prompt)
        except Exception as e:
            logger.error(f"Error calling DeepSeek API for user {user_id}: {str(e)}")
            return generate_fallback_response(prompt)
    
    # Fallback for other models (placeholder)
    else:
        logger.warning(f"Model {model} not implemented, using placeholder response")
        return f"This is a placeholder response for model {model}. Your prompt was: {prompt}"

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
        model = data.get("model", "phi4")
        user_id = data.get("user_id")
        selected_category = data.get("selected_category")
        
        # Validate required fields
        if not content or not isinstance(content, str):
            raise HTTPException(status_code=400, detail="Content is required")
        
        # If no user_id provided, generate a new one
        if not user_id:
            user_id = "backend-user-" + str(int(time.time() * 1000))[-8:]
        
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
        
        # Stream the response with user_id included
        async def stream_response(text: str):
            # First yield the user_id as a special header
            yield f"USER_ID:{user_id}\n"
            # Then stream the actual response
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
    user_id: Optional[str] = Body(None, embed=True)
):
    """Upload and process document endpoint"""
    try:
        # If no user_id provided, generate a new one
        if not user_id:
            user_id = "backend-user-" + str(int(time.time() * 1000))[-8:]
        
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

# Prompt templates data - centralized in backend
PROMPT_TEMPLATES = [
    {
        "id": "custom-1",
        "category": "Productivity",
        "title": "Summarize this text",
        "template": "Please summarize the following text in a concise way:",
        "icon": "fas fa-align-left"
    },
    {
        "id": "custom-2",
        "category": "Learning",
        "title": "Explain this concept simply",
        "template": "Explain the following concept in simple terms for a beginner:",
        "icon": "fas fa-graduation-cap"
    },
    {
        "id": "default-1",
        "category": "Code Analysis",
        "title": "Analyze this code for optimization opportunities",
        "template": "Please analyze the following code for optimization opportunities, focusing on performance, memory usage, and algorithmic efficiency. Provide specific suggestions with examples:",
        "icon": "fas fa-code"
    },
    {
        "id": "default-2",
        "category": "Code Analysis",
        "title": "Explain the security implications of this function",
        "template": "Review the following code for security vulnerabilities and explain potential risks. Include recommendations for secure coding practices:",
        "icon": "fas fa-shield-alt"
    },
    {
        "id": "default-3",
        "category": "Code Analysis",
        "title": "Review code for best practices and conventions",
        "template": "Please review this code for adherence to best practices, coding conventions, and maintainability. Suggest improvements for readability and structure:",
        "icon": "fas fa-check-circle"
    },
    {
        "id": "default-4",
        "category": "Problem Solving",
        "title": "Break down this complex problem step by step",
        "template": "Help me break down this complex problem into smaller, manageable steps. Provide a systematic approach to solving:",
        "icon": "fas fa-puzzle-piece"
    },
    {
        "id": "default-5",
        "category": "Problem Solving",
        "title": "What are alternative solutions to this issue?",
        "template": "Analyze this problem and suggest multiple alternative solutions. Compare the pros and cons of each approach:",
        "icon": "fas fa-lightbulb"
    },
    {
        "id": "default-6",
        "category": "Documentation",
        "title": "Generate comprehensive documentation for this code",
        "template": "Create comprehensive documentation for the following code, including function descriptions, parameter explanations, return values, and usage examples:",
        "icon": "fas fa-file-alt"
    },
    {
        "id": "default-7",
        "category": "Documentation",
        "title": "Create API documentation with examples",
        "template": "Generate API documentation for this code including endpoint descriptions, request/response formats, authentication requirements, and practical examples:",
        "icon": "fas fa-book"
    },
    {
        "id": "default-8",
        "category": "Research",
        "title": "Research this topic thoroughly",
        "template": "Conduct comprehensive research on the following topic, including current trends, best practices, and recent developments:",
        "icon": "fas fa-search"
    },
    {
        "id": "default-9",
        "category": "Creative Writing",
        "title": "Write creatively about this topic",
        "template": "Write a creative piece about the following topic, using engaging storytelling techniques:",
        "icon": "fas fa-pen-fancy"
    }
]

# Helper function to get category icon
def get_category_icon(category: str) -> str:
    """Get icon class for a given category"""
    category_icons = {
        "Code Analysis": "fas fa-code",
        "Problem Solving": "fas fa-puzzle-piece",
        "Documentation": "fas fa-file-alt",
        "Productivity": "fas fa-align-left",
        "Learning": "fas fa-graduation-cap",
        "Research": "fas fa-search",
        "Creative Writing": "fas fa-pen-fancy"
    }
    return category_icons.get(category, "fas fa-lightbulb")

@app.get("/api/categories")
def get_categories():
    """Get all available categories"""
    try:
        # Extract unique categories from templates
        categories = list(set(template["category"] for template in PROMPT_TEMPLATES))
        
        # Return categories with their icons
        category_list = [
            {
                "name": category,
                "icon": get_category_icon(category),
                "count": len([t for t in PROMPT_TEMPLATES if t["category"] == category])
            }
            for category in sorted(categories)
        ]
        
        logger.info(f"Retrieved {len(category_list)} categories")
        return category_list
        
    except Exception as e:
        logger.error(f"Error retrieving categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving categories")

@app.get("/api/prompt-templates")
def get_prompt_templates():
    """Get all prompt templates"""
    try:
        logger.info(f"Retrieved {len(PROMPT_TEMPLATES)} prompt templates")
        return PROMPT_TEMPLATES
        
    except Exception as e:
        logger.error(f"Error retrieving prompt templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving prompt templates")

@app.get("/api/prompt-templates/{category}")
def get_prompt_templates_by_category(category: str):
    """Get prompt templates for a specific category"""
    try:
        if not category:
            raise HTTPException(status_code=400, detail="Category is required")
        
        # Filter templates by category
        category_templates = [
            template for template in PROMPT_TEMPLATES 
            if template["category"].lower() == category.lower()
        ]
        
        logger.info(f"Retrieved {len(category_templates)} templates for category '{category}'")
        return category_templates
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving templates for category '{category}': {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving category templates")

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

# Conversation endpoints
@app.get("/api/conversations")
async def get_user_conversations():
    """Get all conversations for the current user"""
    try:
        # Generate a user ID for this request
        user_id = "backend-user-" + str(int(time.time() * 1000))[-8:]
        
        # Mock data for now - in a real implementation, this would query a database
        mock_conversations = [
            {
                "id": "conv_1",
                "title": "Python Code Optimization",
                "lastMessage": "How can I optimize this sorting algorithm?",
                "messageCount": 8,
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-01-15T14:22:00Z",
                "user_id": user_id
            },
            {
                "id": "conv_2", 
                "title": "React Component Design",
                "lastMessage": "What's the best way to structure this component?",
                "messageCount": 12,
                "createdAt": "2024-01-14T09:15:00Z",
                "updatedAt": "2024-01-14T16:45:00Z",
                "user_id": user_id
            },
            {
                "id": "conv_3",
                "title": "Database Schema Question",
                "lastMessage": "Should I use a foreign key here?",
                "messageCount": 5,
                "createdAt": "2024-01-13T13:20:00Z",
                "updatedAt": "2024-01-13T15:10:00Z",
                "user_id": user_id
            }
        ]
        
        logger.info(f"Retrieved {len(mock_conversations)} conversations for user {user_id}")
        return mock_conversations
        
    except Exception as e:
        logger.error(f"Error retrieving conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving conversations")

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation by ID"""
    try:
        if not conversation_id:
            raise HTTPException(status_code=400, detail="Conversation ID is required")
        
        # Mock deletion - in a real implementation, this would delete from database
        logger.info(f"Deleted conversation {conversation_id}")
        return {"message": "Conversation deleted successfully", "conversation_id": conversation_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting conversation")

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Get all messages for a specific conversation"""
    try:
        if not conversation_id:
            raise HTTPException(status_code=400, detail="Conversation ID is required")
        
        # Mock messages - in a real implementation, this would query database
        mock_messages = [
            {
                "id": "msg_1",
                "content": "How can I optimize this sorting algorithm?",
                "sender": "user",
                "timestamp": "2024-01-15T10:30:00Z",
                "conversation_id": conversation_id
            },
            {
                "id": "msg_2",
                "content": "Here are several ways to optimize your sorting algorithm...",
                "sender": "assistant",
                "timestamp": "2024-01-15T10:31:00Z",
                "conversation_id": conversation_id
            }
        ]
        
        logger.info(f"Retrieved {len(mock_messages)} messages for conversation {conversation_id}")
        return mock_messages
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving messages for conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving conversation messages")

# User management endpoints
@app.get("/api/user")
def get_user():
    """Get user information - always returns a new user"""
    try:
        # Always generate a new user ID
        user_id = "backend-user-" + str(int(time.time() * 1000))[-8:]
        
        # Mock user data - in a real implementation, this would query a database
        user_data = {
            "id": user_id,
            "name": f"User {user_id[-4:]}",
            "preferences": {
                "selectedCategory": None,
                "modelPreference": "phi4"
            },
            "source": "backend",
            "lastActive": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        logger.info(f"Generated new user: {user_id}")
        return user_data
        
    except Exception as e:
        logger.error(f"Error generating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating user")

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000) 
