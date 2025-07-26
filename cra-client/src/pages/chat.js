import { useState } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatArea from "../components/chat/ChatArea";

export default function Chat() {
  const [isPromptEnhancementEnabled, setIsPromptEnhancementEnabled] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar 
        isPromptEnhancementEnabled={isPromptEnhancementEnabled}
        onTogglePromptEnhancement={setIsPromptEnhancementEnabled}
      />
      <ChatArea isPromptEnhancementEnabled={isPromptEnhancementEnabled} />
    </div>
  );
} 