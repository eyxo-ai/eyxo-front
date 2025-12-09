import { useRef, useState } from 'react';
import './MessageInput.css';

function MessageInput({ onSendMessage, onFileSelect, loading, selectedFiles = [], onRemoveFile }) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      if (message.trim() || selectedFiles.length > 0) {
        onSendMessage(message);
        setMessage('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onFileSelect(e.target.files);
      e.target.value = null;
    }
  };

  const getPlaceholderText = (isLoading, files) => {
    if (isLoading) return "Processando...";
    if (files.length > 0) return "Adicione um comentário e clique em enviar →";
    return "Digite sua mensagem...";
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <button
          className="attach-btn"
          onClick={handleAttachClick}
          title="Anexar arquivo"
        >
          📎
        </button>

        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.txt,.doc,.docx,.mp3,.wav,.m4a,.ogg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className={`input-field-container ${loading ? 'disabled' : ''}`}>
          {selectedFiles.length > 0 && (
            <div className="files-in-input">
              {selectedFiles.map((file, index) => (
                <div key={`file-${file.name}-${index}`} className="file-chip in-input">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <button
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      onRemoveFile(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            className="input-field"
            id='message-input-textarea'
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
            }}
            onKeyDown={handleKeyPress}
            placeholder={getPlaceholderText(loading, selectedFiles)}
            rows="1"
          />
        </div>
        <button
          className="send-btn"
          onClick={handleSubmit}
          title="Enviar"
          disabled={loading}
        >
          {loading ? '⌛' : '→'}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;