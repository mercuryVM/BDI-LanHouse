# BDI-Backend

Sistema de gerenciamento de lan house com backend em Node.js e frontend em React/Electron.

Desenvolvido por:

 Alan Moura – 15436668  
 Arthur Hernandes – 15552518  
 Felipe Ferreira – 15494604  
 Gabriel Luis – 15494841  
 Isabela Morija – 14579951  

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 20 ou superior)
- **PostgreSQL** (versão 17.6 ou superior)
- **npm** ou **yarn** (gerenciador de pacotes)

## Configuração Inicial

### 1. Configurar o Banco de Dados

Crie um arquivo `.env` na pasta `api/` com a seguinte configuração:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
PORT=8080
```

Substitua `usuario`, `senha` e `nome_do_banco` pelas suas credenciais do PostgreSQL.

### 2. Instalar Dependências

Abra dois terminais e navegue até as pastas correspondentes:

**Terminal 1 - Backend (API):**
```bash
cd api
npm install
```

**Terminal 2 - Frontend (App):**
```bash
cd app
npm install
```

## Executando o Projeto

Mantenha os dois terminais abertos e execute:

**Terminal 1 - Backend:**
```bash
cd api
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd app
npm run dev
```

O backend estará rodando e o frontend abrirá automaticamente.

## Credenciais de Acesso

### Usuário Comum
- **Username:** `alan123`
- **Senha:** `123`

### Administrador
- **CPF:** `111.111.111-11`
- **Senha:** `123`

## Estrutura do Projeto

```
BDI-Backend/
├── api/          # Backend Node.js + Express
│   ├── src/      # Código fonte da API
│   └── scripts/  # Scripts utilitários
└── app/          # Frontend React + Electron
    └── src/      # Código fonte do frontend
```

## Tecnologias Utilizadas

- **Backend:** Node.js, Express
- **Frontend:** React, TypeScript, Electron, Vite
- **Banco de Dados:** PostgreSQL

---

Desenvolvido para a disciplina de Banco de Dados I - EACH/USP
