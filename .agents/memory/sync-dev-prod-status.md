---
name: Sync DEV→PROD status
description: Estado da sincronização entre bancos DEV e PROD — bloqueado aguardando redeploy; tudo preparado para execução pós-deploy.
---

# Sync DEV→PROD — Pré-Deploy Concluído

## O que já foi feito (DEV-side, concluído)
- 5 competitions de PROD inseridas no DEV (IDs 7,9,10,11,13)
- 12 managers de PROD inseridos no DEV (IDs 1,6,7,8,9,11,12,13,15,16,17,18)
- DEV estado: 15 competitions, 80 managers, 1051 partidas

## O que falta (PROD-side — aguardando redeploy)
O servidor de produção está rodando com ADMIN_PASSWORD antiga; após redeploy com ADMIN_PASSWORD="1995", executar:

### Endpoint principal pós-deploy
`POST https://csa-stats-hub.replit.app/api/admin/sync/apply`
com Bearer token obtido via `POST /api/admin/login {"password":"1995"}`

### Payload completo em /tmp/sync_payload.json (se sessão viva)
Ou recomputar a partir de:
- globalThis.syncPayload (se sessão CodeExecution ainda ativa)

### O que o payload contém
- `competitions_upsert`: 3 (type corrections: IDs 12,14,15)
- `opponents_update`: 16 (-AL name corrections)
- `opponents_insert`: 6 (novos para temporada 2000: Poções-BA, Nacional-AM, São Raimundo-AM, Desportiva-ES, Anapolina-GO, Bandeirante-DF)
- `static_opponent_map`: remap DEV 129-151 → PROD 156-178
- `managers_upsert`: 68 (todos os managers DEV → PROD)
- `players_upsert`: 8 (históricos: Ênio Oliveira, Rommel, Dentinho, Gilmar, Peu, Almir Explosão, Hélio Sururu, Zé Carlos Baiano)
- `pss_upsert`: 9 (entradas histórico para jogadores acima + Jorge Siri)
- `matches_insert`: 57 (50 de 2000 + 3 de 2015 + 4 de 2014)

### Correção adicional necessária (não inclusa no payload original)
Após sync/apply, também renomear PROD opp 170 "Chapel" → "Chapel-AL" via:
`PUT /api/admin/opponents/170 {"name":"Chapel-AL"}`

**Why:** PROD 170 = "Chapel" mas DEV opp 143 = "Chapel-AL". O import de matches já vai criar "Chapel-AL" como novo opponent (name-based). Ainda deve-se depois excluir o "Chapel" (170) se não houver partidas vinculadas, ou fazer merge.

## Validação pós-sync esperada
- PROD matches: ~1057 (1000 + 57 novos)
- PROD competitions: 15
- PROD managers: 80
- PROD players: ~468
- PROD opponents: ~151+ (novos criados)

## Sequência de comandos pós-deploy

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://csa-stats-hub.replit.app/api/admin/login \
  -H "Content-Type: application/json" -d '{"password":"1995"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Sync apply (com payload em /tmp/sync_payload.json)
curl -s -X POST https://csa-stats-hub.replit.app/api/admin/sync/apply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data-binary @/tmp/sync_payload.json

# 3. Fix Chapel
curl -s -X PUT https://csa-stats-hub.replit.app/api/admin/opponents/170 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Chapel-AL"}'

# 4. Import matches CSV (alternativa se sync/apply não funcionar pós-deploy)
# Usar /tmp/matches_import.csv com POST /api/admin/import/matches
```
