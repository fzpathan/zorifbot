import { formatDistanceToNow } from "date-fns";
// TODO: Ensure react-markdown is installed: npm install react-markdown
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  isEnhanced?: boolean;
  timestamp?: string;
  originalPrompt?: string;
  enhancedPrompt?: string;
}

interface MessageBubbleProps {
  message: Message;
}

// Custom table component to wrap tables in a scrollable container
const TableWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="markdown-table-container">
    {children}
  </div>
);

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const timeAgo = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "Just now";

  // Custom components for ReactMarkdown
  const components = {
    table: ({ children }: { children: React.ReactNode }) => (
      <TableWrapper>
        <table>{children}</table>
      </TableWrapper>
    ),
  };

  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-robot text-white text-sm"></i>
        </div>
      )}
      <div className={`flex-1 ${isUser ? "flex justify-end" : ""}`}>
        <div className={`rounded-lg p-4 max-w-4xl ${
          isUser
            ? "bg-primary text-white"
            : "bg-slate-100 text-slate-800"
        }`}>
          <div className="whitespace-pre-wrap break-words">
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown components={components}>{message.content}</ReactMarkdown>
            )}
          </div>
          {/* Enhanced prompt indicator */}
          {isUser && message.isEnhanced && (
            <div className="mt-2 pt-2 border-t border-blue-400 flex items-center text-blue-100 text-xs">
              <i className="fas fa-magic mr-1"></i>
              <span>Prompt enhanced for better results</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">
          {timeAgo}
        </span>
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user text-slate-600 text-sm"></i>
        </div>
      )}
    </div>
  );
}
