import { useState, useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useUser } from "../../lib/userContext";
import { cachedFetch } from "../../lib/apiCache";

// Fallback templates when backend is unavailable
const FALLBACK_TEMPLATES = [
  {
    id: "fallback-1",
    category: "Problem Solving",
    title: "Break down this problem step by step",
    template: "Help me break down this problem into smaller, manageable steps. Provide a systematic approach to solving:",
    icon: "fas fa-puzzle-piece"
  },
  {
    id: "fallback-2",
    category: "Problem Solving", 
    title: "Analyze and solve this issue",
    template: "Please analyze this problem and provide a detailed solution with step-by-step instructions:",
    icon: "fas fa-puzzle-piece"
  },
  {
    id: "fallback-3",
    category: "Summarization",
    title: "Summarize this content",
    template: "Please provide a clear and concise summary of the following content:",
    icon: "fas fa-align-left"
  },
  {
    id: "fallback-4",
    category: "Summarization",
    title: "Extract key points",
    template: "Extract the main key points and important information from the following:",
    icon: "fas fa-align-left"
  }
];

export default function PromptDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { setSelectedCategory } = useUser();

  // Lazy fetch templates from backend with fallback
  const fetchTemplates = useCallback(async () => {
    if (hasLoadedOnce) return; // Prevent multiple loads
    
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await cachedFetch('/api/prompt-templates', {
        signal: controller.signal
      }, 10 * 60 * 1000); // Cache for 10 minutes
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTemplates(data);
      setHasLoadedOnce(true);
    } catch (err) {
      console.warn('Backend unavailable, using fallback templates:', err);
      setError('Using offline templates');
      // Use fallback templates when backend is unavailable
      setTemplates(FALLBACK_TEMPLATES);
      setHasLoadedOnce(true);
    } finally {
      setIsLoading(false);
    }
  }, [hasLoadedOnce]);

  // Lazy loading - only fetch when dropdown is first opened
  const handleDropdownOpen = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      if (!hasLoadedOnce) {
        fetchTemplates();
      }
    } else {
      setIsOpen(false);
    }
  }, [isOpen, hasLoadedOnce, fetchTemplates]);

  // Memoized grouping of templates by category for performance
  const templatesByCategory = useMemo(() => {
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {});
  }, [templates]);

  const handlePromptSelect = useCallback((template) => {
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
  }, [setSelectedCategory]);

  // Get category icon from template data or fallback
  const getCategoryIcon = (category) => {
    // Try to get icon from any template in this category
    const categoryTemplates = templatesByCategory[category] || [];
    if (categoryTemplates.length > 0 && categoryTemplates[0].icon) {
      return categoryTemplates[0].icon;
    }
    // Fallback icon
    return "fas fa-lightbulb";
  };

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={handleDropdownOpen}
        disabled={isLoading}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-background dark:border-slate-600 dark:text-foreground dark:hover:bg-slate-800"
      >
        <span className="block truncate text-left">
          {isLoading ? "Loading templates..." : 
           error && error.includes('offline') ? "Offline templates available" :
           error ? "Using fallback templates" :
           selectedPrompt ? selectedPrompt.title : 
           hasLoadedOnce ? "Select a prompt template..." : "Click to load templates"}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:bg-background dark:border-slate-600">
          <div className="p-1">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading templates...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-xs text-orange-500">{error}</p>
                {templates.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                    Showing {templates.length} fallback templates
                  </p>
                )}
                <button 
                  onClick={() => {
                    setHasLoadedOnce(false);
                    setError(null);
                    fetchTemplates();
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 mt-2 block mx-auto"
                >
                  Try Backend Again
                </button>
              </div>
            ) : Object.keys(templatesByCategory).length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">No templates available</p>
              </div>
            ) : (
              Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 flex items-center dark:text-slate-300 dark:bg-slate-800">
                    <i className={`${getCategoryIcon(category)} mr-2 text-slate-500 dark:text-slate-400`}></i>
                    {category}
                  </div>
                  
                  {/* Category Items */}
                  {categoryTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handlePromptSelect(template)}
                      className="relative flex w-full cursor-pointer select-none items-start rounded-sm px-2 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{template.title}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2 dark:text-slate-400">
                          {template.template}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Separator */}
                  <div className="h-px bg-slate-200 my-1 dark:bg-slate-600" />
                </div>
              ))
            )}
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
