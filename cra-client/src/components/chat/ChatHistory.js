import { useEffect, useCallback } from "react";
import { useConversation } from "../../lib/conversationContext";
import { MessageSquare, Clock, Trash2 } from "lucide-react";

export default function ChatHistory() {
  const { 
    conversations, 
    currentConversationId,
    selectConversation, 
    startNewConversation, 
    updateConversations 
  } = useConversation();

  // Load conversations from localStorage on component mount
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('chat-conversations');
      if (savedConversations) {
        const parsedConversations = JSON.parse(savedConversations);
        updateConversations(parsedConversations);
      }
    } catch (err) {
      console.warn('Error loading conversations from localStorage:', err);
    }
  }, [updateConversations]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chat-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const handleConversationSelect = (conversation) => {
    selectConversation(conversation.id);
    console.log('Selected conversation:', conversation);
  };

  const handleDeleteConversation = useCallback((conversationId, event) => {
    event.stopPropagation(); // Prevent triggering the select handler
    
    // Remove conversation from the list
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    updateConversations(updatedConversations);
    
    // If the deleted conversation was the current one, clear the current conversation
    if (currentConversationId === conversationId) {
      selectConversation(null);
    }
  }, [conversations, currentConversationId, updateConversations, selectConversation]);

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

  return (
    <div id="chat-history-container" className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-600">
        <h3 className="text-sm font-medium text-slate-700 flex items-center dark:text-slate-300">
          <MessageSquare className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
          Previous Conversations
        </h3>
                 <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
           {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
         </p>
      </div>

             {/* Conversations List */}
       <div className="flex-1 overflow-y-auto">
         {conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                         <p className="text-xs text-slate-500 dark:text-slate-400">No previous conversations</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
                             <div
                 key={conversation.id}
                 onClick={() => handleConversationSelect(conversation)}
                 className={`group p-3 rounded-lg cursor-pointer border transition-all ${
                   currentConversationId === conversation.id
                     ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' 
                     : 'hover:bg-slate-50 border-transparent hover:border-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600'
                 }`}
               >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                                         <h4 className={`text-sm font-medium truncate ${
                       currentConversationId === conversation.id
                         ? 'text-blue-800 dark:text-blue-300' 
                         : 'text-slate-800 dark:text-slate-200'
                     }`}>
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
          onClick={startNewConversation}
          className="w-full py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          New Conversation
        </button>
      </div>
    </div>
  );
}
