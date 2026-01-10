# SORRI JÁ - Checklist de Validação Manual

Este documento contém os testes manuais necessários para validar o funcionamento completo do sistema.

## 📋 Instruções

- [ ] Marque cada item conforme for testado
- [ ] Anote problemas encontrados na seção de observações
- [ ] Execute os testes em ordem para cada módulo

---

## 1. Autenticação

### 1.1 Login
- [ ] Acessar página de login
- [ ] Login com email/senha válidos
- [ ] Login com email inválido (deve mostrar erro)
- [ ] Login com senha incorreta (deve mostrar erro)
- [ ] Login com senha muito curta (< 8 caracteres)

### 1.2 Cadastro
- [ ] Criar nova conta com email válido
- [ ] Senha deve ter mínimo 8 caracteres, 1 letra e 1 número
- [ ] Email já cadastrado deve mostrar erro

### 1.3 Logout
- [ ] Botão de logout funciona
- [ ] Após logout, redireciona para login
- [ ] Não consegue acessar páginas protegidas após logout

### 1.4 Reset de Senha
- [ ] Solicitar reset de senha
- [ ] Email de reset é enviado

---

## 2. CRM - Kanban

### 2.1 Visualização
- [ ] Página carrega corretamente
- [ ] Colunas do Kanban aparecem conforme cadastro
- [ ] Leads aparecem nas colunas corretas
- [ ] Timer de última interação funciona
- [ ] Badge de temperatura é exibido

### 2.2 Drag & Drop
- [ ] Arrastar lead de uma coluna para outra
- [ ] Arrastar lead para coluna vazia
- [ ] Arrastar lead sobre outro lead (muda para coluna do destino)
- [ ] Status é atualizado no banco após arrastar

### 2.3 Novo Lead
- [ ] Abrir modal de novo lead
- [ ] Preencher campos obrigatórios
- [ ] Salvar lead com sucesso
- [ ] Lead aparece na coluna correta

### 2.4 Detalhes do Lead
- [ ] Clicar em "Detalhes" abre painel
- [ ] Informações do lead são exibidas
- [ ] Histórico de interações aparece
- [ ] Botão de fechar funciona

### 2.5 Importação Excel
- [ ] Botão de importar está visível
- [ ] Upload de arquivo Excel funciona
- [ ] Preview dos dados é exibido
- [ ] Importação cria leads corretamente
- [ ] Datas são parseadas corretamente (formato BR e Excel)

### 2.6 Filtros
- [ ] Busca por nome funciona
- [ ] Busca por telefone funciona
- [ ] Filtro por temperatura funciona
- [ ] Filtro "Em conversa" mostra apenas leads quentes em conversa
- [ ] Filtro "Agendado" mostra apenas leads com agendamento

---

## 3. Conversas (Inbox WhatsApp)

### 3.1 Listagem
- [ ] Lista de conversas carrega
- [ ] Ordenação por última mensagem
- [ ] Badge de não lidas funciona
- [ ] Busca por nome/telefone funciona

### 3.2 Chat
- [ ] Selecionar conversa exibe mensagens
- [ ] Mensagens ordenadas cronologicamente
- [ ] Mensagens enviadas à direita
- [ ] Mensagens recebidas à esquerda

### 3.3 Envio de Mensagens
- [ ] Campo de texto funciona
- [ ] Botão enviar funciona
- [ ] Mensagem aparece na conversa
- [ ] Timestamp é exibido

### 3.4 Mídia
- [ ] Imagens são exibidas
- [ ] Mídia expirada mostra mensagem amigável
- [ ] Download de mídia funciona

---

## 4. Pacientes

### 4.1 Listagem
- [ ] Lista de pacientes carrega
- [ ] Busca funciona
- [ ] Paginação funciona

### 4.2 CRUD
- [ ] Criar novo paciente
- [ ] Editar paciente existente
- [ ] Visualizar detalhes
- [ ] Excluir paciente (com confirmação)

