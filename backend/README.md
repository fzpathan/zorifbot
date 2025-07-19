# FastAPI Backend for DeepSeek Chat

This is the FastAPI backend for the DeepSeek Chat application. It is now stateless: no user data or chat history is stored on the backend, and no database or user authentication is required.

## Features
- REST API for prompt enhancement and prompt templates
- DeepSeek AI API integration (simulated by default)
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

### 3. (Optional) Configure DeepSeek API key
If you want to use a real DeepSeek API key, set the `DEEPSEEK_API_KEY` environment variable.

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
- `POST /api/message` — Send a message and get an AI response (stateless)
- `GET /api/prompt-templates` — Get all prompt templates
- `GET /api/prompt-templates/{category}` — Get prompt templates by category
- `POST /api/enhance-prompt` — Enhance a prompt

**Note:** No chat history or user data is stored on the backend. All previous messages should be managed on the client side (e.g., in local storage).

## License
MIT 