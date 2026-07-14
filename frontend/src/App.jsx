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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const messagesEndRef = useRef(null);

  const BACKEND_URL = 'http://localhost:8000';

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
    });
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
        showNotification("Belge başarıyla yüklendi ve dizinlendi!", "success");
        fetchDocuments();
      } else {
        const err = await res.json();
        showNotification(`Hata: ${err.detail || 'Dosya yüklenemedi.'}`, "error");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      showNotification("Sunucuyla bağlantı kurulamadı.", "error");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation(); // Sohbet satırına tıklama olayını engelle
    showConfirm(
      "Sohbeti Sil",
      "Bu sohbet geçmişini silmek istediğinizden emin misiniz?",
      async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            showNotification("Sohbet geçmişi başarıyla silindi.", "success");
            if (currentSessionId === sessionId) {
              setCurrentSessionId(null);
              setMessages([]);
            }
          } else {
            showNotification("Sohbet geçmişi silinirken hata oluştu.", "error");
          }
        } catch (err) {
          console.error("Error deleting session:", err);
          showNotification("Sunucuyla bağlantı kurulamadı.", "error");
        }
      }
    );
  };

  const handleDeleteDocument = (e, filename) => {
    e.stopPropagation();
    showConfirm(
      "Belgeyi Sil",
      `"${filename}" belgesini ve tüm veritabanı indekslerini silmek istediğinizden emin misiniz?`,
      async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/documents/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            showNotification("Belge ve veritabanı indeksleri başarıyla silindi.", "success");
            fetchDocuments();
          } else {
            const err = await res.json();
            showNotification(`Hata: ${err.detail || 'Belge silinemedi.'}`, "error");
          }
        } catch (err) {
          console.error("Error deleting document:", err);
          showNotification("Sunucuyla bağlantı kurulamadı.", "error");
        }
      }
    );
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

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Kullanıcı mesajını veritabanına kaydet
    await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: userMessage.content
      })
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content })
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
          content: `Hata: ${errorData.detail || 'Bir şeyler ters gitti.'}`
        }]);
      }
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sunucuyla iletişim kurulamadı. Lütfen FastAPI backend sunucusunun çalıştığından emin olun.'
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
            <ChatIcon size={15} style={{ marginRight: '6px' }} /> Sohbetler
          </button>
          <button 
            className={`tab-btn ${sidebarTab === 'docs' ? 'active' : ''}`} 
            onClick={() => setSidebarTab('docs')}
          >
            <DocumentIcon size={15} style={{ marginRight: '6px' }} /> Belgeler
          </button>
          <button className="sidebar-toggle" onClick={() => setShowDocs(!showDocs)}>
            {showDocs ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
          </button>
        </div>

        {/* Yeni Sohbet Butonu */}
        {sidebarTab === 'chats' && (
          <button className="new-chat-btn" onClick={handleNewChat}>
            <PlusIcon size={14} style={{ marginRight: '6px' }} /> Yeni Sohbet Başlat
          </button>
        )}

        {/* Belge Ekleme Butonu */}
        {sidebarTab === 'docs' && (
          <div className="upload-section">
            <label className={`upload-btn ${uploading ? 'disabled' : ''}`}>
              {uploading ? (
                <>
                  <SpinnerIcon size={14} style={{ marginRight: '6px' }} /> Dizinleniyor...
                </>
              ) : (
                <>
                  <PlusIcon size={14} style={{ marginRight: '6px' }} /> Belge Ekle (PDF, Word, ...)
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
            sessions.length === 0 ? (
              <p className="no-docs">Henüz hiç sohbet kaydınız bulunmuyor.</p>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id} 
                  className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  <span className="session-icon"><ChatIcon size={16} /></span>
                  <div className="session-info">
                    <p className="session-title">{session.title}</p>
                  </div>
                  <button className="delete-session-btn" onClick={(e) => handleDeleteSession(e, session.id)}>
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))
            )
          ) : (
            /* Döküman Listesi */
            documents.length === 0 ? (
              <p className="no-docs">Veritabanında dizinlenmiş belge bulunamadı.</p>
            ) : (
              documents.map((doc, idx) => (
                <div key={idx} className="doc-item flex-row">
                  <span className="doc-icon"><DocumentIcon size={18} /></span>
                  <div className="doc-info">
                    <p className="doc-name">{doc.file_name}</p>
                    <span className="doc-chunks">{doc.chunks_count} parça</span>
                  </div>
                  <button className="delete-doc-btn" onClick={(e) => handleDeleteDocument(e, doc.file_name)}>
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))
            )
          )}
        </div>
        
        <div className="system-status">
          <h3><SettingsIcon size={15} style={{ marginRight: '6px' }} /> Sistem Durumu</h3>
          <div className="status-indicator">
            <span className={`status-dot ${status.online ? 'online' : 'offline'}`}></span>
            <span>{status.online ? 'Aktif (Offline Mod)' : 'Bağlantı Kesildi'}</span>
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
              <DocumentIcon size={14} style={{ marginRight: '6px' }} /> Menü
            </button>
          )}
          <h1 style={{ display: 'flex', alignItems: 'center' }}>
            <SparkleIcon size={22} style={{ color: '#3b82f6', marginRight: '10px' }} />
            Local RAG AI Asistanı
          </h1>
          <div className="online-badge">
            <span className="pulse-green"></span>
            <span>%100 Yerel Güvenli Sunucu</span>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-card glass-panel">
                <h2>Hoş Geldin! <span className="wave">👋</span></h2>
                <p>Bu uygulama tamamen senin bilgisayarındaki yapay zeka modellerini ve SQLite veritabanını kullanır. İnternete hiçbir veri gönderilmez.</p>
                <div className="tips">
                  <h4>Deneyebileceğin Sorular:</h4>
                  <ul>
                    <li>"Yaz okulu eğitimi ne kadar sürecek?"</li>
                    <li>"Öğrenciler 3. haftada ne yapacaklar?"</li>
                    <li>"Microsoft stajyerleri projelerini nasıl geliştirir?"</li>
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
                        Kaynak Belge Detayları (RAG)
                      </summary>
                      <div className="context-details-content">
                        <p><strong>Kaynak Dosya:</strong> {msg.fileName}</p>
                        <p><strong>Eşleşen Metin:</strong> {msg.context}</p>
                        <p><strong>Anlamsal Benzerlik:</strong> %{msg.score}</p>
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

        <form className="input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Yerel RAG asistanına bir soru sorun..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Gönder
          </button>
        </form>
      </div>

      {confirmDialog.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content glass-panel">
            <div className="confirm-modal-header">
              <span className="confirm-modal-icon">
                <WarningIcon size={20} style={{ color: '#ef4444' }} />
              </span>
              <h3>{confirmDialog.title}</h3>
            </div>
            <p className="confirm-modal-message">{confirmDialog.message}</p>
            <div className="confirm-modal-actions">
              <button className="confirm-btn-cancel" onClick={closeConfirm}>İptal</button>
              <button className="confirm-btn-danger" onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }}>Sil</button>
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
