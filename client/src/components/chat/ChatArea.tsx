import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  isEnhanced?: boolean;
  timestamp?: string;
  originalPrompt?: string;
  enhancedPrompt?: string;
}

interface ChatAreaProps {
  isPromptEnhancementEnabled: boolean;
}

const LOCAL_STORAGE_KEY = "deepseek-chat-messages";

function loadMessages(): Message[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveMessages(messages: Message[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
}

export default function ChatArea({ isPromptEnhancementEnabled }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>(loadMessages());
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    const userMsg: Message = {
      id: `${Date.now()}-user`,
      content: content.trim(),
      sender: "user",
      isEnhanced: isPromptEnhancementEnabled,
      timestamp: new Date().toISOString(),
      originalPrompt: isPromptEnhancementEnabled ? content.trim() : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const response = await apiRequest("POST", "/api/message", {
        content: content.trim(),
        is_enhanced: isPromptEnhancementEnabled,
      });
      const data = await response.json();
      const aiMsg: Message = {
        id: `${Date.now()}-ai`,
        content: data.aiMessage,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
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
    setMessages([]);
    saveMessages([]);
    toast({
      title: "Success",
      description: "Chat history cleared successfully.",
    });
  };

  const handleExportChat = () => {
    const chatData = {
      messages,
      exportedAt: new Date().toISOString(),
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
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-surface border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">DeepSeek Assistant</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportChat}
            title="Export chat"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="bg-slate-100 rounded-lg p-4 max-w-2xl">
                <p className="text-slate-800">
                  Hello! I'm your DeepSeek AI assistant. I'm here to help you with coding, problem-solving, documentation, and more. Try using the prompt suggestions on the left to get started, or ask me anything directly!
                </p>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">Just now</span>
            </div>
          </div>
        )}
        {/* Messages */}
        {messages.map((message) => (
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
                  <span className="text-muted-foreground text-sm">DeepSeek is thinking...</span>
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
      />
    </div>
  );
}
