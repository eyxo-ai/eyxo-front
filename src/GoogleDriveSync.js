import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://eyxo-ai.up.railway.app';

export function GoogleDriveSync({ projectId, onSync, compact = false }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/gdrive/folders`);
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/gdrive/status`);
      const data = await response.json();
      setAuthenticated(data.authenticated);

      if (data.authenticated) {
        loadFolders();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  }, [loadFolders]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log('🔍 Solicitando URL de autorização...');
      const response = await fetch(`${API_BASE}/gdrive/auth-url`);
      console.log('📡 Status da resposta:', response.status);
      const data = await response.json();
      console.log('📦 Dados recebidos:', data);

      if (data.error) {
        console.error('❌ Erro recebido:', data.error);
        alert(`Erro: ${data.error}`);
        setLoading(false);
        return;
      }

      if (!data.auth_url) {
        console.error('❌ URL de autorização não recebida');
        alert('Erro: URL de autorização não disponível');
        setLoading(false);
        return;
      }

      // Abrir popup para autenticação
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.auth_url,
        'Google Drive Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Monitorar quando o popup é fechado
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          console.log('✅ Popup fechado, verificando autenticação...');
          setLoading(false);
          // Aguardar um momento antes de verificar o status para garantir que o backend processou
          setTimeout(() => {
            checkAuthStatus();
          }, 500);
        }
      }, 500);

    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login no Google Drive');
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!projectId || !selectedFolder) {
      alert('Selecione um projeto e uma pasta');
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: 'info', message: 'Sincronizando arquivos...' });

      // Iniciar o polling para buscar progresso em tempo real
      let lastLogCount = 0;
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`${API_BASE}/gdrive/sync-progress/${projectId}`);
          const progressData = await progressResponse.json();

          if (progressData.progress && progressData.progress.length > lastLogCount) {
            // Enviar apenas os novos logs
            const newLogs = progressData.progress.slice(lastLogCount);
            if (onSync && newLogs.length > 0) {
              onSync(null, newLogs, false, true); // true = modo streaming
            }
            lastLogCount = progressData.progress.length;
          }
        } catch (err) {
          console.error('Erro ao buscar progresso:', err);
        }
      }, 500); // Buscar a cada 500ms

      // Iniciar a sincronização
      const response = await fetch(`${API_BASE}/gdrive/sync-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          folder_id: selectedFolder,
          user_id: 'default'
        })
      });

      // Parar o polling quando terminar
      clearInterval(pollInterval);

      const data = await response.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: `${data.files_processed} arquivos processados com sucesso!`
        });

        if (onSync) {
          // Passar os logs finais e informação sobre créditos
          onSync(data.memory, data.progress_log, data.insufficient_credits, false);
        }
      } else {
        setStatus({ type: 'error', message: data.error || 'Erro na sincronização' });

        // Mesmo em caso de erro, enviar os logs se existirem
        if (onSync && data.progress_log) {
          onSync(null, data.progress_log, false, false);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setStatus({ type: 'error', message: 'Erro ao sincronizar com Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  // Compact inline UI for navbar: only render Connect / Folder selector / Sync horizontally
  if (compact) {
    return (
      <div className="gdrive-compact">
        {!authenticated ? (
          <button onClick={handleLogin} disabled={loading} className="btn-primary">
            {loading ? '⏳ Conectando...' : '🔐 Conectar Google Drive'}
          </button>
        ) : (
          <>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              disabled={loading}
              title="Configurar pasta"
              className="gdrive-folder-select"
            >
              <option value="">-- Configurar pasta --</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleSync}
              disabled={loading || !selectedFolder || !projectId}
              className="btn-sync"
              title="Sincronizar memória"
            >
              {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar memória'}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="gdrive-sync">
      <h3>📁 Google Drive</h3>

      {status && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      {!authenticated ? (
        <div className="gdrive-login">
          <p>Conecte-se ao Google Drive para sincronizar arquivos do projeto</p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Conectando...' : '🔐 Conectar Google Drive'}
          </button>
        </div>
      ) : (
        <div className="gdrive-connected">
          <div className="status-badge">✅ Conectado</div>

          <div className="folder-selector">
            <label>Selecione a pasta do projeto:</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Selecione uma pasta --</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSync}
            disabled={loading || !selectedFolder || !projectId}
            className="btn-sync"
          >
            {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar Arquivos'}
          </button>
        </div>
      )}
    </div>
  );
}

export default GoogleDriveSync;
