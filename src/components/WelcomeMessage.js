import { useState } from 'react';
import './WelcomeMessage.css';

function WelcomeMessage({
  onClientSelect,
  onProjectSelect,
  existingClients = [],
  loading = false,
  error = null,
  onAddMessage
}) {

  const [step, setStep] = useState('clientList'); // Iniciar direto na lista de clientes
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Termo de busca para filtrar clientes

  // Filtrar clientes baseado no termo de busca
  const filteredClients = existingClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Passo 1: Lista de clientes (início do fluxo)
  const renderClientList = () => (
    <>
      {/* Mensagem de boas-vindas */}
      <div className="bot-message">
        <div className="bot-avatar">
          <span className="avatar-icon">🤖</span>
          <span className="avatar-label">EYXO.IA</span>
        </div>
        <div className="bot-content">
          <h2>Olá, atendente da eyxo! Eu sou o eyxo.ia e estou aqui para ajudar a traduzir o briefing dos clientes.</h2>
          <p>Quem fez a solicitação?</p>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bot-message">
        <div className="bot-avatar">
          <span className="avatar-icon">👥</span>
          <span className="avatar-label">CLIENTES</span>
        </div>
        <div className="bot-content">
          {error && (
            <div className="error-message">
              <span>⚠️ Não foi possível carregar a lista de clientes do servidor.</span>
              <span>Você ainda pode criar um novo cliente abaixo.</span>
            </div>
          )}

          {loading ? (
            <p className="list-description">Carregando clientes...</p>
          ) : (
            <>
              {existingClients.length > 0 && (
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite para buscar cliente..."
                  className="client-input"
                  style={{ marginBottom: '16px' }}
                />
              )}

              <p className="list-description">
                {existingClients.length > 0
                  ? `${filteredClients.length} cliente${filteredClients.length !== 1 ? 's' : ''} encontrado${filteredClients.length !== 1 ? 's' : ''}`
                  : 'Nenhum cliente cadastrado ainda. Vamos começar adicionando o primeiro!'}
              </p>
            </>
          )}

          <div className="client-list">
            {filteredClients.length > 0 && filteredClients.map((client) => (
              <button
                key={client.id}
                className="list-item-button"
                onClick={() => handleClientSelection(client)}
              >
                <span className="item-icon">👤</span>
                <span className="item-name">{client.name}</span>
                <span className="item-arrow">→</span>
              </button>
            ))}

            {!showAddClient ? (
              <button
                className="list-item-button add-new"
                onClick={() => setShowAddClient(true)}
              >
                <span className="item-icon">➕</span>
                <span className="item-name">
                  {existingClients.length > 0
                    ? 'Adicionar novo cliente'
                    : 'Criar primeiro cliente'}
                </span>
              </button>
            ) : (
              <div className="add-client-form">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do novo cliente"
                  className="client-input"
                  autoFocus
                />
                <div className="form-buttons">
                  <button
                    className="action-button secondary small"
                    onClick={() => {
                      setShowAddClient(false);
                      setNewClientName('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="action-button primary small"
                    onClick={handleAddNewClient}
                    disabled={!newClientName.trim()}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Passo 2a: Cliente associado a um único projeto
  const renderSingleProject = () => {
    const projectName = selectedClient?.projects?.[0]?.name || 'projeto';

    return (
      <div className="bot-message">
        <div className="bot-avatar">
          <span className="avatar-icon">📁</span>
          <span className="avatar-label">PROJETO</span>
        </div>
        <div className="bot-content">
          <h3>Então estamos trabalhando no projeto "{projectName}", certo?</h3>
          <div className="action-buttons-group">
            <button
              className="action-button primary"
              onClick={() => handleProjectConfirm(selectedClient.projects[0])}
            >
              Sim, continuar
            </button>
            <button
              className="action-button secondary"
              onClick={() => setStep('clientList')}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Passo 2b: Cliente associado a múltiplos projetos
  const renderMultipleProjects = () => (
    <div className="bot-message">
      <div className="bot-avatar">
        <span className="avatar-icon">📂</span>
        <span className="avatar-label">PROJETOS</span>
      </div>
      <div className="bot-content">
        <h3>"Em qual projeto estamos trabalhando?"</h3>
        <div className="project-list">
          {selectedClient.projects.map((project) => (
            <button
              key={project.id}
              className="list-item-button"
              onClick={() => handleProjectConfirm(project)}
            >
              <span className="item-icon">📁</span>
              <span className="item-name">{project.name}</span>
              <span className="item-arrow">→</span>
            </button>
          ))}
          <button
            className="list-item-button add-new"
            onClick={() => handleAddNewProject()}
          >
            <span className="item-icon">➕</span>
            <span className="item-name">Adicionar novo projeto</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Passo 2c: Cliente NOVO (sem projetos cadastrados)
  const renderNewClientProject = () => (
    <div className="bot-message">
      <div className="bot-avatar">
        <span className="avatar-icon">✨</span>
        <span className="avatar-label">NOVO</span>
      </div>
      <div className="bot-content">
        <h3>"Essa pessoa é nova. Ela está dentro de um projeto existente?"</h3>
        <div className="action-buttons-group">
          <button
            className="action-button primary"
            onClick={() => setStep('existingProjectList')}
          >
            Sim, selecionar projeto existente
          </button>
          <button
            className="action-button secondary"
            onClick={() => handleAddNewProject()}
          >
            Não, criar novo projeto
          </button>
        </div>
      </div>
    </div>
  );

  // Passo 3d: Lista de todos os projetos existentes (de todos os clientes)
  const renderExistingProjectList = () => {
    // Coletar todos os projetos de todos os clientes
    const allProjects = [];
    existingClients.forEach((client) => {
      if (client.projects && client.projects.length > 0) {
        client.projects.forEach((project) => {
          allProjects.push({
            ...project,
            clientName: client.name,
            clientId: client.id
          });
        });
      }
    });

    return (
      <div className="bot-message">
        <div className="bot-avatar">
          <span className="avatar-icon">📂</span>
          <span className="avatar-label">PROJETOS</span>
        </div>
        <div className="bot-content">
          <h3>Selecione o projeto existente</h3>
          {allProjects.length > 0 ? (
            <div className="project-list">
              {allProjects.map((project) => (
                <button
                  key={`${project.clientId}-${project.id}`}
                  className="list-item-button"
                  onClick={() => handleExistingProjectSelect(project)}
                >
                  <span className="item-icon">📁</span>
                  <div className="item-content">
                    <span className="item-name">{project.name}</span>
                    <span className="item-subtitle">Cliente: {project.clientName}</span>
                  </div>
                  <span className="item-arrow">→</span>
                </button>
              ))}
              <button
                className="list-item-button add-new"
                onClick={() => handleAddNewProject()}
              >
                <span className="item-icon">➕</span>
                <span className="item-name">Criar novo projeto</span>
              </button>
            </div>
          ) : (
            <div>
              <p>Nenhum projeto existente encontrado. Vamos criar um novo!</p>
              <button
                className="action-button primary"
                onClick={() => handleAddNewProject()}
              >
                Criar novo projeto
              </button>
            </div>
          )}
          <button
            className="action-button secondary"
            style={{ marginTop: '12px' }}
            onClick={() => setStep('newClient')}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  };

  // Handlers
  const handleClientSelection = (client) => {
    console.log('Cliente selecionado:', client);
    console.log('Projetos do cliente:', client.projects);

    setSelectedClient(client);

    // Adicionar mensagem do usuário ao histórico
    if (onAddMessage) {
      onAddMessage(`👤 ${client.name}`, 'user');
    }

    // Verificar quantos projetos o cliente tem
    if (client.projects && client.projects.length === 1) {
      console.log('Cliente tem 1 projeto, indo para singleProject');
      const projectName = client.projects[0]?.name || 'projeto';
      if (onAddMessage) {
        onAddMessage(`Então estamos trabalhando no projeto "${projectName}", certo?`, 'assistant');
      }
      setStep('singleProject');
    } else if (client.projects && client.projects.length > 1) {
      console.log('Cliente tem múltiplos projetos, indo para multipleProjects');
      if (onAddMessage) {
        onAddMessage('Em qual projeto estamos trabalhando?', 'assistant');
      }
      setStep('multipleProjects');
    } else {
      console.log('Cliente não tem projetos, indo para newClient');
      if (onAddMessage) {
        onAddMessage('Essa pessoa é nova. Ela está dentro de um projeto existente?', 'assistant');
      }
      setStep('newClient');
    }
  };

  const handleAddNewClient = () => {
    const newClient = {
      id: Date.now(),
      name: newClientName,
      projects: [],
      isNew: true
    };

    setSelectedClient(newClient);
    setNewClientName('');
    setShowAddClient(false);
    setStep('newClient');
  };

  const handleProjectConfirm = (project) => {
    // Adicionar confirmação do projeto ao histórico
    if (onAddMessage) {
      const projectName = typeof project === 'string' ? project : project.name;
      onAddMessage(`📁 ${projectName}`, 'user');
    }
    onProjectSelect(selectedClient, project);
  };

  const handleAddNewProject = () => {
    // Adicionar ao histórico que vai criar novo projeto
    if (onAddMessage) {
      onAddMessage('➕ Criar novo projeto', 'user');
    }
    onClientSelect(selectedClient, 'newProject');
  };

  const handleExistingProjectSelect = (project) => {
    // Adicionar projeto selecionado ao histórico
    if (onAddMessage) {
      const projectName = typeof project === 'string' ? project : project.name;
      onAddMessage(`📁 ${projectName}`, 'user');
    }
    // Vincular o novo cliente ao projeto existente
    onProjectSelect(selectedClient, project);
  };

  // Renderização condicional baseada no step
  return (
    <div className="welcome-message">
      <div className="chatbot-container">
        {step === 'clientList' && renderClientList()}
        {step === 'singleProject' && renderSingleProject()}
        {step === 'multipleProjects' && renderMultipleProjects()}
        {step === 'newClient' && renderNewClientProject()}
        {step === 'existingProjectList' && renderExistingProjectList()}
      </div>
    </div>
  );
}

export default WelcomeMessage;