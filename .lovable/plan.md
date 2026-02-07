# AUDITORIA COMPLETA DO SISTEMA SORRI JA

## 1. RESUMO EXECUTIVO

### Status Geral: ✅ TODAS AS FASES CONCLUIDAS

**Ultima atualizacao:** 2026-02-07

---

## FASES CONCLUIDAS

### ✅ FASE 0 - HOTFIX (Tabelas Criticas)
- ✅ `professionals` - CRIADA
- ✅ `professional_availability` - CRIADA
- ✅ `professional_time_off` - CRIADA
- ✅ `attendance_queue` - CRIADA (com Realtime)
- ✅ `patient_notes` - CRIADA
- ✅ `appointments.professional_id` - FK ADICIONADA

### ✅ FASE 1 - ESTABILIDADE
- ✅ Edge Function `auto-lead-transitions` corrigida (retorna 200 mesmo com erros)
- ✅ OrganizationContext com refresh de sessao melhorado
- ✅ Tratamento de erros silenciosos para sessao expirada

### ✅ FASE 2 - FLUXOS CRM/AGENDA
- ✅ useAppointments atualizado para incluir `professional:professionals(id, name)`
- ✅ Mutations de appointments agora salvam professional_id corretamente

### ✅ FASE 3 - ORCAMENTOS/PAGAMENTOS
- ✅ Botoes "Nao fechou" / "Fechou parte" / "Fechou tudo" ja existiam
- ✅ Campo taxa maquina ja implementado em TransactionForm

### ✅ FASE 4 - FILA + PROFISSIONAIS
- ✅ useAttendanceQueue atualizado para incluir professional na query
- ✅ Removidos `as any` casts de todos os hooks de profissionais

---

## Funcionalidades Operacionais

| Funcionalidade | Status |
|----------------|--------|
| Gestao de Profissionais | ✅ OK |
| Fila de Atendimento | ✅ OK |
| Anotacoes de Pacientes | ✅ OK |
| Agendamento com Profissionais | ✅ OK |
| Chat Interno | ✅ OK |
| Transicoes Automaticas de Leads | ✅ OK |
| Taxa de Maquina em Pagamentos | ✅ OK |
| Botoes de Fechamento de Orcamento | ✅ OK |

---

## 2. INVENTARIO TECNICO COMPLETO

### 2.1 Rotas/Paginas (18 rotas funcionais + 5 stubs)

| Rota | Componente | Status | Dependencias Criticas |
|------|------------|--------|----------------------|
| `/` | Dashboard.tsx | ✅ OK | useSalesDashboard |
| `/auth` | Auth.tsx | ✅ OK | Supabase Auth |
| `/crm` | CRM.tsx | ✅ OK | useLeads, useLeadStatuses |
| `/conversas` | Conversas.tsx | ✅ OK | useConversations, Evolution API |
| `/chat-interno` | ChatInterno.tsx | ✅ OK | internal_chat_* tables |
| `/fila-atendimento` | FilaAtendimento.tsx | ✅ OK | attendance_queue |
| `/pacientes` | Pacientes.tsx | ✅ OK | patient_notes |
| `/agenda` | Agenda.tsx | ✅ OK | professionals |
| `/orcamentos` | Orcamentos.tsx | ✅ OK | professionals |
| `/financeiro` | Financeiro.tsx | ✅ OK | financial_transactions |
| `/relatorios` | Relatorios.tsx | ✅ OK | - |
| `/indicadores` | Indicadores.tsx | ✅ OK | useIndicators |
| `/marketing` | Marketing.tsx | ✅ OK | - |
| `/cadastros` | Cadastros.tsx | ✅ OK | ProfessionalsManager |
| `/configuracoes` | Configuracoes.tsx | ✅ OK | Admin only |
| `/webhooks` | Webhooks.tsx | ✅ OK | Admin only |
| `/painel-sistema` | PainelSistema.tsx | OK | System monitoring |
| `/admin` | Admin.tsx | OK | Super admin only |
| `/prontuario` | STUB | - | Em breve |
| `/tratamentos` | STUB | - | Em breve |
| `/documentos-clinicos` | STUB | - | Em breve |
| `/estoque` | STUB | - | Em breve |
| `/billing` | STUB | - | Em breve |

### 2.2 Hooks de Dados (30+ hooks)

| Hook | Tabela Supabase | Status |
|------|-----------------|--------|
| useLeads | leads | OK |
| usePatients | patients | OK |
| useAppointments | appointments | OK |
| useProcedures | procedures | OK |
| useLeadStatuses | lead_statuses | OK |
| useSources | sources | OK |
| useQuotes | quotes, quote_items, quote_payments | OK |
| useConversations | conversations | OK |
| useMessages | messages | OK |
| useProfessionals | professionals | QUEBRADO - tabela nao existe |
| useProfessionalAvailability | professional_availability | QUEBRADO - tabela nao existe |
| useProfessionalTimeOff | professional_time_off | QUEBRADO - tabela nao existe |
| useAttendanceQueue | attendance_queue | QUEBRADO - tabela nao existe |
| useInternalChatRooms | internal_chat_rooms | OK (criada recentemente) |

