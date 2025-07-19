import { PromptTemplate } from "@shared/schema";

interface PromptSuggestionProps {
  template: PromptTemplate;
}

export default function PromptSuggestion({ template }: PromptSuggestionProps) {
  const handleClick = () => {
    // Find the message input textarea and insert the full template text
    const messageInput = document.querySelector('textarea[placeholder*="Type your message"]') as HTMLTextAreaElement;
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

  return (
    <div
      onClick={handleClick}
      className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary transition-colors cursor-pointer group"
    >
      <p className="text-sm font-semibold text-slate-800 group-hover:text-primary">
        {template.title}
      </p>
      <p className="text-xs text-muted-foreground mb-1 truncate" title={template.template}>
        {template.template}
      </p>
      <span className="text-xs text-muted-foreground">Click to use</span>
    </div>
  );
}
