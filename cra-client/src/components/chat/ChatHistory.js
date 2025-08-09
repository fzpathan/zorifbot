import { useState, useEffect } from "react";
import { useUser } from "../../lib/userContext";
import { MessageSquare, Clock, Trash2 } from "lucide-react";

export default function ChatHistory() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // Fetch conversations from backend
  const fetchConversations = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user?.id]);

  const handleConversationSelect = (conversation) => {
    // This would load the conversation into the main chat area
    // For now, we'll just log it
    console.log('Selected conversation:', conversation);
    
    // In a real implementation, you might:
    // - Load the conversation messages into the chat area
    // - Update the URL to reflect the selected conversation
    // - Clear current chat and load historical messages
  };

  const handleDeleteConversation = async (conversationId, event) => {
    event.stopPropagation(); // Prevent triggering the select handler
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString) => {
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
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-slate-500" />
          Previous Conversations
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No previous conversations</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className="group p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800 truncate">
                      {conversation.title || 'Untitled Conversation'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {conversation.lastMessage || 'No messages'}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(conversation.updatedAt)}
                      <span className="mx-2">•</span>
                      {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
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
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={() => {
            // Start a new conversation
            console.log('Starting new conversation');
          }}
          className="w-full py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Conversation
        </button>
      </div>
    </div>
  );
}
