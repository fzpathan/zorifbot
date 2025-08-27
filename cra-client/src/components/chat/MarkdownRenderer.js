import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeString);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = codeString;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback to alert for very old browsers
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="code-block-container">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="code-block-button code-block-overlay"
        title="Copy code"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      
      {/* Language Label */}
      {language && (
        <div className="code-block-language">
          {language}
        </div>
      )}
      
      {/* Code Block */}
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        className="!mt-0"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const TableWrapper = ({ children }) => {
  return (
    <div className="table-wrapper">
      <div className="table-container">
        {children}
      </div>
    </div>
  );
};

const MarkdownRenderer = ({ markdownContent }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <CodeBlock language={match[1]} {...props}>
              {children}
            </CodeBlock>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        table: ({ children }) => <TableWrapper><table>{children}</table></TableWrapper>,
      }}
    >
      {markdownContent}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
