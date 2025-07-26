import { Switch } from "../ui/switch";
import PromptSuggestion from "./PromptSuggestion";
import { customPrompts } from "../../lib/customPrompts";
import { useUser } from "../../lib/userContext";
import { X } from "lucide-react";

export default function ChatSidebar({ isPromptEnhancementEnabled, onTogglePromptEnhancement }) {
  const { user, setSelectedCategory, removeSelectedCategory } = useUser();
  
  // Only use static customPrompts
  const allTemplates = [...customPrompts];

  // Group templates by category
  const templatesByCategory = allTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Code Analysis":
        return "fas fa-code";
      case "Problem Solving":
        return "fas fa-puzzle-piece";
      case "Documentation":
        return "fas fa-file-alt";
      case "Productivity":
        return "fas fa-align-left";
      case "Learning":
        return "fas fa-graduation-cap";
      default:
        return "fas fa-lightbulb";
    }
  };

  const handlePromptSelect = (template) => {
    // Set the category when user selects a prompt
    setSelectedCategory(template.category);
  };

  return (
    <div className="w-80 bg-surface border-r border-slate-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <i className="fas fa-lightbulb text-primary mr-2"></i>
          Prompt Suggestions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Enhance your queries for better results</p>
        
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

      {/* Prompt Categories */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700 flex items-center">
              <i className={`${getCategoryIcon(category)} text-muted-foreground mr-2`}></i>
              {category}
            </h3>
            <div className="space-y-2">
              {categoryTemplates.map((template) => (
                <PromptSuggestion 
                  key={template.id} 
                  template={template}
                  onSelect={() => handlePromptSelect(template)}
                />
              ))}
            </div>
          </div>
        ))}
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