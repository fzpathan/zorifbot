import { useState, useEffect, useCallback } from "react";
import { useUser } from "../../lib/userContext";
import { MessageSquare, Clock, Trash2 } from "lucide-react";
import { cachedFetch, invalidateCache } from "../../lib/apiCache";

export default function ChatHistory() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useUser();

  // Lazy fetch conversations from backend with error handling
  const fetchConversations = useCallback(async () => {
    if (!user?.id || hasLoadedOnce) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await cachedFetch(`/api/conversations/${user.id}`, {
        signal: controller.signal
      }, 2 * 60 * 1000); // Cache for 2 minutes
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        setHasLoadedOnce(true);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setConversations([]); // Clear conversations on error
      setHasLoadedOnce(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, hasLoadedOnce]);

  // Intersection Observer for lazy loading when component becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasLoadedOnce) {
          fetchConversations();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('chat-history-container');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [fetchConversations, hasLoadedOnce]);

  const handleConversationSelect = (conversation) => {
    // This would load the conversation into the main chat area
    // For now, we'll just log it
    console.log('Selected conversation:', conversation);
    
    // In a real implementation, you might:
    // - Load the conversation messages into the chat area
    // - Update the URL to reflect the selected conversation
    // - Clear current chat and load historical messages
  };

  const handleDeleteConversation = useCallback(async (conversationId, event) => {
    event.stopPropagation(); // Prevent triggering the select handler
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        // Invalidate conversations cache
        invalidateCache('conversations');
      } else {
        console.error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Memoized retry function
  const handleRetry = useCallback(() => {
    setError(null);
    setHasLoadedOnce(false);
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div id="chat-history-container" className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-600">
        <h3 className="text-sm font-medium text-slate-700 flex items-center dark:text-slate-300">
          <MessageSquare className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
          Previous Conversations
        </h3>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          {error ? 'Error loading' : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          {error && (
            <button
              onClick={handleRetry}
              className="text-blue-500 hover:text-blue-700 ml-2 text-xs"
            >
              Retry
            </button>
          )}
        </p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2 dark:text-slate-400">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-red-300 mx-auto mb-2" />
            <p className="text-xs text-red-500 mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="text-xs text-blue-500 hover:text-blue-700 px-3 py-1 border border-blue-200 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No previous conversations</p>
            {!hasLoadedOnce && (
              <button
                onClick={fetchConversations}
                className="text-xs text-blue-500 hover:text-blue-700 mt-2"
              >
                Load conversations
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className="group p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all dark:hover:bg-slate-800 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">
                      {conversation.title || 'Untitled Conversation'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 dark:text-slate-400">
                      {conversation.lastMessage || 'No messages'}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(conversation.updatedAt)}
                      <span className="mx-2">•</span>
                      {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all dark:text-slate-500 dark:hover:text-red-400"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with New Chat Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-600">
        <button
          onClick={() => {
            // Start a new conversation
            console.log('Starting new conversation');
          }}
          className="w-full py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          New Conversation
        </button>
      </div>
    </div>
  );
}
