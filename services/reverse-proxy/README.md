# Reverse proxy and HTTPS

Caddy is VIGIL's only public entry point. It publishes container port 443 as `${HTTPS_PORT:-8443}` on the host, serves the frontend, and sends `/api/*` and `/otlp/*` to the WAF.

VIGIL is self-hosted: every certificate comes from Caddy's own local certificate authority (`tls internal`). There is no public certificate issuance.

## Served names

The `Caddyfile` serves these names, all signed by the local CA:

| Name | Used by |
|---|---|
| `localhost` | the browser on the same machine |
| `vigil.localhost` | services in Docker containers on the same machine, with `extra_hosts: ["vigil.localhost:host-gateway"]` |
| `host.docker.internal` | services in Docker containers, where Docker Desktop resolves this name to the host |

The API's `TlsConfigService` accepts exactly these names in the onboarding wizard. To support another local name, add it to the site line in the `Caddyfile` and to `TlsConfigService.LOCAL_HOSTS`.

## Wizard endpoint

- `GET /config/tls/ca` downloads the local CA's public certificate as `vigil-ca.crt`. The WAF's nginx serves it straight from the read-only `caddy_public_ca` volume, which only ever holds `root.crt`, never a private key. It needs no login: the root certificate is public by nature.

## Public CA export

On first start, Caddy creates its local CA in the `caddy_data` volume. `entrypoint.sh` copies only the public root certificate to the `caddy_public_ca` volume, which the API mounts read-only to serve the download. Keep `caddy_data` between restarts: deleting it creates a new CA, and every producer must then download the new certificate.
