import React, { useRef, useEffect, useState } from 'react';
import { useDebug } from './DebugContext';

const STORAGE_KEY = 'debugConsoleCollapsed';

const DebugComponent = () => {
  const { messages, clearMessages } = useDebug();
  const messagesEndRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'true');
    } catch {
      return true;
    }
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, collapsed]);

  const getMessageStyle = (type) => {
    switch (type) {
      case 'error': return { color: '#ff6b6b', borderLeftColor: '#ff6b6b' };
      case 'warn':  return { color: '#ffd93d', borderLeftColor: '#ffd93d' };
      case 'debug': return { color: '#6bcf7f', borderLeftColor: '#6bcf7f' };
      default:      return { color: '#00d8ff', borderLeftColor: '#00d8ff' };
    }
  };

  const toggleCollapse = () => setCollapsed(prev => !prev);

  const formatMessagesForClipboard = () => {
    return messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const content = typeof msg.message === 'object' 
        ? JSON.stringify(msg.message, null, 2)
        : msg.message;
      return `[${timestamp}] [${msg.type.toUpperCase()}] ${content}`;
    }).join('\n');
  };

  const copyToClipboard = async (e) => {
    e.stopPropagation();
    try {
      const text = formatMessagesForClipboard();
      await navigator.clipboard.writeText(
        `🐛 Debug Log (${messages.length} entries)\n${'='.repeat(50)}\n${text}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = formatMessagesForClipboard();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // No messages – show collapsed bar using app card style
  if (messages.length === 0) {
    return (
      <div className="card" style={styles.readyBar} onClick={toggleCollapse}>
        <span style={styles.readyText}>🐛 Debug Ready</span>
        <span style={styles.chevron}>{collapsed ? '▸' : '▾'}</span>
      </div>
    );
  }

  return (
    <div className="card" style={styles.container}>
      <div style={styles.header} onClick={toggleCollapse}>
        <span style={styles.headerTitle}>🐛 Debug Console ({messages.length})</span>
        <div style={styles.headerActions}>
          <button 
            onClick={copyToClipboard} 
            style={styles.copyBtn}
            title="Copy all messages to clipboard"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); clearMessages(); }} 
            style={styles.clearBtn}
          >
            Clear
          </button>
          <span style={styles.chevron}>{collapsed ? '▸' : '▾'}</span>
        </div>
      </div>

      {!collapsed && (
        <div style={styles.body}>
          {messages.map(msg => (
            <div key={msg.id} style={{ ...styles.msg, borderLeftColor: getMessageStyle(msg.type).borderLeftColor }}>
              <span style={styles.msgTimestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              {' '}
              <span style={{ color: getMessageStyle(msg.type).color, fontWeight: '500' }}>
                [{msg.type.toUpperCase()}]
              </span>
              {' '}
              <span style={styles.msgContent}>
                {typeof msg.message === 'object'
                  ? JSON.stringify(msg.message, null, 2)
                  : msg.message}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default DebugComponent;

// Styles using app design tokens
const styles = {
  readyBar: {
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    marginTop: '0', // gap handled by parent .app flex gap
  },
  readyText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.38)', // var(--muted)
  },
  container: {
    padding: '0',
    overflow: 'hidden',
    marginTop: '0', // gap handled by parent
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)', // var(--border)
    transition: 'background 0.15s',
  },
  headerTitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
    fontWeight: '500',
    color: '#e8eaf0', // var(--text)
    letterSpacing: '0.3px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  copyBtn: {
    cursor: 'pointer',
    padding: '4px 10px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.5px',
    transition: 'all 0.15s',
  },
  clearBtn: {
    cursor: 'pointer',
    padding: '4px 10px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.5px',
    transition: 'all 0.15s',
  },
  chevron: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.38)', // var(--muted)
    fontFamily: 'system-ui',
    marginLeft: '4px',
  },
  body: {
    padding: '12px 20px',
    maxHeight: '200px',
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  msg: {
    padding: '6px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    borderLeft: '3px solid',
    paddingLeft: '10px',
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    lineHeight: '1.5',
  },
  msgTimestamp: {
    color: 'rgba(255, 255, 255, 0.25)', // var(--dim)
    fontSize: '9px',
    letterSpacing: '1px',
  },
  msgContent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
};
