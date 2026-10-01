#!/usr/bin/env bash
# Experimento de skill: el mismo prompt, corrido sin skills y con la skill, en carpetas vacías.
#   tools/experimentos/correr.sh <id> <nombre-de-la-skill> [carpeta-de-la-skill-si-no-está-instalada]
# Lee tools/experimentos/<id>/prompt.txt y copia tools/experimentos/<id>/entrada/* a las dos carpetas.
# Deja todo en $EXP_DIR/<id>/{sin,con} + sin.json/con.json (métricas de Claude Code). Publicar con publicar.py.
set -euo pipefail
ID="$1"; SKILL="$2"; SRC="${3:-}"
AQUI="$(cd "$(dirname "$0")" && pwd)"; BASE="${EXP_DIR:-/tmp/experimentos}/$ID"
rm -rf "$BASE"; mkdir -p "$BASE/sin" "$BASE/con"
[ -d "$AQUI/$ID/entrada" ] && cp -r "$AQUI/$ID/entrada/." "$BASE/sin/" && cp -r "$AQUI/$ID/entrada/." "$BASE/con/"
# La skill se copia solo dentro de la carpeta "con" (no se instala en el Claude del usuario).
# Si SRC es una colección (sin SKILL.md arriba), se copian todas sus skills.
if [ -n "$SRC" ]; then
  mkdir -p "$BASE/con/.claude/skills"
  if [ -f "$SRC/SKILL.md" ]; then cp -r "$SRC" "$BASE/con/.claude/skills/$SKILL"
  else find "$SRC" -name SKILL.md -printf '%h\n' | while read -r d; do cp -r "$d" "$BASE/con/.claude/skills/"; done; fi
fi
PROMPT="$(cat "$AQUI/$ID/prompt.txt")"
( cd "$BASE/sin" && claude -p "$PROMPT" --model "${MODELO:-claude-sonnet-5-5}" --disable-slash-commands --permission-mode bypassPermissions --output-format json > "$BASE/sin.json" 2> "$BASE/sin.err" ) &
( cd "$BASE/con" && claude -p "$PROMPT ${SUFIJO:-Usá la skill $SKILL.}" --model "${MODELO:-claude-sonnet-5-5}" --permission-mode bypassPermissions --output-format json > "$BASE/con.json" 2> "$BASE/con.err" ) &
wait
echo "listo: $BASE"
