# Restricted synthetic fixture runner

This image is a separate, non-root container entrypoint for the fixed demo fixture protocol.
It accepts only JSON with `case_ids` from the curated allowlist and `defense_mode` set
to `off` or `on`. It does not execute submitted code, start a shell, load external targets,
or access secrets.

## Build and run locally

Build from this directory:

```sh
docker build -t ai-arena-runner:phase4 .
printf '%s' '{"case_ids":["BASE-PINJ-001"],"defense_mode":"on"}' | docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 32 --memory 128m --cpus 0.5 --tmpfs /tmp:rw,noexec,nosuid,size=16m ai-arena-runner:phase4
```

Expected output is JSON with the accepted case ID and defense mode. Unknown fields, case IDs,
malformed JSON, and invalid defense modes are rejected.

## Required launch constraints

The operator must apply `--network none`, `--read-only`, `--cap-drop ALL`,
`--security-opt no-new-privileges`, `--pids-limit`, `--memory`, and `--cpus`.
Do not mount the Docker socket, host directories, credential files, or production secrets.
No fixture volume is required because the allowlist is built into the image.

## Boundary and limitations

- The existing API has not yet been wired to dispatch runs through this container. The API
  still performs the deterministic synthetic fixture evaluation in-process.
- This protocol is not an arbitrary-code sandbox: it intentionally does not execute user
  prompts or scripts.
- Docker shares the host kernel and is defense-in-depth, not a guarantee of perfect isolation.
- Build/run commands and restrictions must be verified on the target Docker host before
  claiming runtime isolation has passed.
