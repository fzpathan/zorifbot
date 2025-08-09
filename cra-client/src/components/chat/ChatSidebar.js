import { Switch } from "../ui/switch";
import PromptDropdown from "./PromptDropdown";
import ChatHistory from "./ChatHistory";
import { useUser } from "../../lib/userContext";
import { X } from "lucide-react";

export default function ChatSidebar({ isPromptEnhancementEnabled, onTogglePromptEnhancement }) {
  const { user, removeSelectedCategory } = useUser();

  return (
    <div className="w-80 bg-surface border-r border-slate-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <i className="fas fa-comments text-primary mr-2"></i>
          Chat Assistant
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Templates and conversation history</p>
        
        {/* Selected Category Display */}
        {user.preferences.selectedCategory && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800 mb-1">Selected Category:</p>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {user.preferences.selectedCategory}
                </span>
              </div>
              <button
                onClick={removeSelectedCategory}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Remove category"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Prompt Templates Dropdown */}
        <div className="p-4 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <i className="fas fa-lightbulb text-slate-500 mr-2"></i>
            Prompt Templates
          </label>
          <PromptDropdown />
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-hidden">
          <ChatHistory />
        </div>
      </div>

      {/* Prompt Enhancement Toggle */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-slate-700">Auto-enhance prompts</h4>
            <p className="text-xs text-muted-foreground">Automatically improve your queries</p>
          </div>
          <Switch
            checked={isPromptEnhancementEnabled}
            onCheckedChange={onTogglePromptEnhancement}
          />
        </div>
      </div>
    </div>
  );
} 