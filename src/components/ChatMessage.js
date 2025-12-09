import './ChatMessage.css';

function ChatMessage({ text, type = 'assistant', hasActions = false, hasReset = false, onConnectGDrive, onSelectFolder, onReset }) {
    const time = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (type === 'system') {
        return (
            <div className="message system">
                <div className="message-content">
                    <div className="message-bubble">{text}</div>
                </div>
            </div>
        );
    }

    const avatar = type === 'assistant' ? '🤖' : '👤';
    const name = type === 'assistant' ? 'EYXO.IA' : 'Você';

    return (
        <div className={`message ${type}`}>
            <div className="avatar-column">
                <div className="message-avatar">{avatar}</div>
                <div className="avatar-name">{name}</div>
            </div>
            <div className="message-content">
                <div className="message-bubble">
                    {text}
                    <div className="message-time">{time}</div>
                </div>
                {hasActions && (
                    <div className="action-buttons">
                        <button className="action-btn" onClick={onConnectGDrive}>Conectar Drive</button>
                        <button className="action-btn" onClick={onSelectFolder}>Selecionar Pasta</button>
                    </div>
                )}
                {hasReset && (
                    <div className="action-buttons">
                        <button className="action-btn reset-btn" onClick={onReset}>🔄 Voltar ao Início</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatMessage;