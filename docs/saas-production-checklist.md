# Checklist de produção SaaS (multi-organizações)

## Segurança e isolamento de dados
- [ ] Todas as tabelas de domínio com `organization_id`
- [ ] RLS aplicado e testado para todos os módulos
- [ ] Funções com `SECURITY DEFINER` revisadas

## Autenticação e autorização
- [ ] Matriz de permissões por papel definida
- [ ] Papéis completos refletidos no frontend
- [ ] Auditoria de acesso a dados sensíveis

## Billing e governança
- [ ] Planos e limites definidos
- [ ] Cobrança recorrente integrada
- [ ] Bloqueio automático por inadimplência

## Observabilidade e operação
- [ ] Monitoramento de Edge Functions
- [ ] Alertas de falhas de integração
- [ ] Logs centralizados e métricas

## Continuidade e compliance
- [ ] Backups automáticos
- [ ] Política de retenção e recuperação
- [ ] LGPD: consentimentos, exportação e anonimização
