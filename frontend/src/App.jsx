import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Sleek, Minimalist SVG Icons (ChatGPT/Gemini Style)
const ChatIcon = ({ size = 18, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const DocumentIcon = ({ size = 18, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const PlusIcon = ({ size = 16, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = ({ size = 16, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

const SettingsIcon = ({ size = 16, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SparkleIcon = ({ size = 20, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" />
  </svg>
);

const UserIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = ({ size = 14, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const WarningIcon = ({ size = 20, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SuccessIcon = ({ size = 20, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ErrorIcon = ({ size = 20, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const InfoIcon = ({ size = 20, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ChevronLeftIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SpinnerIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`spinner-icon ${className}`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

const PinIcon = ({ size = 14, className = "", style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.48A2 2 0 0 1 15 9.28V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4.28a2 2 0 0 1-.78 1.24l-2.78 3.48A2 2 0 0 0 5 15.24V17z" />
  </svg>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ online: false, chatModel: '-', embeddingModel: '-', apiEndpoint: '-' });
  const [documents, setDocuments] = useState([]);
  const [showDocs, setShowDocs] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' veya 'docs'
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [showMentionsMenu, setShowMentionsMenu] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedFile, setMentionedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const BACKEND_URL = 'http://localhost:8000';

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch status and data on component load
  useEffect(() => {
    fetchSystemStatus();
    fetchDocuments();
    fetchSessions();
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load messages when current session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus({
          online: true,
          chatModel: data.chat_model,
          embeddingModel: data.embedding_model,
          apiEndpoint: data.api_endpoint || 'http://localhost:8501 (Local)'
        });
      } else {
        setStatus(prev => ({ ...prev, online: false }));
      }
    } catch (err) {
      console.error("Error fetching system status:", err);
      setStatus(prev => ({ ...prev, online: false }));
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching indexed documents:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !currentSessionId) {
          // Varsayılan olarak en son sohbeti seç
          setCurrentSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map(m => ({
          role: m.role,
          content: m.content,
          context: m.context,
          score: m.score,
          fileName: m.file_name
        })));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        showNotification("Document uploaded and indexed successfully!", "success");
        fetchDocuments();
      } else {
        const err = await res.json();
        showNotification(`Error: ${err.detail || 'Failed to upload file.'}`, "error");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      showNotification("Could not connect to the server.", "error");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation(); // Prevent trigger session selection on click
    setDeleteTarget({ type: 'session', id: sessionId });
  };

  const handleDeleteDocument = (e, filename) => {
    e.stopPropagation();
    setDeleteTarget({ type: 'document', filename });
  };

  const handleTogglePinSession = async (e, sessionId, isPinned) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinned })
      });
      if (res.ok) {
        showNotification(isPinned ? "Chat unpinned." : "Chat pinned to the top.", "success");
        fetchSessions();
      } else {
        showNotification("Failed to toggle pin.", "error");
      }
    } catch (err) {
      console.error("Error toggling pin:", err);
      showNotification("Could not connect to the server.", "error");
    }
  };

  const handleTogglePinDocument = async (e, filename, isPinned) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${BACKEND_URL}/api/documents/${encodeURIComponent(filename)}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinned })
      });
      if (res.ok) {
        showNotification(isPinned ? "Document unpinned." : "Document pinned to the top.", "success");
        fetchDocuments();
      } else {
        showNotification("Failed to toggle pin.", "error");
      }
    } catch (err) {
      console.error("Error toggling pin:", err);
      showNotification("Could not connect to the server.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'session') {
      const sessionId = deleteTarget.id;
      try {
        const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showNotification("Chat history deleted successfully.", "success");
          
          // Remove the session from UI state
          setSessions(prev => prev.filter(s => s.id !== sessionId));

          if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setMessages([]);
            
            // If there are other sessions, automatically select the next latest one
            const remaining = sessions.filter(s => s.id !== sessionId);
            if (remaining.length > 0) {
              setCurrentSessionId(remaining[0].id);
            }
          }
        } else {
          showNotification("An error occurred while deleting chat history.", "error");
        }
      } catch (err) {
        console.error("Error deleting session:", err);
        showNotification("Could not connect to the server.", "error");
      }
    } else if (deleteTarget.type === 'document') {
      const filename = deleteTarget.filename;
      try {
        const res = await fetch(`${BACKEND_URL}/api/documents/${encodeURIComponent(filename)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showNotification("Document and database indices deleted successfully.", "success");
          fetchDocuments();
        } else {
          const err = await res.json();
          showNotification(`Error: ${err.detail || 'Failed to delete document.'}`, "error");
        }
      } catch (err) {
        console.error("Error deleting document:", err);
        showNotification("Could not connect to the server.", "error");
      }
    }

    setDeleteTarget(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // 1. Eğer aktif sohbet yoksa yeni bir session (oturum) ID'si oluşturuyoruz
    let sessionId = currentSessionId;
    let isNewSession = false;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      isNewSession = true;
      
      const tempTitle = input.length > 30 ? input.substring(0, 30) + "..." : input;
      // Backend'de session'ı oluştur
      await fetch(`${BACKEND_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, title: tempTitle })
      });
      setCurrentSessionId(sessionId);
    }

    const userMessage = { 
      role: 'user', 
      content: input,
      fileName: mentionedFile ? mentionedFile : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setMentionedFile(null);
    setLoading(true);

    // Kullanıcı mesajını veritabanına kaydet
    await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: userMessage.content,
        file_name: userMessage.fileName
      })
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMessage.content,
          target_file: userMessage.fileName
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMessage = {
          role: 'assistant',
          content: data.answer,
          context: data.context,
          score: data.score,
          fileName: data.file_name
        };
        setMessages(prev => [...prev, botMessage]);

        // Asistan mesajını veritabanına kaydet
        await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: botMessage.content,
            context: botMessage.context,
            score: botMessage.score,
            file_name: botMessage.fileName
          })
        });

      } else {
        const errorData = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${errorData.detail || 'Something went wrong.'}`
        }]);
      }
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not communicate with the server. Please make sure the FastAPI backend server is running.'
      }]);
    } finally {
      setLoading(false);
      // Başlıkları ve seans listesini güncelle
      fetchSessions();
      fetchDocuments();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <div className={`sidebar glass-panel ${showDocs ? 'open' : 'closed'}`}>
        {/* Tab Seçiciler */}
        <div className="sidebar-tabs">
          <button 
            className={`tab-btn ${sidebarTab === 'chats' ? 'active' : ''}`} 
            onClick={() => setSidebarTab('chats')}
          >
            <ChatIcon size={15} style={{ marginRight: '6px' }} /> Chats
          </button>
          <button 
            className={`tab-btn ${sidebarTab === 'docs' ? 'active' : ''}`} 
            onClick={() => setSidebarTab('docs')}
          >
            <DocumentIcon size={15} style={{ marginRight: '6px' }} /> Documents
          </button>
          <button className="sidebar-toggle" onClick={() => setShowDocs(!showDocs)}>
            {showDocs ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
          </button>
        </div>

        {/* Search Bar */}
        {showDocs && (
          <div className="sidebar-search-container">
            <div className="sidebar-search-wrapper">
              <SearchIcon size={14} className="search-input-icon" />
              <input
                type="text"
                placeholder={sidebarTab === 'chats' ? "Search chats..." : "Search documents..."}
                value={sidebarTab === 'chats' ? chatSearchQuery : docSearchQuery}
                onChange={(e) => {
                  if (sidebarTab === 'chats') {
                    setChatSearchQuery(e.target.value);
                  } else {
                    setDocSearchQuery(e.target.value);
                  }
                }}
                className="sidebar-search-input"
              />
            </div>
          </div>
        )}

        {/* Yeni Sohbet Butonu */}
        {sidebarTab === 'chats' && (
          <button className="new-chat-btn" onClick={handleNewChat}>
            <PlusIcon size={14} style={{ marginRight: '6px' }} /> Start New Chat
          </button>
        )}

        {/* Belge Ekleme Butonu */}
        {sidebarTab === 'docs' && (
          <div className="upload-section">
            <label className={`upload-btn ${uploading ? 'disabled' : ''}`}>
              {uploading ? (
                <>
                  <SpinnerIcon size={14} style={{ marginRight: '6px' }} /> Indexing...
                </>
              ) : (
                <>
                  <PlusIcon size={14} style={{ marginRight: '6px' }} /> Add Document (PDF, Word, ...)
                </>
              )}
              <input 
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleUploadFile} 
                disabled={uploading}
                accept=".txt,.md,.pdf,.docx,.pptx,.xlsx,.csv,.json,.html,.htm"
              />
            </label>
          </div>
        )}

        <div className="docs-list">
          {sidebarTab === 'chats' ? (
            /* Chat Geçmişi Listesi */
            sessions.filter(s => s.title.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 ? (
              <p className="no-docs">No matching chats found.</p>
            ) : (
              <>
                {/* Pinned Chats Section */}
                {sessions.filter(s => s.is_pinned && s.title.toLowerCase().includes(chatSearchQuery.toLowerCase())).length > 0 && (
                  <div className="list-section-wrapper">
                    <div className="list-section-header">
                      <PinIcon size={12} style={{ marginRight: '5px', fill: '#f59e0b', color: '#f59e0b' }} />
                      Pinned Chats
                    </div>
                    {sessions
                      .filter(s => s.is_pinned && s.title.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                      .map(session => (
                        <div 
                          key={session.id} 
                          className={`session-item ${currentSessionId === session.id ? 'active' : ''} pinned`}
                          onClick={() => setCurrentSessionId(session.id)}
                        >
                          <span className="session-icon"><ChatIcon size={16} /></span>
                          <div className="session-info">
                            <p className="session-title">{session.title}</p>
                          </div>
                          <div className="session-actions-wrapper">
                            <button 
                              className="pin-session-btn active" 
                              onClick={(e) => handleTogglePinSession(e, session.id, session.is_pinned)}
                              title="Unpin chat"
                            >
                              <PinIcon size={13} style={{ fill: 'currentColor' }} />
                            </button>
                            <button className="delete-session-btn" onClick={(e) => handleDeleteSession(e, session.id)} title="Delete chat">
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Recent Chats Section */}
                <div className="list-section-wrapper">
                  {sessions.filter(s => s.is_pinned && s.title.toLowerCase().includes(chatSearchQuery.toLowerCase())).length > 0 && (
                    <div className="list-section-header">Recent Chats</div>
                  )}
                  {sessions
                    .filter(s => !s.is_pinned && s.title.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                    .map(session => (
                      <div 
                        key={session.id} 
                        className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                        onClick={() => setCurrentSessionId(session.id)}
                      >
                        <span className="session-icon"><ChatIcon size={16} /></span>
                        <div className="session-info">
                          <p className="session-title">{session.title}</p>
                        </div>
                        <div className="session-actions-wrapper">
                          <button 
                            className="pin-session-btn" 
                            onClick={(e) => handleTogglePinSession(e, session.id, session.is_pinned)}
                            title="Pin chat"
                          >
                            <PinIcon size={13} />
                          </button>
                          <button className="delete-session-btn" onClick={(e) => handleDeleteSession(e, session.id)} title="Delete chat">
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {sessions.filter(s => !s.is_pinned && s.title.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 && 
                   sessions.filter(s => s.is_pinned && s.title.toLowerCase().includes(chatSearchQuery.toLowerCase())).length > 0 && (
                    <p className="no-docs" style={{ margin: '10px 0', fontSize: '0.8rem' }}>No other chats.</p>
                  )}
                </div>
              </>
            )
          ) : (
            /* Döküman Listesi */
            documents.filter(d => d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase())).length === 0 ? (
              <p className="no-docs">No matching documents found.</p>
            ) : (
              <>
                {/* Pinned Documents Section */}
                {documents.filter(d => d.is_pinned && d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase())).length > 0 && (
                  <div className="list-section-wrapper">
                    <div className="list-section-header">
                      <PinIcon size={12} style={{ marginRight: '5px', fill: '#f59e0b', color: '#f59e0b' }} />
                      Pinned Documents
                    </div>
                    {documents
                      .filter(d => d.is_pinned && d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase()))
                      .map((doc, idx) => (
                        <div key={idx} className="doc-item flex-row pinned">
                          <span className="doc-icon"><DocumentIcon size={18} /></span>
                          <div className="doc-info">
                            <p className="doc-name">{doc.file_name}</p>
                            <span className="doc-chunks">{doc.chunks_count} chunks</span>
                          </div>
                          <div className="doc-actions-wrapper">
                            <button 
                              className="pin-doc-btn active" 
                              onClick={(e) => handleTogglePinDocument(e, doc.file_name, doc.is_pinned)}
                              title="Unpin document"
                            >
                              <PinIcon size={13} style={{ fill: 'currentColor' }} />
                            </button>
                            <button className="delete-doc-btn" onClick={(e) => handleDeleteDocument(e, doc.file_name)} title="Delete document">
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* All Documents Section */}
                <div className="list-section-wrapper">
                  {documents.filter(d => d.is_pinned && d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase())).length > 0 && (
                    <div className="list-section-header">Other Documents</div>
                  )}
                  {documents
                    .filter(d => !d.is_pinned && d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase()))
                    .map((doc, idx) => (
                      <div key={idx} className="doc-item flex-row">
                        <span className="doc-icon"><DocumentIcon size={18} /></span>
                        <div className="doc-info">
                          <p className="doc-name">{doc.file_name}</p>
                          <span className="doc-chunks">{doc.chunks_count} chunks</span>
                        </div>
                        <div className="doc-actions-wrapper">
                          <button 
                            className="pin-doc-btn" 
                            onClick={(e) => handleTogglePinDocument(e, doc.file_name, doc.is_pinned)}
                            title="Pin document"
                          >
                            <PinIcon size={13} />
                          </button>
                          <button className="delete-doc-btn" onClick={(e) => handleDeleteDocument(e, doc.file_name)} title="Delete document">
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {documents.filter(d => !d.is_pinned && d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase())).length === 0 && 
                   documents.filter(d => d.is_pinned && d.file_name.toLowerCase().includes(docSearchQuery.toLowerCase())).length > 0 && (
                    <p className="no-docs" style={{ margin: '10px 0', fontSize: '0.8rem' }}>No other documents.</p>
                  )}
                </div>
              </>
            )
          )}
        </div>
        
        <div className="system-status">
          <h3><SettingsIcon size={15} style={{ marginRight: '6px' }} /> System Status</h3>
          <div className="status-indicator">
            <span className={`status-dot ${status.online ? 'online' : 'offline'}`}></span>
            <span>{status.online ? 'Active (Offline Mode)' : 'Disconnected'}</span>
          </div>
          <div className="status-detail">
            <p><strong>LLM:</strong> {status.chatModel}</p>
            <p><strong>Embeddings:</strong> {status.embeddingModel}</p>
            <p><strong>API Endpoint:</strong> {status.apiEndpoint}</p>
          </div>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="chat-panel">
        <header className="chat-header">
          {!showDocs && (
            <button className="sidebar-toggle-btn" onClick={() => setShowDocs(true)}>
              <DocumentIcon size={14} style={{ marginRight: '6px' }} /> Menu
            </button>
          )}
          <h1 style={{ display: 'flex', alignItems: 'center' }}>
            <SparkleIcon size={22} style={{ color: '#3b82f6', marginRight: '10px' }} />
            Local RAG AI Assistant
          </h1>
          <div className="online-badge">
            <span className="pulse-green"></span>
            <span>100% Local & Secure Server</span>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-card glass-panel">
                <h2>Welcome to Local RAG! <span className="wave">👋</span></h2>
                <p>This application runs entirely on your local machine using local AI models and SQLite. No data is sent to the internet.</p>
                <div className="tips">
                  <h4>Suggested Questions:</h4>
                  <ul>
                    <li>"How long is the summer school training?"</li>
                    <li>"What will students do in the 3rd week?"</li>
                    <li>"How do Microsoft interns develop their projects?"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.role}`}>
                <div className="avatar">
                  {msg.role === 'user' ? <UserIcon size={18} /> : <SparkleIcon size={18} style={{ color: '#3b82f6' }} />}
                </div>
                <div className="message-content">
                  <div className="bubble">{msg.content}</div>
                  {msg.context && (
                    <details className="context-accordion">
                      <summary>
                        <SearchIcon size={13} style={{ marginRight: '6px' }} />
                        Source Document Details (RAG)
                      </summary>
                      <div className="context-details-content">
                        <p><strong>Source File:</strong> {msg.fileName}</p>
                        <p><strong>Matched Text:</strong> {msg.context}</p>
                        <p><strong>Semantic Similarity:</strong> {msg.score}%</p>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="message-wrapper assistant">
              <div className="avatar">
                <SparkleIcon size={18} style={{ color: '#3b82f6' }} />
              </div>
              <div className="message-content">
                <div className="bubble typing-bubble">
                  <div className="dot-flashing"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Autocomplete Mentions Floating Menu */}
        {showMentionsMenu && (
          <div className="mentions-dropdown-menu glass-panel">
            <div className="mentions-header">Filter RAG query by document:</div>
            {documents.filter(d => d.file_name.toLowerCase().includes(mentionSearchQuery.toLowerCase())).length === 0 ? (
              <div className="mention-item-option empty">No documents match "{mentionSearchQuery}"</div>
            ) : (
              documents
                .filter(d => d.file_name.toLowerCase().includes(mentionSearchQuery.toLowerCase()))
                .map((doc, idx) => (
                  <div
                    key={idx}
                    className={`mention-item-option ${selectedMentionIndex === idx ? 'active' : ''}`}
                    onClick={() => {
                      setMentionedFile(doc.file_name);
                      setShowMentionsMenu(false);
                      // Clear the typed "@" pattern from query input
                      const words = input.split(' ');
                      words.pop();
                      setInput(words.join(' ') + ' ');
                      inputRef.current?.focus();
                    }}
                  >
                    <DocumentIcon size={14} style={{ marginRight: '6px' }} />
                    {doc.file_name}
                  </div>
                ))
            )}
          </div>
        )}

        <form className="input-form-wrapper" onSubmit={handleSendMessage}>
          {mentionedFile && (
            <div className="active-mention-badge">
              <DocumentIcon size={12} style={{ marginRight: '4px' }} />
              {mentionedFile}
              <button 
                type="button" 
                className="clear-mention-btn" 
                onClick={() => setMentionedFile(null)}
              >
                &times;
              </button>
            </div>
          )}
          <div className="input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);

                // Autocomplete checks
                const words = val.split(' ');
                const lastWord = words[words.length - 1];
                if (lastWord.startsWith('@')) {
                  setShowMentionsMenu(true);
                  setMentionSearchQuery(lastWord.slice(1));
                  setSelectedMentionIndex(0);
                } else {
                  setShowMentionsMenu(false);
                }
              }}
              onKeyDown={(e) => {
                if (showMentionsMenu) {
                  const filteredDocs = documents.filter(d => d.file_name.toLowerCase().includes(mentionSearchQuery.toLowerCase()));
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedMentionIndex(prev => (prev + 1) % filteredDocs.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedMentionIndex(prev => (prev - 1 + filteredDocs.length) % filteredDocs.length);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredDocs[selectedMentionIndex]) {
                      setMentionedFile(filteredDocs[selectedMentionIndex].file_name);
                      setShowMentionsMenu(false);
                      const words = input.split(' ');
                      words.pop();
                      setInput(words.join(' ') + ' ');
                    }
                  } else if (e.key === 'Escape') {
                    setShowMentionsMenu(false);
                  }
                }
              }}
              placeholder={mentionedFile ? `Ask RAG only about "${mentionedFile}"...` : "Ask the local RAG assistant a question..."}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>

      {deleteTarget && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content glass-panel">
            <div className="confirm-modal-header">
              <span className="confirm-modal-icon">
                <WarningIcon size={20} style={{ color: '#ef4444' }} />
              </span>
              <h3>{deleteTarget.type === 'session' ? 'Delete Chat' : 'Delete Document'}</h3>
            </div>
            <p className="confirm-modal-message">
              {deleteTarget.type === 'session'
                ? 'Are you sure you want to delete this chat history?'
                : `Are you sure you want to delete the document "${deleteTarget.filename}" and all its database indices?`}
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="confirm-btn-danger" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`toast-notification glass-panel ${notification.type}`}>
          <div className="toast-icon">
            {notification.type === 'success' && <SuccessIcon size={20} style={{ color: '#10b981' }} />}
            {notification.type === 'error' && <ErrorIcon size={20} style={{ color: '#ef4444' }} />}
            {notification.type === 'info' && <InfoIcon size={20} style={{ color: '#3b82f6' }} />}
          </div>
          <div className="toast-message">{notification.message}</div>
        </div>
      )}
    </div>
  );
}

export default App;
