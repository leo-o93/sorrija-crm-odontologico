# SORRI JÁ - Sistema de CRM para Clínicas Odontológicas

Sistema integrado de CRM, gestão de pacientes e comunicação via WhatsApp desenvolvido especialmente para clínicas odontológicas.

## 🎯 Visão Geral

O SORRI JÁ é uma plataforma completa que integra:
- **CRM com Kanban** - Funil de vendas visual com arrastar e soltar
- **Inbox WhatsApp** - Conversas em tempo real via Evolution API
- **Gestão de Pacientes** - Cadastro completo com histórico
- **Agenda** - Agendamento de consultas e procedimentos
- **Orçamentos** - Criação e acompanhamento de orçamentos
- **Financeiro** - Controle de contas a pagar e receber
- **Relatórios com IA** - Análises inteligentes e recomendações
- **Multi-tenant** - Suporte a múltiplas organizações

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Estado | TanStack Query (React Query) |
| Backend | Lovable Cloud (Supabase) |
| Auth | Supabase Auth |
| WhatsApp | Evolution API |
| IA | Lovable AI (Gemini/GPT) |
| Drag & Drop | @dnd-kit |

## 📁 Arquitetura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── layout/         # Header, Sidebar, etc.
│   ├── crm/            # Componentes do CRM
│   ├── inbox/          # Componentes do Inbox
│   ├── cadastros/      # Formulários de cadastro
│   └── ...
├── contexts/           # Contextos React (Auth, Org)
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
├── lib/                # Utilitários
├── test/               # Configuração de testes
└── integrations/       # Integrações (Supabase)

supabase/
└── functions/          # Edge Functions
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- npm ou bun

### Passos

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse http://localhost:8080
```

### Variáveis de Ambiente

O projeto utiliza Lovable Cloud, que configura automaticamente:
- `VITE_SUPABASE_URL` - URL do backend
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Chave pública
- `VITE_SUPABASE_PROJECT_ID` - ID do projeto

## 📱 Módulos do Sistema

### CRM (`/crm`)
- Kanban com drag-and-drop entre colunas
- Filtros por temperatura (Novo, Quente, Frio, Perdido)
- Timer visual de última interação
- Importação de leads via Excel
- Detalhamento completo do lead

### Conversas (`/conversas`)
- Inbox unificado do WhatsApp
- Mensagens em tempo real
- Visualização de mídia
- Agendamento rápido

### Pacientes (`/pacientes`)
- Cadastro completo de pacientes
- Conversão de leads em pacientes
- Histórico de atendimentos

### Agenda (`/agenda`)
- Calendário de agendamentos
- Visualização por dia/semana/mês
- Status de confirmação

### Orçamentos (`/orcamentos`)
- Criação de orçamentos
- Itens e procedimentos
- Acompanhamento de aprovação

### Financeiro (`/financeiro`)
- Contas a pagar
- Contas a receber
- Fluxo de caixa
- Pagamentos recorrentes

### Relatórios (`/relatorios`, `/relatorios-ia`)
- Relatórios operacionais
- Análises com IA
- Recomendações automáticas

### Cadastros (`/cadastros`)
- Procedimentos
- Origens de leads
- Status de leads
- Templates de mensagem
- Gatilhos de interesse
- Regras de temperatura

### Configurações (`/configuracoes`)
- Configurações gerais
- Gerenciamento de usuários
- Integração WhatsApp

## 👥 Roles e Permissões

| Role | Descrição | Acesso |
|------|-----------|--------|
| **Super Admin** | Administrador global | Todas as organizações, painel admin |
| **admin** | Administrador da organização | Financeiro, Configurações, Webhooks |
| **usuario** | Usuário operacional | CRM, Conversas, Pacientes, Agenda, Orçamentos |

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Executar com watch mode
npm run test:watch

# Executar uma única vez
npm run test:run

# Ver cobertura
npm run test:coverage
```

### Estrutura de Testes

```
src/
├── lib/__tests__/
│   └── supabase.test.ts      # Testes de utilitários
├── components/crm/__tests__/
│   └── LeadTimer.test.tsx    # Testes do LeadTimer
└── test/
    └── setup.ts              # Setup global
```

## 🔒 Segurança

- **RLS (Row Level Security)** em todas as tabelas
- **Multi-tenant** com isolamento por organização
- **Roles** armazenados em tabela separada
- **CORS** configurado para origens permitidas

### Políticas RLS Principais

- Usuários só acessam dados da sua organização
- Função `has_operational_role()` valida permissões
- Super admins têm acesso global via `is_super_admin()`

## 📦 Deploy

O deploy é realizado automaticamente via Lovable:

1. Acesse o projeto no Lovable
2. Clique em **Share → Publish**
3. Aguarde o build e deploy

## 🔧 Edge Functions

| Função | Descrição |
|--------|-----------|
| `webhook-receiver` | Recebe webhooks do Evolution API |
| `whatsapp-incoming` | Processa mensagens recebidas |
| `messages-send` | Envia mensagens via WhatsApp |
| `sync-whatsapp-contacts` | Sincroniza contatos |
| `ai-lead-analysis` | Análise de leads com IA |
| `ai-reports` | Geração de relatórios com IA |

## 📋 Checklist de Validação

Consulte o arquivo [CHECKLIST.md](./CHECKLIST.md) para validação manual completa do sistema.

## 🧭 Plano de evolução

- [Plano de ação por fases](./docs/action-plan.md)
- [Checklist de produção SaaS](./docs/saas-production-checklist.md)

## 🤝 Contribuição

1. Crie uma branch para sua feature
2. Faça commits claros e concisos
3. Abra um Pull Request
4. Aguarde revisão

## 📄 Licença

Projeto proprietário - Todos os direitos reservados.

---

Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)
