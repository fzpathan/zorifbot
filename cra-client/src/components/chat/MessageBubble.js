import { formatDistanceToNow } from "date-fns";
import { useUser } from "../../lib/userContext";
import { Button } from "../ui/button";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

// Test message for debugging backend issues
const TEST_MESSAGE = `# Backend API Test

## Python Code Example
Here's a sample Python code to test syntax highlighting:

\`\`\`python
import requests
import json

def test_backend_api():
    """Test function to check backend connectivity"""
    api_url = "http://localhost:5000/api/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-api-key-here"
    }
    
    payload = {
        "message": "Hello, this is a test message",
        "user_id": "test_user_123"
    }
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to backend: {e}")
        return False

# Test the connection
if __name__ == "__main__":
    success = test_backend_api()
    print(f"Backend test {'PASSED' if success else 'FAILED'}")
\`\`\`

## API Response Status Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | API key doesn't have permission |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Internal Server Error | Backend server error |
| 502 | Bad Gateway | Backend service unavailable |
| 503 | Service Unavailable | Backend overloaded |

## Common Backend Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| API Key Invalid | 401 Unauthorized | Check API key in backend config |
| Backend Down | Connection refused | Start backend server |
| CORS Error | Browser console error | Configure CORS in backend |
| Database Error | 500 Internal Server Error | Check database connection |
| Rate Limiting | 429 Too Many Requests | Wait and retry |

## JavaScript Test Code

\`\`\`javascript
// Test frontend to backend communication
async function testBackendConnection() {
    const testData = {
        message: "Test message from frontend",
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer your-api-key'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        return response.ok;
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Run test
testBackendConnection().then(success => {
    console.log('Backend test result:', success ? 'SUCCESS' : 'FAILED');
});
\`\`\`

## Error Debugging Checklist

1. **Check Backend Server**
   - Is the server running on port 5000?
   - Check terminal for error messages

2. **Verify API Key**
   - Check backend configuration
   - Ensure key is properly set in environment

3. **Network Issues**
   - Test with curl or Postman
   - Check firewall settings

4. **CORS Configuration**
   - Backend should allow requests from frontend origin
   - Check CORS headers in response

---

*This test message includes tables, code blocks, and formatting to verify markdown rendering and backend connectivity.*`;

export default function MessageBubble({ message }) {
  const { user } = useUser();
  const isUser = message.sender === "user";
  const [messageCopied, setMessageCopied] = useState(false);
  const timeAgo = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "Just now";

  // Copy entire message function
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message: ', err);
    }
  };

  // For testing purposes, you can temporarily replace message.content with TEST_MESSAGE
  const displayContent = message.content === "test_backend" ? TEST_MESSAGE : message.content;

  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-robot text-white text-sm"></i>
        </div>
      )}
      <div className={`flex-1 ${isUser ? "flex justify-end" : ""}`}>
        <div className={`rounded-lg p-4 max-w-4xl relative group ${
          isUser
            ? "bg-primary text-white"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-800 dark:text-slate-200"
        }`}>
          {/* Message copy button */}
          <Button
            onClick={copyMessage}
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
            }`}
          >
            {messageCopied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </Button>
          <div className="prose prose-sm max-w-none">
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">
                {displayContent}
              </div>
            ) : (
              <MarkdownRenderer markdownContent={displayContent} />
            )}
          </div>
          {/* Enhanced prompt indicator */}
          {isUser && message.isEnhanced && (
            <div className="mt-2 pt-2 border-t border-blue-400 flex items-center text-blue-100 text-xs">
              <i className="fas fa-magic mr-1"></i>
              <span>Prompt enhanced for better results</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end mt-1">
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
          {isUser && (
            <span className="text-xs text-muted-foreground">
              {user.id}
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user text-slate-600 text-sm"></i>
        </div>
      )}
    </div>
  );
} 