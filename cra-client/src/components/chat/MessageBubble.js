import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useUser } from "../../lib/userContext";

export default function MessageBubble({ message }) {
  const { user } = useUser();
  const isUser = message.sender === "user";
  const timeAgo = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "Just now";

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
              <ReactMarkdown>{message.content}</ReactMarkdown>
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
        <div className="flex flex-col items-end mt-1">
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
          {isUser && (
            <span className="text-xs text-muted-foreground">
              {user.id}
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user text-slate-600 text-sm"></i>
        </div>
      )}
    </div>
  );
} 