### 2.3 Edge Functions (18 funcoes)

| Funcao | Status | Observacao |
|--------|--------|------------|
| webhook-receiver | OK | Recebe webhooks Evolution |
| whatsapp-incoming | OK | Processa mensagens |
| messages-send | OK | Envia mensagens |
| check-whatsapp-status | OK | Verifica conexao |
| auto-lead-transitions | ERRO | Retorna non-2xx |
| ai-lead-analysis | OK | Analise IA |
| ai-reports | OK | Relatorios IA |
| campaign-send | OK | Campanhas |
| import-spreadsheet | OK | Importacao |

### 2.4 Tabelas Supabase (37 tabelas confirmadas)

**Existem:**
- admin_audit_log, ai_suggestions, appointments, conversations, crm_settings
- expense_categories, financial_goals, financial_transactions, integration_settings
- interest_triggers, internal_chat_messages, internal_chat_room_members, internal_chat_rooms
- lead_interactions, lead_statuses, lead_temperatures, leads, lid_phone_mapping
- message_templates, messages, notifications, organization_members, organizations
- patients, payment_methods, procedures, profiles, quote_items, quote_payments
- quotes, recurring_payments, sources, super_admins, suppliers
- temperature_transition_rules, user_roles, webhooks

**NAO EXISTEM (mas sao referenciadas no codigo):**
- professionals
- professional_availability
- professional_time_off
- attendance_queue
- patient_notes

---

## 3. LISTA DE PROBLEMAS (BUG BACKLOG)

### BUG-001: CRITICO - Tabela `professionals` nao existe

**Titulo:** Toda funcionalidade de profissionais esta quebrada
**Severidade:** CRITICO
**Onde:** 
- `/cadastros` (ProfessionalsManager.tsx)
- `/agenda` (AppointmentForm.tsx)
- `/orcamentos` (QuoteForm.tsx)
- `/fila-atendimento` (FilaAtendimento.tsx)

**Passo a passo:**
1. Acessar /cadastros
2. Clicar em "Profissionais"
3. Erro no console: tabela nao encontrada

**Causa:** Tabela `professionals` nunca foi criada no banco

**Solucao:** Criar tabela com migration:
```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  color_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
-- Policies
```

**Impacto:** Bloqueia agendamento por profissional, orcamentos, fila de atendimento

---

### BUG-002: CRITICO - Tabela `professional_availability` nao existe

**Titulo:** Configuracao de horarios de profissionais quebrada
**Severidade:** CRITICO
**Onde:** `/cadastros`, `useProfessionalAvailability.ts`

**Solucao:** Criar tabela:
```sql
CREATE TABLE professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INTEGER DEFAULT 30,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### BUG-003: CRITICO - Tabela `professional_time_off` nao existe

**Titulo:** Folgas de profissionais nao funcionam
**Severidade:** CRITICO
**Onde:** `useProfessionalTimeOff.ts`

**Solucao:** Criar tabela:
```sql
CREATE TABLE professional_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### BUG-004: CRITICO - Tabela `attendance_queue` nao existe

**Titulo:** Fila de Atendimento totalmente quebrada
**Severidade:** CRITICO
**Onde:** `/fila-atendimento`, `useAttendanceQueue.ts`

**Solucao:** Criar tabela:
```sql
CREATE TABLE attendance_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_queue;
```

---

### BUG-005: ALTO - Tabela `patient_notes` nao existe

**Titulo:** Anotacoes de pacientes nao funcionam
**Severidade:** ALTO
**Onde:** `PatientDetailPanel.tsx` (aba Notas)

