import { useState } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatArea from "../components/chat/ChatArea";
import { LoadingPage } from "../components/ui/loading";
import { useUser } from "../lib/userContext";

export default function Chat() {
  const [isPromptEnhancementEnabled, setIsPromptEnhancementEnabled] = useState(true);
  const { user, isLoading } = useUser();

  // Show loading page while user is being initialized
  if (isLoading || !user) {
    return <LoadingPage />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* 1cm box at the top */}
      <div 
        className="w-full bg-muted border-b border-border"
        style={{ height: '2cm' }}
      />
      
      {/* Main chat content */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar 
          isPromptEnhancementEnabled={isPromptEnhancementEnabled}
          onTogglePromptEnhancement={setIsPromptEnhancementEnabled}
        />
        <ChatArea isPromptEnhancementEnabled={isPromptEnhancementEnabled} />
      </div>
    </div>
  );
} 