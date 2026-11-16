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