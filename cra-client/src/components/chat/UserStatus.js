import { useUser } from "../../lib/userContext";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function UserStatus() {
  const { user, isLoading, retryBackendConnection } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Connecting...
      </div>
    );
  }

  const isOnline = user?.source !== 'fallback';

  return (
    <div className="flex items-center text-xs">
      <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
      <span className="text-muted-foreground">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 inline mr-1" />
            Backend Connected
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 inline mr-1" />
            Offline Mode
            <button
              onClick={retryBackendConnection}
              className="ml-2 text-blue-500 hover:text-blue-700 underline"
              title="Retry backend connection"
            >
              Retry
            </button>
          </>
        )}
      </span>
    </div>
  );
}