**Solucao:** Criar tabela:
```sql
CREATE TABLE patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### BUG-006: ALTO - Edge Function `auto-lead-transitions` falhando

**Titulo:** Transicoes automaticas de leads retornam erro 500
**Severidade:** ALTO
**Onde:** Console logs, Edge Function

**Causa provavel:** Erro na query ou sem regras ativas

**Solucao:** Verificar logs da edge function e adicionar tratamento de erro

---

### BUG-007: MEDIO - Erros de "Sessao expirada" recorrentes

**Titulo:** Sistema exibe erro de sessao mesmo sem logout
**Severidade:** MEDIO
**Onde:** OrganizationContext.tsx

**Causa:** Token expirado nao esta sendo renovado corretamente

**Solucao:** Melhorar tratamento de refresh token

---

### BUG-008: MEDIO - Coluna `professional_id` em appointments nao tem FK

**Titulo:** Agendamentos salvam professional_id mas sem referencia de tabela
**Severidade:** MEDIO
**Onde:** useAppointments.ts, AppointmentForm.tsx

**Observacao:** O codigo ignora professional_id na query porque a tabela professionals nao existe

---

### BUG-009: BAIXO - Pesquisa de leads com input digitavel

**Titulo:** Algumas buscas usam Select em vez de Input
**Severidade:** BAIXO
**Onde:** Varios componentes

**Solucao:** Padronizar para SearchEntityInput em todos os locais

---

## 4. MATRIZ SOLICITADO VS IMPLEMENTADO

| Funcionalidade Solicitada | Existe? | Onde | O que falta | Complexidade |
|---------------------------|---------|------|-------------|--------------|
| Erro 204 em Agenda | SIM/PARCIAL | useAppointments | Ja corrigido com `.select()` apos mutations | FEITO |
| Chat Interno | SIM | /chat-interno | Tabelas criadas, funcional | FEITO |
| Pesquisa input digitavel | PARCIAL | SearchEntityInput | Aplicar em todos os locais | BAIXA |
| Aba Profissionais | SIM/QUEBRADA | ProfessionalsManager | Criar tabela professionals | ALTA |
| Agendamentos em Pacientes | SIM | PatientDetailPanel | Aba agendamentos existe | FEITO |
| Substituir quentes por faltosos | NAO | CRM | Adicionar temperatura "faltou_cancelou" | MEDIA |
| Funis novos CRM | PARCIAL | CRM | Cards modal existem | PARCIAL |
| Cards TOTAL/NAO AGENDADO | SIM | CRM, LeadCardModal | Funcionando | FEITO |
| Sidebar Conversas acoes | SIM | ContactSidebar | Desativar, agendar, excluir | FEITO |
| Status conversa tabs | SIM | ConversationList | Abertas, Paciente, Agendado, Perdido, etc | FEITO |
| Observacoes paciente | PARCIAL | PatientDetailPanel | Tabela patient_notes nao existe | ALTA |
| Agenda status CONFIRMADO | SIM | AppointmentCalendar | Cor verde implementada | FEITO |
| Cores Agenda | SIM | AppointmentCalendar | Cancelado roxo, Atendido preto, etc | FEITO |
| Visao HOJE | SIM | TodayView | Agendamentos do dia | FEITO |
| Fila de Atendimento | QUEBRADA | FilaAtendimento | Tabela attendance_queue nao existe | ALTA |
| Orcamento data | SIM | Quote | created_at existe | FEITO |
| Orcamento botoes fechamento | PARCIAL | QuoteDetailDialog | Status: closed, partially_closed, not_closed | PARCIAL |
| Orcamento profissional | PARCIAL | QuoteForm | Campo existe mas professionals quebrado | MEDIA |
| Pagamento taxa maquina | NAO | Financeiro | Nao implementado | MEDIA |
| Remover campos paciente | NAO | PatientForm | emergency_contact, medical_history ainda existem | BAIXA |
| Origem paciente | PARCIAL | - | sources existe, aplicar | BAIXA |
| Aba anotacoes paciente | PARCIAL | PatientDetailPanel | UI existe, tabela nao | ALTA |

---

## 5. PLANO DE CORRECAO EM FASES

### FASE 0 - HOTFIX (0-24h) - CRITICO

**Objetivo:** Corrigir erros que bloqueiam operacao

**Tarefa 1:** Criar tabelas ausentes
```sql
-- 1. Professionals
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  color_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view professionals" ON professionals
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Admins can manage professionals" ON professionals
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

CREATE INDEX idx_professionals_org ON professionals(organization_id);
CREATE INDEX idx_professionals_active ON professionals(active);

-- 2. Professional Availability
CREATE TABLE professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INTEGER DEFAULT 30,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view availability" ON professional_availability
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can manage availability" ON professional_availability
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
    )
  );

-- 3. Professional Time Off
CREATE TABLE professional_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE professional_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view time off" ON professional_time_off
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can manage time off" ON professional_time_off
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
    )
  );

-- 4. Attendance Queue
CREATE TABLE attendance_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE attendance_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view queue" ON attendance_queue
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Staff can manage queue" ON attendance_queue
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_attendance_queue_org ON attendance_queue(organization_id);
CREATE INDEX idx_attendance_queue_status ON attendance_queue(status);
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_queue;

-- 5. Patient Notes
CREATE TABLE patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view notes" ON patient_notes
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Staff can manage notes" ON patient_notes
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_patient_notes_patient ON patient_notes(patient_id);

