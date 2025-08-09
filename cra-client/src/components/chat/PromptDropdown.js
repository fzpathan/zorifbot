import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { customPrompts } from "../../lib/customPrompts";
import { useUser } from "../../lib/userContext";

export default function PromptDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const { setSelectedCategory } = useUser();

  // Group templates by category
  const templatesByCategory = customPrompts.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  const handlePromptSelect = (template) => {
    setSelectedPrompt(template);
    setSelectedCategory(template.category);
    setIsOpen(false);

    // Find the message input textarea and insert the full template text
    const messageInput = document.querySelector('textarea[placeholder*="Type your message"]');
    if (messageInput) {
      messageInput.value = template.template;
      messageInput.focus();
      // Trigger input event to update React state
      const event = new Event('input', { bubbles: true });
      messageInput.dispatchEvent(event);
      // Auto-resize the textarea
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
  };

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

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="block truncate text-left">
          {selectedPrompt ? selectedPrompt.title : "Select a prompt template..."}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="p-1">
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 flex items-center">
                  <i className={`${getCategoryIcon(category)} mr-2 text-slate-500`}></i>
                  {category}
                </div>
                
                {/* Category Items */}
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handlePromptSelect(template)}
                    className="relative flex w-full cursor-pointer select-none items-start rounded-sm px-2 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{template.title}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {template.template}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Separator */}
                <div className="h-px bg-slate-200 my-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
