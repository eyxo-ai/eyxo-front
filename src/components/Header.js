import './Header.css';

function Header({ onConnectGDrive, onSelectFolder, onSyncMemory, gdriveAuthenticated }) {
  return (
    <div className="header">
      <div className="header-left">
        <div className="bendito-brand">Eyxo.IA</div>
        <div className="header-title">
          <h1>Assistente de Briefing</h1>
        </div>
      </div>
      <div className="quick-actions">
        <button className="quick-action" onClick={onConnectGDrive}>
          Conectar Google Drive
        </button>
        <button className="quick-action" onClick={onSelectFolder}>
          Configurar Pasta
        </button>
        <button className="quick-action" onClick={onSyncMemory}>
          Sincronizar Memória
        </button>
      </div>
      <div className={`gdrive-status ${gdriveAuthenticated ? 'connected' : ''}`}>
        <span className="gdrive-icon">{gdriveAuthenticated ? '✓' : '⚪'}</span>
        <span>{gdriveAuthenticated ? 'Drive Conectado' : 'Google Drive'}</span>
      </div>
    </div>
  );
}

export default Header;