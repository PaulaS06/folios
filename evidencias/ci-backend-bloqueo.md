# CI del backend · Bloqueo externo de la cuenta de GitHub

**Fecha:** 2026-11-16

## Qué está implementado
- Workflow `.github/workflows/ci.yml` en `folios-backend` (commit `db266a7`):
  1. Job `test`: instala dependencias y ejecuta `pytest -v` en cada push y PR a `main`.
  2. Job `build-push`: `needs: test`. Solo si las pruebas pasan, construye la imagen
     multi-arquitectura (`linux/amd64`, `linux/arm64`) y la publica en Docker Hub
     con el tag del SHA corto del commit y `latest`.
- Las pruebas pasan localmente: ver `pytest-backend.txt` (27 pruebas).

## Qué ocurrió
GitHub no inició el job: *"The job was not started because your account is locked
due to a billing issue."* (ver `ci-backend-run-bloqueado.png`).

La cuenta PaulaS06 quedó bloqueada al vencerse el beneficio de GitHub Education
(ver `github-cuenta-bloqueada.png`). No es un error del workflow.

## Comportamiento observado
`build-push` quedó **omitido** porque `test` no terminó bien: la regla `needs: test`
impidió publicar una imagen sin pruebas aprobadas.

## Acciones tomadas
- Nueva solicitud a GitHub Education con correo institucional.
- Solicitud a soporte de GitHub para desbloquear la cuenta.

## Imagen desplegada mientras el CI está bloqueado

Como GitHub Actions no puede ejecutarse en esta cuenta, la imagen del backend que
corre en Minikube **se construyó y publicó manualmente**, replicando los mismos
parámetros del job `build-push`:

| Parámetro | Valor |
|---|---|
| Commit | `084416b` en `folios-backend` (ya publicado en `main`) |
| Imagen | `paulas06/folios-backend:084416b` |
| Arquitecturas | `linux/amd64`, `linux/arm64` |
| Herramienta | `docker buildx` desde el equipo de Paula |

Comando usado, desde la carpeta `backend/`:

    docker buildx build \
      --platform linux/amd64,linux/arm64 \
      -t paulas06/folios-backend:$(git rev-parse --short HEAD) \
      --push .

**Diferencia con el flujo automático:** en el flujo del CI, la imagen solo se publica
si las pruebas pasan (`needs: test`). En este build manual, esa verificación se hizo
a mano: las 27 pruebas se ejecutaron localmente sobre ese mismo commit antes de
construir la imagen (ver `pytest-backend.txt`).

**Trazabilidad:** el tag de la imagen es el SHA del commit, el monorepo `folios`
apunta a ese mismo commit en el submódulo `backend`, y `k8s/backend.yaml` despliega
`paulas06/folios-backend:084416b`. Se puede verificar en vivo con:

    kubectl get pods -l app=folios-backend \
      -o jsonpath='{.items[0].spec.containers[0].image}'

Cuando la cuenta se desbloquee, basta con volver a ejecutar el workflow
(*Re-run jobs*) para que la misma imagen se genere de forma automática.