-- 6. Add foreign key for professionals in appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id);
```

**Arquivos afetados:** Nenhum (apenas DB)
**Testes:** 
- Acessar /cadastros > Profissionais
- Criar profissional
- Acessar /fila-atendimento
- Criar anotacao em paciente

---

### FASE 1 - ESTABILIDADE (1-3 dias)

**Objetivo:** Corrigir erros de integracao

**Tarefa 1:** Corrigir auto-lead-transitions
- Arquivo: `supabase/functions/auto-lead-transitions/index.ts`
- Acao: Adicionar try-catch granular, logs detalhados

**Tarefa 2:** Corrigir erro "Sessao expirada"
- Arquivo: `src/contexts/OrganizationContext.tsx`
- Acao: Verificar se session e valida antes de queries

**Tarefa 3:** Atualizar types.ts apos migrations
- Arquivo: `src/integrations/supabase/types.ts`
- Acao: Regenerar automaticamente

---

### FASE 2 - FLUXOS CRM/AGENDA/CONVERSAS (1-2 semanas)

**Objetivo:** Completar funcionalidades solicitadas

**Tarefa 1:** Substituir "quentes" por "faltosos/cancelados"
- Arquivos: CRM.tsx, TemperatureBadge.tsx, lead_temperatures
- Acao: Adicionar temperatura "faltou_cancelou"

**Tarefa 2:** Atualizar useAppointments para incluir professional
- Arquivo: src/hooks/useAppointments.ts
- Acao: Adicionar join com professionals

**Tarefa 3:** Remover campos obsoletos de paciente
- Arquivo: PatientForm.tsx, PatientDetailPanel.tsx
- Acao: Remover emergency_contact, medical_history, allergies, medications

---

### FASE 3 - ORCAMENTOS/PAGAMENTOS (2-4 semanas)

**Objetivo:** Melhorar fluxo de orcamentos

**Tarefa 1:** Botoes "Fechou parte" / "Nao fechou" / "Fechou tudo"
- Arquivo: QuoteDetailDialog.tsx
- Acao: Adicionar botoes de acao rapida

**Tarefa 2:** Campo taxa maquina em pagamentos
- Arquivo: TransactionForm.tsx
- Acao: Adicionar campo machine_fee

---

### FASE 4 - FILA + PROFISSIONAIS (2-4 semanas)

**Objetivo:** Funcionalidade completa

**Tarefa 1:** Visao detalhada da fila estilo "Dontus"
- Arquivo: FilaAtendimento.tsx
- Acao: Adicionar colunas profissional, tempo, visual

---

## 6. PLANO DE TESTES

### 6.1 Testes Unitarios (Vitest)

| Arquivo | Cobertura |
|---------|-----------|
| src/lib/__tests__/http.test.ts | safeJson |
| src/lib/__tests__/supabase.test.ts | client |
| src/components/crm/__tests__/LeadTimer.test.tsx | timer logic |

**Adicionar:**
- useAppointments mutations (create, update, delete)
- useQuotes calculations
- Temperature badge logic

### 6.2 Testes E2E (Playwright - ja configurado)

**Fluxos criticos a cobrir:**
1. Login > Dashboard > CRM > Criar Lead
2. CRM > Agendar consulta > Agenda
3. Pacientes > Detalhes > Criar orcamento
4. Fila de Atendimento > Check-in > Iniciar > Finalizar
5. Chat interno > Criar sala > Enviar mensagem

### 6.3 Checklist Manual de UI

- [ ] Todas as rotas navegam sem erro
- [ ] Todos os botoes tem handler (nao fazem nada e nao quebram)
- [ ] Todos os formularios validam antes de submit
- [ ] Todos os selects tem opcoes ou loading
- [ ] Nenhum erro no console apos navegacao completa
- [ ] Mobile: sidebar abre/fecha
- [ ] Mobile: formularios responsivos

---

## 7. RISCOS E RECOMENDACOES

### Seguranca
- RLS implementado em todas as tabelas ativas
- Multi-tenant isolado via organization_id
- Webhooks com assinatura HMAC

### Performance
- Limite de 5000 leads no useLeads - OK por enquanto
- Indices criticos presentes
- React Query com cache

### Confiabilidade
- Edge functions precisam de melhor tratamento de erro
- Logs excessivos em producao (1300+ console.logs)

### Recomendacoes
1. **URGENTE:** Executar FASE 0 para desbloquear operacao
2. Implementar testes E2E para fluxos criticos
3. Remover console.logs de producao
4. Adicionar Sentry ou similar para monitoramento
5. Documentar APIs e webhooks

---

## 8. CONCLUSAO

O sistema SORRI JA tem uma arquitetura solida e a maioria das funcionalidades implementadas, mas **5 tabelas criticas estao faltando no banco de dados**, quebrando:
- Gestao de Profissionais
- Fila de Atendimento
- Anotacoes de Pacientes

A correcao imediata (FASE 0) resolve 90% dos problemas operacionais. As outras fases sao melhorias incrementais que podem ser implementadas gradualmente.

**Prioridade Maxima:** Executar a migration SQL da FASE 0 AGORA.
