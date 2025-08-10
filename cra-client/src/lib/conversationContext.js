import { createContext, useContext, useState, useCallback } from 'react';

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);

  const startNewConversation = useCallback(() => {
    // Save current conversation if it has messages
    if (currentMessages.length > 0) {
      const newConversation = {
        id: `conv_${Date.now()}`,
        title: currentMessages[0]?.content?.slice(0, 50) + '...' || 'New Conversation',
        lastMessage: currentMessages[currentMessages.length - 1]?.content || '',
        messageCount: currentMessages.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [...currentMessages]
      };
      
      setConversations(prev => [newConversation, ...prev]);
    }
    
    // Clear current conversation
    setCurrentConversationId(null);
    setCurrentMessages([]);
    
    // Clear localStorage
    localStorage.removeItem('deepseek-chat-messages');
  }, [currentMessages]);

  const selectConversation = useCallback((conversationId) => {
    // If conversationId is null, clear the current conversation
    if (conversationId === null) {
      setCurrentConversationId(null);
      setCurrentMessages([]);
      localStorage.removeItem('deepseek-chat-messages');
      return;
    }
    
    // Save current conversation if it has messages and we're not already in a conversation
    if (currentMessages.length > 0 && !currentConversationId) {
      const newConversation = {
        id: `conv_${Date.now()}`,
        title: currentMessages[0]?.content?.slice(0, 50) + '...' || 'New Conversation',
        lastMessage: currentMessages[currentMessages.length - 1]?.content || '',
        messageCount: currentMessages.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [...currentMessages]
      };
      
      setConversations(prev => [newConversation, ...prev]);
    }
    
    // Find and load the selected conversation
    const selectedConversation = conversations.find(conv => conv.id === conversationId);
    if (selectedConversation) {
      setCurrentConversationId(conversationId);
      setCurrentMessages(selectedConversation.messages || []);
      
      // Save to localStorage
      localStorage.setItem('deepseek-chat-messages', JSON.stringify(selectedConversation.messages || []));
    }
  }, [currentMessages, currentConversationId, conversations]);

  const updateConversations = useCallback((newConversations) => {
    setConversations(newConversations);
  }, []);

  const updateCurrentMessages = useCallback((messages) => {
    setCurrentMessages(messages);
    
    // Update the current conversation in the conversations list
    if (currentConversationId) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? {
                ...conv,
                messages: messages,
                lastMessage: messages[messages.length - 1]?.content || '',
                messageCount: messages.length,
                updatedAt: new Date().toISOString()
              }
            : conv
        )
      );
    }
  }, [currentConversationId]);

  const value = {
    currentConversationId,
    conversations,
    currentMessages,
    startNewConversation,
    selectConversation,
    updateConversations,
    updateCurrentMessages,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
