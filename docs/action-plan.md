# Plano de ação por fases (CRM Odontológico + SaaS multi-organizações)

Este plano foi elaborado a partir da análise técnica do repositório e organiza as correções, melhorias e novas implementações em fases executáveis. O objetivo é evoluir o CRM para um produto completo para clínicas odontológicas e pronto para operação como SaaS multi-organizações.

## Fase 0 — Alinhamento e governança
- **Definir escopo clínico**: lista final de funcionalidades clínicas (prontuário, odontograma, anamnese, prescrições, documentos, imagens). 
- **Modelos de negócio**: planos SaaS, limites por organização (usuários, volume de mensagens, instâncias WhatsApp, armazenamento).
- **Regras de acesso**: matriz de permissões por papel (admin, gerente, recepção, comercial, clínico, financeiro).
- **Políticas LGPD**: consentimentos, retenção, anonimização e exportação de dados.

## Fase 1 — Correções críticas (segurança e multi-tenant)
- **Normalizar papéis no frontend**: refletir todos os papéis existentes no banco (ex.: recepção, gerente, comercial) e não apenas admin/usuario. 
- **Onboarding controlado de organizações**: remover criação automática de organização via `integration_settings` e criar fluxo explícito de onboarding.
- **Persistência da organização atual**: salvar seleção no backend (por usuário) para reduzir dependência de `localStorage`.
- **Cobertura total de RLS**: revisar tabelas novas/adicionais e garantir `organization_id` + políticas consistentes.

## Fase 2 — Módulos clínicos essenciais
- **Prontuário odontológico**
  - Anamnese estruturada
  - Evolução clínica por consulta
  - Diagnóstico e plano de tratamento
  - Odontograma interativo
- **Documentos e consentimentos**
  - Termos LGPD, autorização de imagem e consentimento clínico
  - Assinatura digital e trilha de auditoria
- **Imagens e anexos clínicos**
  - Upload e versionamento de exames, raio‑x e fotos

## Fase 3 — Operação clínica e financeira integrada
- **Plano de tratamento conectado ao financeiro**
  - Itens executados x pendentes
  - Parcelas e cobrança automática
- **Agenda clínica avançada**
  - Bloqueios por profissional
  - Confirmação automática e lembretes
  - Teleatendimento (quando aplicável)
- **Gestão de estoque e materiais**
  - Materiais por procedimento
  - Alertas de reposição

## Fase 4 — SaaS multi‑organizações (produção)
- **Billing e planos**
  - Cobrança recorrente por organização
  - Limites de uso e bloqueio automático
- **Auditoria operacional**
  - Log de alterações clínicas e financeiras por usuário
- **Observabilidade e resiliência**
  - Monitoramento de Edge Functions
  - Alertas de falhas de integração WhatsApp
- **Backups e DR (disaster recovery)**
  - Política de backup e restauração por organização

## Fase 5 — Inteligência e diferenciais
- **IA clínica e comercial**
  - Sugestão de follow‑ups e condutas
  - Prognóstico de conversão por lead
- **Relatórios avançados**
  - DRE por clínica
  - KPIs por profissional e por procedimento

---

> Resultado esperado: CRM odontológico completo com prontuário clínico, operação integrada e governança SaaS multi‑organizações pronta para escala.
