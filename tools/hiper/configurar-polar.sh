#!/bin/zsh
# Configura a integração Polar do app (rodar UMA vez, depois de criar o cliente em admin.polaraccesslink.com).
# Uso: ./configurar-polar.sh <CLIENT_ID> <CLIENT_SECRET>
set -euo pipefail
ID="${1:-}"; SECRET="${2:-}"
if [[ -z "$ID" || -z "$SECRET" || "$ID" == COLE_* || "$SECRET" == COLE_* ]]; then
  echo "Use os códigos reais da aba Credentials: ./configurar-polar.sh <CLIENT_ID> <CLIENT_SECRET>"; exit 1
fi
RG=rg-treinos-pessoal; APP=swa-treinos-jn
HOST=$(az staticwebapp show -n $APP -g $RG --query defaultHostname -o tsv)
# 1) webhook de EXERCISE → recebe a chave de assinatura
RESP=$(curl -s -X POST https://www.polaraccesslink.com/v3/webhooks \
  -u "$ID:$SECRET" -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d "{\"events\":[\"EXERCISE\"],\"url\":\"https://$HOST/api/polar-webhook\"}")
KEY=$(print -r -- "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print((d.get("data") or d).get("signature_secret_key",""))' 2>/dev/null || true)
if [[ "$RESP" == *"401"* ]]; then echo "A Polar recusou o Client ID/Secret (401). Confira os códigos e rode de novo. Nada foi gravado."; exit 1; fi
[[ -z "$KEY" ]] && echo "Aviso: webhook não criado (resposta: $RESP). O botão 'Buscar na Polar' continua funcionando."
# 2) segredos no app (ficam só na Azure, nunca no código)
az staticwebapp appsettings set -n $APP -g $RG --setting-names \
  "POLAR_CLIENT_ID=$ID" "POLAR_CLIENT_SECRET=$SECRET" ${KEY:+"POLAR_WEBHOOK_SECRET=$KEY"} -o none
echo "Pronto. Agora abra o app → Ajustes → Conectar conta Polar."
