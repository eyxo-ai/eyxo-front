import { useState, useRef, useEffect } from 'react';
import './index.css';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import WelcomeMessage from './components/WelcomeMessage';
import MessageInput from './components/MessageInput';
import GoogleDriveSync from './GoogleDriveSync';

// URL base da API
const API_BASE_URL = 'https://web-production-a2c28.up.railway.app';

function App() {
  const [projectId, setProjectId] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState(false);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false); // Usado para desabilitar UI durante processamento
  const [inputValue, setInputValue] = useState('');
  const [gdriveAuthenticated, setGdriveAuthenticated] = useState(false);
  const [gdriveFolderId, setGdriveFolderId] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false); // Controla se o setup inicial foi completado
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Função para resetar tudo e voltar ao início
  const handleReset = () => {
    setProjectId('');
    setSelectedClient(null);
    setSelectedProject(null);
    setMessages([]);
    setFiles([]);
    setInputValue('');
    setSetupComplete(false);
  };

  // Verificar status do Google Drive ao carregar
  useEffect(() => {
    checkGDriveStatus();
    loadClients();
  }, []);

  // Scroll para o fim das mensagens quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Usar timeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Verificar status de autenticação do Google Drive
  const checkGDriveStatus = async () => {
    try {
      const response = await fetch('https://web-production-a2c28.up.railway.app/gdrive/status');
      const data = await response.json();

      setGdriveAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Buscar lista de clientes e seus projetos do backend
  const loadClients = async () => {
    setLoadingClients(true);
    setClientsError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Resposta da API /clientes:', data);

      // A API retorna um array direto de clientes
      if (Array.isArray(data)) {
        // Buscar projetos para cada cliente
        const clientsWithProjects = await Promise.all(
          data.map(async (client) => {
            try {
              const projectsResponse = await fetch(`${API_BASE_URL}/clientes/${client.id}/projetos`);
              const projects = await projectsResponse.json();
              return {
                ...client,
                name: client.nome || client.name, // Mapear nome
                projects: Array.isArray(projects) ? projects.map(p => ({
                  id: p.id,
                  name: p.nome || p.name
                })) : []
              };
            } catch (error) {
              console.error(`Erro ao buscar projetos do cliente ${client.id}:`, error);
              return {
                ...client,
                name: client.nome || client.name,
                projects: []
              };
            }
          })
        );

        setClients(clientsWithProjects);
        console.log('Clientes carregados:', clientsWithProjects);
      } else {
        console.warn('Resposta não é um array:', data);
        setClients([]);
        setClientsError(true);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
      setClientsError(true);
    } finally {
      setLoadingClients(false);
    }
  };

  // Adicionar mensagem ao chat
  const addMessage = (text, sender, hasActions = false, hasReset = false) => {
    setMessages(prev => [...prev, { text, sender, hasActions, hasReset, timestamp: new Date() }]);
  };

  // Conectar ao Google Drive
  const handleConnectGDrive = async () => {
    if (gdriveAuthenticated) {
      addMessage("✓ Você já está conectado ao Google Drive", "assistant");
      return;
    }

    addMessage("Conectar Google Drive", "user");
    addMessage("Abrindo janela de autorização...", "assistant");

    try {
      const response = await fetch('https://web-production-a2c28.up.railway.app/gdrive/auth-url');
      const data = await response.json();

      if (data.auth_url) {
        const popup = window.open(
          data.auth_url,
          "Google Authorization",
          "width=600,height=700"
        );

        // Monitorar quando o popup é fechado
        const checkPopup = setInterval(async () => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            console.log("✅ Popup fechado, verificando autenticação...");

            // Aguardar um momento antes de verificar o status
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Verificar status
            await checkGDriveStatus();

            // Mostrar mensagem apropriada
            if (gdriveAuthenticated) {
              addMessage(
                "✓ Google Drive conectado com sucesso!",
                "assistant",
                true
              );
            } else {
              addMessage(
                "⚠ Autenticação não completada. Tente novamente.",
                "assistant"
              );
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error("Erro:", error);
      addMessage("Erro ao conectar com Google Drive", "assistant");
    }
  };

  // Selecionar pasta do Google Drive
  const handleSelectFolder = async () => {
    if (!gdriveAuthenticated) {
      addMessage(
        "⚠ Conecte-se ao Google Drive primeiro",
        "assistant",
        true
      );
      return;
    }

    if (!projectId) {
      addMessage(
        "⚠ Crie um projeto primeiro. Digite: projeto: nome-do-projeto",
        "assistant"
      );
      return;
    }

    addMessage("Configurar pasta do projeto", "user");
    addMessage("Carregando pastas do Google Drive...", "assistant");

    try {
      const response = await fetch('https://web-production-a2c28.up.railway.app/gdrive/folders?user_id=default');
      const data = await response.json();

      if (data.success && data.folders.length > 0) {
        addMessage(
          "Selecione uma pasta clicando em um dos botões abaixo:",
          "assistant"
        );

        // Mostrar botões para seleção de pastas (implementado no futuro)
      } else {
        addMessage("Nenhuma pasta encontrada no Google Drive", "assistant");
      }
    } catch (error) {
      console.error("Erro:", error);
      addMessage("Erro ao carregar pastas", "assistant");
    }
  };

  // Selecionar pasta pelo ID
  const handleSelectFolderById = (folderId, folderName) => {
    setGdriveFolderId(folderId);

    addMessage(`📁 ${folderName}`, "user");
    addMessage(
      `✓ Pasta "${folderName}" configurada! Sincronizando memória...`,
      "assistant"
    );

    // Aguardar um momento antes de sincronizar
    setTimeout(() => handleSyncMemory(), 1000);
  };

  // Sincronizar memória com Google Drive
  const handleSyncMemory = async () => {
    if (!projectId || !gdriveFolderId) {
      addMessage("⚠ Configure o projeto e a pasta primeiro", "assistant");
      return;
    }

    addMessage("Sincronizar memória", "user");
    addMessage("🔄 Iniciando sincronização...", "assistant");

    console.log("🔄 Iniciando sincronização...");
    console.log("Projeto:", projectId);
    console.log("Pasta ID:", gdriveFolderId);

    // Iniciar polling de progresso (implementação simplificada)
    let progressInterval;

    try {
      const response = await fetch(
        "https://web-production-a2c28.up.railway.app/gdrive/sync-memory",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            folder_id: gdriveFolderId,
            user_id: "default",
          }),
        }
      );

      if (progressInterval) clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na resposta:", errorText);
        addMessage(`❌ Erro no servidor: ${response.status}\n${errorText}`, "assistant");
        return;
      }

      const data = await response.json();

      if (data.success) {
        const memory = data.memory;
        let info = `✓ Sincronização concluída!\n\n`;

        info += `📁 Arquivos encontrados: ${data.files_found || 0}\n`;
        info += `✓ Arquivos processados: ${data.files_processed || 0}\n`;

        if (data.progress_log) {
          info += `\n📋 Detalhes:\n${data.progress_log
            .slice(-10)
            .join("\n")}\n`;
        }

        info += `\n`;

        if (memory.tipo_business) {
          info += `🏢 Negócio: ${memory.tipo_business}\n`;
        }

        if (memory.paleta_cores && memory.paleta_cores.length > 0) {
          info += `🎨 Cores: ${memory.paleta_cores.join(", ")}\n`;
        }

        if (
          memory.informacoes_importantes &&
          memory.informacoes_importantes.length > 0
        ) {
          info += `\n📝 Informações:\n${memory.informacoes_importantes
            .map((i) => `• ${i}`)
            .join("\n")}`;
        }

        addMessage(info, "assistant");
      } else {
        addMessage(`❌ Erro: ${data.error || "Erro desconhecido"}`, "assistant");
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("❌ Erro completo:", error);
      addMessage(`❌ Erro ao sincronizar memória: ${error.message}`, "assistant");
    }
  };

  // Processar arquivos locais
  const handleProcessLocalFiles = async (additionalPrompt = "") => {
    console.log('handleProcessLocalFiles - projectId:', projectId);
    console.log('handleProcessLocalFiles - selectedProject:', selectedProject);

    if (!projectId) {
      addMessage(
        "⚠️ Você precisa completar a configuração primeiro!\n\nPasso a passo:\n1. Selecione um cliente\n2. Escolha ou crie um projeto\n3. Depois você pode anexar e enviar arquivos\n\n💡 Clique no botão abaixo para voltar ao início:",
        "assistant",
        false,
        true // hasReset = true
      );
      // Limpar arquivos para não confundir o usuário
      setFiles([]);
      return;
    }

    if (files.length === 0) {
      addMessage("Nenhum arquivo selecionado", "assistant");
      return;
    }

    setLoading(true); // Desabilitar UI durante processamento
    addMessage(`Processar ${files.length} arquivo(s)${additionalPrompt ? ' com prompt adicional' : ''}`, "user");
    addMessage("Processando arquivos e gerando briefing...", "assistant");

    try {
      // Primeiro, fazer upload dos anexos e criar o briefing
      const formData = new FormData();

      // Adicionar arquivos
      files.forEach((file) => {
        formData.append("files", file);
      });

      console.log('Criando briefing com project_id:', projectId);
      console.log('Tipo de projectId:', typeof projectId);

      // Criar briefing com anexos - aceitar tanto string quanto número
      const requestBody = {
        projeto_id: projectId, // Enviar como está (string ou número)
        titulo: `Briefing - ${new Date().toLocaleDateString()}`,
        descricao: additionalPrompt || "Briefing gerado automaticamente",
        status: "em_analise"
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/briefings`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro do servidor:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const briefingData = await response.json();
      const briefingId = briefingData.id;

      console.log('Briefing criado com ID:', briefingId);

      // Upload dos anexos se houver arquivos
      if (files.length > 0) {
        // Fazer upload de cada arquivo individualmente
        for (const file of files) {
          console.log('Enviando arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);

          const uploadFormData = new FormData();
          uploadFormData.append("file", file); // Backend espera "file" no singular

          const uploadResponse = await fetch(`${API_BASE_URL}/briefings/${briefingId}/anexos`, {
            method: "POST",
            body: uploadFormData
          });

          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.text();
            console.error('Erro ao fazer upload do arquivo:', file.name, uploadError);
            addMessage(`⚠️ Erro ao fazer upload de "${file.name}"`, "assistant");
          } else {
            console.log('Arquivo enviado com sucesso:', file.name);
          }
        }
      }

      // Analisar o briefing
      console.log('Iniciando análise do briefing...');
      const analyzeResponse = await fetch(`${API_BASE_URL}/briefings/${briefingId}/analyze`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!analyzeResponse.ok) {
        const analyzeError = await analyzeResponse.text();
        console.error('Erro ao analisar briefing:', analyzeError);
        addMessage("Briefing criado, mas houve erro na análise.", "assistant");
        return;
      }

      const analyzeData = await analyzeResponse.json();
      console.log('═══════════════════════════════════════');
      console.log('📊 DADOS RETORNADOS DO /analyze:');
      console.log('═══════════════════════════════════════');
      console.log('Estrutura completa:', JSON.stringify(analyzeData, null, 2));
      console.log('═══════════════════════════════════════');
      console.log('Chaves do objeto:', Object.keys(analyzeData));
      console.log('analyzeData.formatted_text:', analyzeData.formatted_text);
      console.log('analyzeData.analysis:', analyzeData.analysis);
      console.log('═══════════════════════════════════════');

      // Se o backend retornar texto formatado direto, usar ele
      if (analyzeData.formatted_text) {
        console.log('✅ Usando formatted_text do backend');
        addMessage(analyzeData.formatted_text, "assistant");
        setFiles([]);
        setInputValue("");
        return;
      }

      // Caso contrário, tentar usar o objeto analysis
      if (!analyzeData || Object.keys(analyzeData).length === 0) {
        console.log('❌ Análise retornou vazia');
        addMessage("⚠️ Briefing criado e arquivo enviado com sucesso, mas a análise retornou vazia.", "assistant");
        addMessage("O backend pode estar processando ou há um problema na análise do DeepSeek.", "assistant");
        addMessage(`Briefing ID: ${briefingId}`, "assistant");
        setFiles([]);
        setInputValue("");
        return;
      }

      // Se chegou aqui, temos um objeto analysis para formatar
      console.log('📝 Formatando briefing a partir do objeto JSON');
      const analysis = analyzeData.analysis || analyzeData;
      console.log('Objeto analysis que será usado:', analysis);

      // Usar os dados estruturados diretamente
      let briefingFormatado = `📋 BRIEFING DO PROJETO
═══════════════════════════════════════════════════════════

2️⃣ INFORMAÇÕES DO CLIENTE
• Cliente: ${selectedClient?.name || 'Não especificado'}
• Projeto: ${selectedProject?.name || 'Não especificado'}

═══════════════════════════════════════════════════════════

3️⃣ OBJETIVO DO PROJETO
${analysis.objetivo_principal || 'A definir'}

Objetivos Específicos:
${analysis.objetivos_especificos?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'A definir'}

Resultados Esperados:
${analysis.resultados_esperados?.map((res, i) => `${i + 1}. ${res}`).join('\n') || 'A definir'}

═══════════════════════════════════════════════════════════

4️⃣ PÚBLICO-ALVO
${analysis.publico_alvo || 'A definir'}

═══════════════════════════════════════════════════════════

5️⃣ ESCOPO E ENTREGAS
Principais Entregas:
${analysis.entregas_principais?.map((ent, i) => `${i + 1}. ${ent}`).join('\n') || 'A definir'}

Funcionalidades:
${analysis.funcionalidades?.map((func, i) => `${i + 1}. ${func}`).join('\n') || 'A definir'}

═══════════════════════════════════════════════════════════

6️⃣ REQUISITOS TÉCNICOS
${analysis.requisitos_tecnicos || 'A definir'}

═══════════════════════════════════════════════════════════

7️⃣ IDENTIDADE VISUAL
${analysis.identidade_visual || 'A definir'}

═══════════════════════════════════════════════════════════

8️⃣ CRONOGRAMA
${analysis.cronograma || 'A definir'}

═══════════════════════════════════════════════════════════

9️⃣ ORÇAMENTO
${analysis.orcamento || 'A definir'}

═══════════════════════════════════════════════════════════

📝 OBSERVAÇÕES
${analysis.observacoes || 'Nenhuma observação adicional'}`;

      addMessage(briefingFormatado, "assistant");

      // Limpar arquivos selecionados
      setFiles([]);
      setInputValue("");
    } catch (error) {
      console.error("Erro ao enviar arquivos:", error);
      addMessage("Erro ao enviar arquivos: " + error.message, "assistant");
    } finally {
      setLoading(false); // Re-habilitar UI após processamento
    }
  };

  const handleSendMessage = (text) => {
    // Se há arquivos anexados, processar mesmo sem texto
    if (files.length > 0) {
      handleProcessLocalFiles(text || "");
      return;
    }

    // Se não há arquivos e não há texto, não fazer nada
    if (!text.trim()) return;

    addMessage(text, "user");
    setInputValue("");

    const lowerText = text.toLowerCase();

    if (lowerText.includes("conectar") || lowerText.includes("google")) {
      handleConnectGDrive();
    } else if (
      lowerText.includes("pasta") ||
      lowerText.includes("configurar")
    ) {
      handleSelectFolder();
    } else if (
      lowerText.includes("sincronizar") ||
      lowerText.includes("atualizar")
    ) {
      handleSyncMemory();
    } else if (
      lowerText.includes("gerar briefing") ||
      lowerText.includes("criar briefing") ||
      lowerText.includes("briefing")
    ) {

      if (files.length > 0) {
        handleProcessLocalFiles("");
      } else {
        addMessage(
          "Para gerar um briefing, você precisa:\n\n1. Criar um projeto (digite: projeto: nome)\n2. Anexar arquivos (clique no 📎)\n3. Enviar para processar\n\nOu sincronize a memória com o Google Drive primeiro!",
          "assistant"
        );
      }
    } else if (lowerText.includes("projeto:")) {
      const match = text.match(/projeto:\s*(.+)/i);
      if (match) {
        const projectName = match[1].trim();

        // Se há um cliente selecionado, criar projeto para esse cliente
        if (selectedClient) {
          saveNewProject(selectedClient.id, projectName).then((savedProject) => {
            if (savedProject) {
              console.log('Projeto criado:', savedProject);
              setProjectId(savedProject.id); // Usar o ID do projeto, não o nome
              setSelectedProject(savedProject);
              addMessage(
                `✓ Projeto "${projectName}" criado e selecionado para o cliente "${selectedClient.name}"!\n\nAgora você pode:\n\n1. 🔗 Conectar Google Drive e sincronizar memória\n2. 📎 Enviar arquivos locais para processar o briefing`,
                "assistant",
                true
              );
            }
          });
        } else {
          // Modo antigo não é suportado - requer cliente
          addMessage(
            `⚠️ Por favor, selecione um cliente primeiro antes de criar um projeto.`,
            "assistant"
          );
        }
      }
    } else {
      addMessage(
        "Como posso ajudar?\n\n• Conectar Google Drive\n• Configurar pasta\n• Sincronizar memória\n• Gerar briefing\n• Criar projeto (digite: projeto: nome)",
        "assistant"
      );
    }
  };

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...filesArray]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Função para salvar novo cliente no backend
  const saveNewClient = async (clientName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: clientName,
          email: `${clientName.toLowerCase().replace(/\s+/g, '')}@temp.com`, // Email temporário
          telefone: ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // A API retorna o cliente diretamente
      const newClient = {
        id: data.id,
        name: data.nome,
        projects: []
      };

      // Atualizar lista local de clientes
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      addMessage(`❌ Erro ao criar cliente: ${error.message}`, 'assistant');
    }
    return null;
  };

  // Função para salvar novo projeto no backend
  const saveNewProject = async (clientId, projectName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: projectName,
          descricao: '',
          cliente_id: clientId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // A API retorna o projeto diretamente
      const newProject = {
        id: data.id,
        name: data.nome
      };

      // Atualizar lista local de clientes com o novo projeto
      setClients(prev => prev.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            projects: [...(client.projects || []), newProject]
          };
        }
        return client;
      }));
      return newProject;
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      addMessage(`❌ Erro ao criar projeto: ${error.message}`, 'assistant');
    }
    return null;
  };

  // Handler quando cliente é selecionado (para criar novo projeto)
  const handleClientSelect = async (client, action) => {
    // Salvar cliente novo no backend se necessário
    let finalClient = client;
    if (client.isNew) {
      const savedClient = await saveNewClient(client.name);
      if (savedClient) {
        finalClient = savedClient;
      }
    }

    setSelectedClient(finalClient);

    if (action === 'newProject') {
      // Marcar setup como completo e mostrar chat para criar projeto
      setSetupComplete(true);
      addMessage(
        `Cliente "${finalClient.name}" selecionado.\n\nVamos criar um novo projeto! Digite o nome do projeto no formato: projeto: nome-do-projeto`,
        'assistant'
      );
    }
  };

  // Handler quando projeto é selecionado/confirmado
  const handleProjectSelect = async (client, project) => {
    // Se for um cliente novo, salvar primeiro
    let finalClient = client;
    if (client.isNew) {
      const savedClient = await saveNewClient(client.name);
      if (savedClient) {
        finalClient = savedClient;
      }
    }

    setSelectedClient(finalClient);
    setSelectedProject(project);

    // Definir o projectId baseado no projeto selecionado
    const projectName = typeof project === 'string' ? project : project.name;
    const projectIdValue = typeof project === 'string' ? project : project.id;

    console.log('Projeto selecionado:', project);
    console.log('projectIdValue:', projectIdValue);
    console.log('Tipo:', typeof projectIdValue);

    // Aceitar tanto string quanto número como ID do projeto
    if (!projectIdValue) {
      console.error('ERRO: projectIdValue está vazio:', projectIdValue);
      addMessage('❌ Erro ao selecionar projeto: ID inválido. Por favor, tente novamente.', 'assistant');
      return;
    }

    setProjectId(projectIdValue);

    // Adicionar mensagem de confirmação final
    // addMessage(
    //   `✓ Ótimo! Estamos trabalhando com o cliente "${finalClient.name}" no projeto "${projectName}".\n\n🎯 Projeto configurado! Agora você pode:\n\n1. 🔗 Conectar Google Drive e sincronizar memória\n2. 📎 Anexar arquivos e enviar para processar o briefing`,
    //   'assistant',
    //   true
    // );

    addMessage(
      `✓ Ótimo! Estamos trabalhando com o cliente "${finalClient.name}" no projeto "${projectName}".\n\n🎯 Projeto configurado! Agora você pode:\n\n1. 📎 Anexar arquivos e enviar para processar o briefing`,
      'assistant',
      true
    );


    // Marcar setup como completo para esconder o WelcomeMessage
    setSetupComplete(true);
  };

  return (
    <div className="App">
      <Header
        onConnectGDrive={handleConnectGDrive}
        onSelectFolder={handleSelectFolder}
        onSyncMemory={handleSyncMemory}
        gdriveAuthenticated={gdriveAuthenticated}
      />

      <div ref={chatContainerRef} className={`chat-container ${!setupComplete ? 'welcome-container' : ''}`}>
        {!setupComplete ? (
          <WelcomeMessage
            existingClients={clients}
            onClientSelect={handleClientSelect}
            onProjectSelect={handleProjectSelect}
            onAddMessage={addMessage}
            loading={loadingClients}
            error={clientsError}
          />
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                text={msg.text}
                type={msg.sender}
                hasActions={msg.hasActions}
                hasReset={msg.hasReset}
                onConnectGDrive={handleConnectGDrive}
                onSelectFolder={handleSelectFolder}
                onReset={handleReset}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileSelect}
        loading={loading}
        selectedFiles={files}
        onRemoveFile={handleRemoveFile}
      />
    </div>
  );
}

export default App;