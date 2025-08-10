import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useUser } from "../../lib/userContext";
import { Button } from "../ui/button";
import { useState } from "react";

// Simple emoji mapping for common emojis
const emojiMap = {
  ':smile:': '😊',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':fire:': '🔥',
  ':rocket:': '🚀',
  ':star:': '⭐',
  ':check:': '✅',
  ':x:': '❌',
  ':warning:': '⚠️',
  ':info:': 'ℹ️',
  ':question:': '❓',
  ':exclamation:': '❗',
  ':clap:': '👏',
  ':pray:': '🙏',
  ':eyes:': '👀',
  ':sunglasses:': '😎',
  ':laugh:': '😂',
  ':cry:': '😢',
  ':angry:': '😠',
};

// Function to replace emoji codes with actual emojis
function replaceEmojis(text) {
  let result = text;
  Object.entries(emojiMap).forEach(([code, emoji]) => {
    result = result.replace(new RegExp(code, 'g'), emoji);
  });
  return result;
}

// Code block component with copy button
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const code = children?.props?.children || children;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="relative group">
      {/* Copy button */}
      <Button
        onClick={copyToClipboard}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800/50 dark:bg-slate-700/50 hover:bg-slate-700/50 dark:hover:bg-slate-600/50 text-white border border-slate-600 dark:border-slate-500"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </Button>
      
      {/* Code block */}
      <pre className={`${className} bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto border border-slate-700 dark:border-slate-600`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Inline code component
function InlineCode({ children }) {
  const [copied, setCopied] = useState(false);
  const code = children;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <span className="relative group inline-block">
      <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
      <Button
        onClick={copyToClipboard}
        variant="ghost"
        size="sm"
        className="absolute -top-6 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 dark:bg-slate-700 text-white text-xs p-1 h-6 w-6 border border-slate-600 dark:border-slate-500"
      >
        {copied ? (
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </Button>
    </span>
  );
}

export default function MessageBubble({ message }) {
  const { user } = useUser();
  const isUser = message.sender === "user";
  const [messageCopied, setMessageCopied] = useState(false);
  const timeAgo = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "Just now";

  // Copy entire message function
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message: ', err);
    }
  };

  // Custom components for ReactMarkdown
  const components = {
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
      ) : (
        <InlineCode {...props}>{children}</InlineCode>
      );
    },
    pre: ({ children }) => <>{children}</>,
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-slate-700 dark:text-slate-300">{children}</li>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-600 dark:text-slate-400 mb-3">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-3">
        <table className="min-w-full border border-slate-300 rounded-lg">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-slate-700 dark:text-slate-300">
        {children}
      </td>
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
        <div className={`rounded-lg p-4 max-w-4xl relative group ${
          isUser
            ? "bg-primary text-white"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-800 dark:text-slate-200"
        }`}>
          {/* Message copy button */}
          <Button
            onClick={copyMessage}
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
            }`}
          >
            {messageCopied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </Button>
          <div className="prose prose-sm max-w-none">
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            ) : (
              <ReactMarkdown components={components}>
                {replaceEmojis(message.content)}
              </ReactMarkdown>
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