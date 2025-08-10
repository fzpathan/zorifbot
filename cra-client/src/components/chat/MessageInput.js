import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Code, Smile } from "lucide-react";

export default function MessageInput({ onSendMessage, isLoading, isPromptEnhancementEnabled, disabled = false }) {
  const [message, setMessage] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = async () => {
    if (!message.trim() || isLoading || disabled) return;
    
    if (isPromptEnhancementEnabled) {
      setIsEnhancing(true);
      // Simulate enhancement delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsEnhancing(false);
    }
    
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const codeBlock = "```\n\n```";
    const newValue = message.slice(0, start) + codeBlock + message.slice(end);
    setMessage(newValue);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 4, start + 4);
    }, 0);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [message]);

  return (
    <div className="bg-surface border-t border-slate-200 p-4">
      {/* Enhancement Indicator */}
      {isEnhancing && (
        <div className="mb-2">
          <div className="flex items-center space-x-2 text-sm text-primary bg-blue-50 p-2 rounded-lg">
            <i className="fas fa-magic animate-pulse"></i>
            <span>Enhancing your prompt for better results...</span>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={disabled ? "Backend not available. Please check your connection." : "Type your message here... (Try: 'Analyze this code for optimization')"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[52px] max-h-[120px] pr-12 resize-none"
              disabled={isLoading || isEnhancing || disabled}
            />
            
            {/* Character Count */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}/2000
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={insertCodeBlock}
                disabled={disabled}
                className="h-6 px-2 text-xs"
              >
                <Code className="h-3 w-3 mr-1" />
                Code
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-6 px-2 text-xs"
              >
                <Smile className="h-3 w-3 mr-1" />
                Emoji
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Press</span>
              <kbd className="px-2 py-1 bg-slate-100 rounded border text-xs">Shift + Enter</kbd>
              <span>for new line</span>
            </div>
          </div>
        </div>
        
        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || isEnhancing || disabled}
          className="min-w-[52px] h-[52px]"
          title={disabled ? "Backend not available" : "Send message"}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 