import { useState } from 'react';
import { Button } from '../ui/button';
import { Trash2, Download, Sun, Moon, Upload } from 'lucide-react';
import UploadModal from '../upload/UploadModal';
import { useUser } from '../../lib/userContext';
import UserStatus from './UserStatus';

export default function ChatHeader({ 
  darkMode, 
  toggleDarkMode, 
  selectedModel, 
  setSelectedModel, 
  handleClearChat, 
  handleExportChat 
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user, isLoading } = useUser();

  return (
    <>
      <div className="bg-surface border-b border-slate-200 p-4 flex items-center justify-between dark:bg-background dark:border-slate-600">
        <div className="flex items-center space-x-3">
          {/* Prominent icon on the left top */}
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-2">
            <i className="fas fa-robot text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-foreground">DeepSeek Assistant</h1>
            <div className="flex items-center space-x-2">
              <UserStatus />
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                User: {isLoading ? 'Loading...' : user?.id || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Upload Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload document"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
          
          {/* Dark mode toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {/* Model selection dropdown */}
          <select
            className="border border-slate-200 bg-surface text-slate-800 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-background dark:text-foreground dark:border-slate-600"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            title="Select model"
          >
            <option value="phi4" className="bg-surface text-slate-800 dark:bg-background dark:text-foreground">Phi-4</option>
            <option value="deepseek" className="bg-surface text-slate-800 dark:bg-background dark:text-foreground">DeepSeek</option>
          </select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportChat}
            title="Export chat"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </>
  );
} 