import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "../../hooks/use-toast";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import { useUser } from "../../lib/userContext";
import { useConversation } from "../../lib/conversationContext";

const LOCAL_STORAGE_KEY = "deepseek-chat-messages";

function loadMessages() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveMessages(messages) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
}

// API request helper function
async function apiRequest(method, endpoint, data = null) {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  // Add timeout to the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond');
    }
    throw error;
  }
}

export default function ChatArea({ isPromptEnhancementEnabled }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("phi4"); // default model
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("deepseek-dark-mode") === "true";
    }
    return false;
  });
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const { user, initializeUser, isBackendAvailable } = useUser();
  const { currentMessages, updateCurrentMessages } = useConversation();

  // Effect to add/remove 'dark' class on <html>
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("deepseek-dark-mode", darkMode ? "true" : "false");
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  // Load messages from localStorage on initial load
  useEffect(() => {
    const savedMessages = loadMessages();
    if (savedMessages.length > 0) {
      updateCurrentMessages(savedMessages);
    }
  }, [updateCurrentMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(currentMessages);
  }, [currentMessages]);

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    setIsLoading(true);
    const userMsg = {
      id: `${Date.now()}-user`,
      content: content.trim(),
      sender: "user",
      isEnhanced: isPromptEnhancementEnabled,
      timestamp: new Date().toISOString(),
      originalPrompt: isPromptEnhancementEnabled ? content.trim() : undefined,
    };
    updateCurrentMessages((prev) => [...prev, userMsg]);
    try {
      // Send the last 10 messages as history for context
      const history = [...currentMessages, userMsg].slice(-10).map(({ id, content, sender }) => ({ id, content, sender }));
      
      // Prepare API payload with user ID and selected category
      const apiPayload = {
        content: content.trim(),
        is_enhanced: isPromptEnhancementEnabled,
        history, // include history in the payload
        model: selectedModel, // include selected model
        user_id: user?.id, // include user ID (can be undefined, backend will generate)
        selected_category: user?.preferences?.selectedCategory, // include selected category (single)
      };
      
      const response = await apiRequest("POST", "/api/message", apiPayload);
      
      // Stream the response
      let aiMsgContent = "";
      let receivedUserId = null;
      const aiMsg = {
        id: `${Date.now()}-ai`,
        content: "",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      updateCurrentMessages((prev) => [...prev, aiMsg]);
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let done = false;
        let isFirstChunk = true;
        
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            
            // Handle first chunk that might contain USER_ID
            if (isFirstChunk && chunk.startsWith('USER_ID:')) {
              const lines = chunk.split('\n');
              const userIdLine = lines[0];
              receivedUserId = userIdLine.replace('USER_ID:', '').trim();
              
              // Save user ID to localStorage if we received one from backend
              if (receivedUserId && !user?.id) {
                localStorage.setItem('user-id', receivedUserId);
                console.log('✅ Received user ID from backend:', receivedUserId);
                // Re-initialize user context with the new user ID
                setTimeout(() => initializeUser(), 100);
              }
              
              // Remove the USER_ID line from content
              aiMsgContent = lines.slice(1).join('\n');
              isFirstChunk = false;
            } else {
              aiMsgContent += chunk;
            }
            
            // Capture the current value of aiMsgContent to avoid closure issues
            const currentContent = aiMsgContent;
            updateCurrentMessages((prev) => {
              // Update the last AI message with the streamed content
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.sender === "ai") {
                updated[lastIdx] = { ...updated[lastIdx], content: currentContent };
              }
              return updated;
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    updateCurrentMessages([]);
    saveMessages([]);
    toast({
      title: "Success",
      description: "Chat history cleared successfully.",
    });
  };

  const handleExportChat = () => {
    const chatData = {
      messages: currentMessages,
      exportedAt: new Date().toISOString(),
      user_id: user?.id || localStorage.getItem('user-id') || 'unknown',
    };
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Chat exported successfully.",
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isLoading]);

  // Additional scroll effect for streaming updates
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <ChatHeader
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        handleClearChat={handleClearChat}
        handleExportChat={handleExportChat}
      />
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Backend Connection Error */}
        {!isBackendAvailable && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl">
                <p className="text-red-800 font-medium">Backend Connection Error</p>
                <p className="text-red-700 text-sm mt-1">
                  Unable to connect to the backend server. Please check your connection and try again.
                </p>
                <button 
                  onClick={initializeUser}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Welcome Message */}
        {currentMessages.length === 0 && isBackendAvailable && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="bg-slate-100 rounded-lg p-4 max-w-2xl">
                                 <p className="text-slate-800">
                   Hello! I'm your ZorifBot AI assistant powered by Phi-4. I'm here to help you with coding, problem-solving, documentation, and more. Try using the prompt suggestions on the left to get started, or ask me anything directly!
                 </p>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">Just now</span>
            </div>
          </div>
        )}
        {/* Messages */}
        {currentMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {/* Loading Message */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="bg-slate-100 rounded-lg p-4 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                                     <span className="text-muted-foreground text-sm">ZorifBot is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isPromptEnhancementEnabled={isPromptEnhancementEnabled}
        disabled={!isBackendAvailable}
      />
    </div>
  );
} 