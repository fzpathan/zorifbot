import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { UserProvider } from './lib/userContext';
import { ConversationProvider } from './lib/conversationContext';
import { Switch, Route } from 'wouter';
import NotFound from './pages/not-found';
import Chat from './pages/chat';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <UserProvider>
      <ConversationProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ConversationProvider>
    </UserProvider>
  );
}

export default App;
