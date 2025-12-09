# EYXO.IA Front-end

Interface para o assistente de briefing da EYXO.IA, que permite processar documentos, conectar com Google Drive e gerar briefings inteligentes automatizados.

## Visão Geral

O EYXO.IA é uma aplicação web que permite aos usuários:

- Processar documentos (PDFs, textos, áudios) para extrair informações
- Conectar-se ao Google Drive para acessar arquivos
- Sincronizar dados e memória de projetos
- Gerar briefings automatizados com base em inteligência artificial

## Requisitos

- Node.js 18.x ou superior
- NPM 9.x ou superior (ou Yarn 1.22.x ou superior)

## Gerenciamento de Pacotes

Este projeto suporta tanto **npm** quanto **yarn** para o gerenciamento de pacotes. Todos os comandos deste README incluem instruções para ambos os gerenciadores. Use aquele com o qual você está mais confortável.

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/Odd-Group/eyxo-ai-front.git
cd eyxo-ai-front
npm install
# ou usando yarn
yarn install
```

## Scripts Disponíveis

No diretório do projeto, você pode executar:

### `npm start` ou `yarn start`

Executa a aplicação em modo de desenvolvimento.<br />
Abra [http://localhost:3000](http://localhost:3000) para visualizar no navegador.

A página será recarregada automaticamente quando você fizer alterações no código.<br />
Você também verá quaisquer erros de lint no console.

### `npm test` ou `yarn test`

Inicia o executor de testes no modo interativo de observação.<br />
Veja a seção sobre [execução de testes](https://facebook.github.io/create-react-app/docs/running-tests) para mais informações.

### `npm run build` ou `yarn build`

Compila a aplicação para produção na pasta `build`.<br />
Agrupa corretamente o React no modo de produção e otimiza a compilação para obter o melhor desempenho.

## Principais Funcionalidades

### Conectar ao Google Drive
Permite aos usuários autenticar e conectar suas contas do Google Drive para acessar documentos e pastas.

### Configuração de Pasta de Projeto
Os usuários podem selecionar uma pasta específica do Google Drive para sincronizar com o projeto.

### Sincronização de Memória
Sincroniza informações dos documentos armazenados no Google Drive com a memória do projeto.

### Processamento de Arquivos
Upload e processamento de arquivos locais para extração de informações.

### Geração de Briefings
Cria briefings automatizados baseados nas informações extraídas dos documentos.

## Licença

Este projeto é propriedade da Odd Group e seu uso é restrito conforme os termos estabelecidos pela empresa.
