# Original verifier only; build from case package root.
FROM ghcr.io/arcadia-1/analog-arena-sky130-tools@sha256:668783dd8cbcd5ebce5264785803ce73a9466e79dbe4c98cdf4566348a33437a
WORKDIR /app
COPY researcher/original/tests/test.sh /tests/test.sh
COPY researcher/original/tests/verify.py researcher/original/tests/utils.py /app/analog_arena_tests/
COPY researcher/original/tests/benches /app/analog_arena_tests/benches
RUN chmod +x /tests/test.sh
ENTRYPOINT ["/bin/sh", "/tests/test.sh"]
