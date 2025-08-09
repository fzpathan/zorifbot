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
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar 
        isPromptEnhancementEnabled={isPromptEnhancementEnabled}
        onTogglePromptEnhancement={setIsPromptEnhancementEnabled}
      />
      <ChatArea isPromptEnhancementEnabled={isPromptEnhancementEnabled} />
    </div>
  );
} 