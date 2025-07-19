import { useQuery } from "@tanstack/react-query";
import { PromptTemplate } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import PromptSuggestion from "./PromptSuggestion";
import { customPrompts } from "@/lib/customPrompts";

interface ChatSidebarProps {
  isPromptEnhancementEnabled: boolean;
  onTogglePromptEnhancement: (enabled: boolean) => void;
}

export default function ChatSidebar({ isPromptEnhancementEnabled, onTogglePromptEnhancement }: ChatSidebarProps) {
  const { data: templates = [], isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates"],
  });

  // Merge backend and static prompts
  const allTemplates = [...templates, ...customPrompts];

  // Group templates by category
  const templatesByCategory = allTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  const getCategoryIcon = (category: string) => {
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

  return (
    <div className="w-80 bg-surface border-r border-slate-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <i className="fas fa-lightbulb text-primary mr-2"></i>
          Prompt Suggestions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Enhance your queries for better results</p>
      </div>

      {/* Prompt Categories */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="space-y-2">
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700 flex items-center">
                <i className={`${getCategoryIcon(category)} text-muted-foreground mr-2`}></i>
                {category}
              </h3>
              <div className="space-y-2">
                {categoryTemplates.map((template) => (
                  <PromptSuggestion key={template.id} template={template} />
                ))}
              </div>
            </div>
          ))
        )}
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
