# FastAPI Backend for DeepSeek Chat

This is the FastAPI backend for the DeepSeek Chat application. It is now stateless: no user data or chat history is stored on the backend, and no database or user authentication is required.

## Features
- REST API for prompt enhancement and prompt templates
- **Model selection:** Supports multiple AI models (DeepSeek, Phi-4) via a model selection dropdown in the frontend
- **Streaming responses:** Uses FastAPI's StreamingResponse to stream AI responses to the frontend for better UX
- **External AI API integration:** Uses `httpx` for async HTTP calls to external AI APIs (DeepSeek, Phi-4)
- CORS enabled for frontend development

## Requirements
- Python 3.9+
- pip (Python package manager)

## Setup Instructions

### 1. Clone the repository (if not already)

### 2. Install dependencies
```sh
cd backend
pip install -r requirements.txt
```

### 3. Configure API Keys
Set the following environment variables for your external AI providers:
- `DEEPSEEK_API_KEY` — Your DeepSeek API key
- `PHI4_API_KEY` — Your Phi-4 API key

You can set these in your shell or in a `.env` file (if using a tool like `python-dotenv`).

### 4. Run the backend server
```sh
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```
- The API will be available at [http://localhost:5000](http://localhost:5000)

### 5. Run the frontend (in a separate terminal)
```sh
npm run dev
```
- The frontend will connect to the backend API at the same port.

## API Endpoints
- `POST /api/message` — Send a message and get an AI response (stateless, supports model selection and streaming)
  - **Request body:**
    - `content` (str): The user's message
    - `is_enhanced` (bool): Whether to enhance the prompt
    - `history` (list): Previous messages for context
    - `model` (str): Model to use ("phi4" or "deepseek")
  - **Response:** Streams the AI's response as plain text
- `GET /api/prompt-templates` — Get all prompt templates
- `GET /api/prompt-templates/{category}` — Get prompt templates by category
- `POST /api/enhance-prompt` — Enhance a prompt

**Note:** No chat history or user data is stored on the backend. All previous messages are managed on the client side (e.g., in local storage).

## How Model Selection Works
- The frontend provides a dropdown for users to select the AI model ("phi4" or "deepseek").
- The backend uses the `model` field in the request to route the prompt to the correct external API using `httpx`.
- The response is streamed back to the frontend for real-time display.

## How Streaming Works
- The backend uses FastAPI's `StreamingResponse` to send the AI's reply in chunks, improving user experience.
- If your external AI API supports streaming, you can further optimize the backend to relay the stream directly.

## License
MIT 