### 4.3 Conversão
- [ ] Converter lead em paciente
- [ ] Dados são preenchidos automaticamente

---

## 5. Agenda

### 5.1 Visualização
- [ ] Calendário carrega
- [ ] Agendamentos são exibidos
- [ ] Navegação entre meses funciona

### 5.2 CRUD
- [ ] Criar novo agendamento
- [ ] Editar agendamento
- [ ] Excluir agendamento
- [ ] Alterar status

---

## 6. Orçamentos

### 6.1 Listagem
- [ ] Lista de orçamentos carrega
- [ ] Filtros funcionam
- [ ] Status é exibido corretamente

### 6.2 CRUD
- [ ] Criar novo orçamento
- [ ] Adicionar itens/procedimentos
- [ ] Calcular total automaticamente
- [ ] Aprovar/rejeitar orçamento

---

## 7. Financeiro (Admin)

### 7.1 Acesso
- [ ] Usuário admin consegue acessar
- [ ] Usuário comum NÃO consegue acessar

### 7.2 Contas a Pagar
- [ ] Listagem funciona
- [ ] Criar nova conta
- [ ] Marcar como pago

### 7.3 Contas a Receber
- [ ] Listagem funciona
- [ ] Criar nova conta
- [ ] Marcar como recebido

### 7.4 Fluxo de Caixa
- [ ] Gráfico é exibido
- [ ] Projeção funciona

---

## 8. Busca Global

### 8.1 Funcionalidade
- [ ] Campo de busca no header funciona
- [ ] Debounce de 300ms funciona
- [ ] Resultados de leads aparecem
- [ ] Resultados de pacientes aparecem
- [ ] Resultados de conversas aparecem
- [ ] Clicar em resultado navega corretamente

---

## 9. Configurações

### 9.1 Botão Settings
- [ ] Ícone de engrenagem no header navega para /configuracoes

### 9.2 Configurações Gerais
- [ ] Editar configurações da organização

### 9.3 Usuários
- [ ] Listar usuários da organização
- [ ] Alterar role de usuário
- [ ] Ativar/desativar usuário

### 9.4 WhatsApp
- [ ] Status da conexão é exibido
- [ ] QR Code para conexão (quando aplicável)

---

## 10. Multi-tenant / Isolamento

### 10.1 Dados
- [ ] Organização A não vê dados da Organização B
- [ ] Leads são filtrados por organização
- [ ] Conversas são filtradas por organização
- [ ] Pacientes são filtrados por organização

### 10.2 Troca de Organização
- [ ] Super admin pode trocar de organização
- [ ] Usuário comum NÃO pode trocar de organização
- [ ] Após trocar, dados são atualizados

---

## 11. Performance

### 11.1 Carregamento
- [ ] Páginas carregam em < 3 segundos
- [ ] Skeletons são exibidos durante loading
- [ ] Não há erros no console

### 11.2 Responsividade
- [ ] Funciona em desktop (1920px)
- [ ] Funciona em tablet (768px)
- [ ] Funciona em mobile (375px)

---

## 12. Testes Automatizados

### 12.1 Execução
```bash
npm run test:run
```
- [ ] Todos os testes passam
- [ ] Sem erros de tipagem

### 12.2 Cobertura
```bash
npm run test:coverage
```
- [ ] Cobertura mínima de 70% nos utilitários

---

## 📝 Observações

| Data | Testador | Problema | Módulo | Status |
|------|----------|----------|--------|--------|
| | | | | |
| | | | | |
| | | | | |

---

## ✅ Aprovação Final

| Item | Status | Assinatura |
|------|--------|------------|
| Todos os testes manuais passaram | [ ] | |
| Testes automatizados passaram | [ ] | |
| Sem bugs críticos | [ ] | |
| Performance aceitável | [ ] | |

**Data de Validação**: _______________

**Aprovado por**: _______________
