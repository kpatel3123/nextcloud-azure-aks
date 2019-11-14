#!/usr/bin/env bash

set -e
set -u

OUTFILE="./generated/setup_newrelic.sh"

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME=$(basename "${SCRIPT_PATH}")
SCRIPT_DIR="$( cd "$( dirname "${SCRIPT_PATH}" )" >/dev/null 2>&1 && pwd )"

cd "${SCRIPT_DIR}"

source '../../config.env'

mkdir -p ./generated

{
    cat <<END
#!/usr/bin/env sh

# This file was generated by "${SCRIPT_NAME}". DO NOT EDIT.

set -e
set -u

END

    if [[ "${NEW_RELIC_AGENT_URL:-}" != "" && \
          "${NEW_RELIC_KEY:-}" != "" && \
          "${NEW_RELIC_APP:-}" != "" ]]; then
        cat <<END
NEW_RELIC_AGENT_URL=\$(
    if [ -f "/etc/alpine-release" ]; then
        # Alpine Linux requires a special New Relic binary.
        echo "${NEW_RELIC_AGENT_URL}" | sed 's/-linux\.tar/-linux-musl\.tar/'
    else
        echo "${NEW_RELIC_AGENT_URL}"
    fi
)

echo "Downloading and unpacking NR binary from '\${NEW_RELIC_AGENT_URL}'..." >&2
curl -L "\${NEW_RELIC_AGENT_URL}" | tar -C /tmp -zx

export NR_INSTALL_USE_CP_NOT_LN=1
export NR_INSTALL_SILENT=1

/tmp/newrelic-php5-*/newrelic-install install
rm -rf /tmp/newrelic-php5-* /tmp/nrinstall*

sed -i -e 's/\"REPLACE_WITH_REAL_KEY\"/\"${NEW_RELIC_KEY}\"/' \\
    -e 's/newrelic.appname = \"PHP Application\"/newrelic.appname = \"${NEW_RELIC_APP}\"/' \\
    /usr/local/etc/php/conf.d/newrelic.ini
END
    else
        echo "# New Relic Monitoring disabled in config.env"
    fi
} > "${OUTFILE}"
