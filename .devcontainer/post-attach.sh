#!/usr/bin/env bash

set -euo pipefail

mkdir -p "${HOME}/.local/bin"

cat > "${HOME}/.local/bin/codex" <<'EOF'
#!/usr/bin/env bash

set -euo pipefail

extension_roots=(
  "${HOME}/.vscode-server/extensions"
  "${HOME}/.vscode/extensions"
  "${HOME}/.openvscode-server/extensions"
)

for root in "${extension_roots[@]}"; do
  [ -d "${root}" ] || continue

  selected=""
  for candidate in "${root}"/openai.chatgpt-*/bin/*/codex; do
    [ -x "${candidate}" ] || continue
    selected="${candidate}"
  done

  if [ -n "${selected}" ]; then
    exec "${selected}" "$@"
  fi
done

echo "Codex CLI is not installed in this dev container yet." >&2
echo "Reconnect after the OpenAI ChatGPT extension finishes installing." >&2
exit 1
EOF

chmod +x "${HOME}/.local/bin/codex"

./bin/entry_point.sh
