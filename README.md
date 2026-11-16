# Folios

Plataforma web para que estudiantes universitarios compartan, consulten y gestionen documentos académicos (apuntes, parciales antiguos, resúmenes, talleres y guías de estudio), clasificados por programa, materia y categoría.

Proyecto de **Gestión de la Configuración** — Universidad de Medellín, 2026-2.

## Equipo

| Integrante | Rol |
|---|---|
| Paula Sofía Meneses Gasca | Backend / API y base de datos |
| Simón Correa Bravo | Frontend |

## Estructura del repositorio (monorepo)

Este repositorio maneja los dos proyectos, que viven en sus propios repositorios y se referencian como **submódulos de Git**:

```
folios/
├── docker-compose.yml   # Orquesta los 3 servicios: db, backend y frontend
├── db/                  # Scripts SQL que inicializan la base de datos
│   ├── 00_extensiones.sql
│   ├── 01_schema.sql    # Tablas, restricciones, funciones y triggers
│   └── 02_catalogos.sql # Programas, categorías y materias
├── backend/             # Submódulo → folios-backend
├── frontend/            # Submódulo → folios-frontend
├── .env.example         # Plantilla de variables de entorno
├── k8s/                 # Manifiestos de Kubernetes (BD, backend, frontend)
├── evidencias/          # Salidas de comandos y capturas para la defensa
└── README.md
```

| Proyecto | Repositorio | Imagen en Docker Hub |
|---|---|---|
| Backend | [PaulaS06/folios-backend](https://github.com/PaulaS06/folios-backend) | [paulas06/folios-backend](https://hub.docker.com/r/paulas06/folios-backend) |
| Frontend | [SimonCorreaB12/folios-frontend](https://github.com/SimonCorreaB12/folios-frontend) | [scorrea884/folios-frontend](https://hub.docker.com/r/scorrea884/folios-frontend) |

## Tecnologías y versiones

| Componente | Tecnología | Versión |
|---|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla, sin frameworks) | — |
| Frontend | Bootstrap Icons | 1.11.3 |
| Frontend | Servidor web nginx (imagen `nginx:alpine`) | alpine |
| Backend | Python (imagen `python:3.12-slim`) | 3.12 |
| Backend | FastAPI | 0.146.0 |
| Backend | Uvicorn | 0.54.0 |
| Backend | SQLAlchemy (ORM) | 2.0.55 |
| Backend | psycopg2-binary (driver de PostgreSQL) | 2.9.13 |
| Backend | Pydantic | 2.14.1 |
| Backend | PyJWT (autenticación con tokens) | 2.15.1 |
| Backend | bcrypt (hash de contraseñas) | 5.0.0 |
| Base de datos | PostgreSQL (imagen `postgres:17`) | 17 |
| Pruebas backend | pytest | 8.4.2 |
| Pruebas frontend | Playwright (`@playwright/test`) | 1.64.1 |
| Contenedores | Docker + Docker Compose | Compose v2 |

## Requisitos

- **Git**
- **Docker Desktop**
- Opcional, solo para correr las pruebas: **Python 3.12+** (backend) y **Node.js LTS** (frontend)

## Cómo descargar

Clonar el monorepo **con sus submódulos**:

```bash
git clone --recurse-submodules https://github.com/PaulaS06/folios.git
cd folios
```

Las imágenes también se pueden descargar directamente de Docker Hub:

```bash
docker pull paulas06/folios-backend:latest
docker pull scorrea884/folios-frontend:latest
```

## Cómo ejecutar

1. Crear el archivo de variables de entorno a partir de la plantilla y cambiar los valores con las creedenciales personales:

```bash
   cp .env.example .env
```

2. Levantar los tres servicios:

```bash
   docker compose up
```

   La primera vez, PostgreSQL ejecuta los scripts de `db/` y crea las tablas, los triggers y los catálogos.

3. Abrir en el navegador:

   | Servicio | URL |
   |---|---|
   | Aplicación (frontend) | http://localhost:8080 |
   | API (backend) | http://localhost:8000 |
   | Documentación de la API (Swagger / OpenAPI) | http://localhost:8000/docs |

### Comandos útiles

```bash
docker compose up -d            # Levantar en segundo plano
docker compose down             # Detener (los datos se conservan en el volumen)
docker compose down -v          # Detener y BORRAR la base de datos (se recrea desde db/ al volver a levantar)
docker compose exec db psql -U folios -d folios   # Consola SQL de la base de datos
```

## Flujo completo de prueba

1. Entrar a http://localhost:8080 → **Registrarse** con un correo `@soyudemedellin.edu.co`.
2. **Iniciar sesión** con ese correo.
3. **Subir un documento** (nombre, materia, categoría y enlace).
4. Verlo en **Explorar apuntes**, abrir su detalle y, con otra cuenta, **calificarlo y comentarlo**.
5. Revisar en **Mi perfil**.

Este flujo recorre las tres capas: frontend (nginx) → backend (FastAPI) → base de datos (PostgreSQL).

## Pruebas

**Backend (pytest)**, pruebas unitarias de seguridad, validaciones y rutas protegidas:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r tests/requirements.txt
pytest -v
```

**Frontend (Playwright)**, pruebas de los flujos críticos en el navegador (requiere `docker compose up` corriendo):

```bash
cd frontend
npm install
npx playwright install chromium
npm test
```

## Historias de usuario

### Funcionales

| ID | Historia de usuario | Responsable backend | Responsable frontend | Estado |
|---|---|---|---|---|
| HU-01 | Como estudiante, quiero registrarme con mi correo institucional para poder acceder a la plataforma. | Paula Meneses | Simón Correa | Done |
| HU-02 | Como estudiante registrado, quiero iniciar sesión con mi correo y contraseña para acceder a mi cuenta. | Paula Meneses | Simón Correa | Done |
| HU-03 | Como estudiante, quiero ver el listado de documentos y buscar o filtrar por materia/categoría para encontrar material relevante rápidamente. | Paula Meneses | Simón Correa | Done |
| HU-04 | Como estudiante, quiero ver el detalle de un documento para decidir si me sirve antes de acceder a él. | Paula Meneses | Simón Correa | Done |
| HU-05 | Como estudiante usuario de Folios, quiero publicar mis propios documentos para compartirlos con otros estudiantes. | Paula Meneses | Simón Correa | Done |
| HU-06 | Como autor de un documento, quiero poder editarlo o eliminarlo para mantenerlo actualizado. | Paula Meneses | Simón Correa | Done |
| HU-07 | Como estudiante, quiero calificar y comentar documentos de otros estudiantes para darle retroalimentación. | Paula Meneses | Simón Correa | Done |
| HU-08 | Como estudiante, quiero que mi puntaje se actualice cuando reciba calificaciones, para que mi reputación refleje la calidad de lo que comparto. | Paula Meneses (endpoint y triggers) | Simón Correa (puntaje en el sidebar) | Done |
| HU-09 | Como estudiante, quiero consultar mi perfil (nombre, programa, semestre, puntaje) para ver mi información y reputación acumulada. | Paula Meneses | Simón Correa | Done |

### Técnicas (segunda entrega)

| ID | Historia de usuario | Responsable | Estado |
|---|---|---|---|
| HU-10 | Como equipo, queremos el backend en su propio repositorio y contenerizado con Docker, con su imagen publicada en Docker Hub, para poder desplegarlo en cualquier máquina. | Paula Meneses | Done |
| HU-11 | Como equipo, queremos el frontend en su propio repositorio y contenerizado con Docker (nginx), con su imagen publicada en Docker Hub, para poder desplegarlo en cualquier máquina. | Simón Correa | Done |
| HU-12 | Como equipo, queremos la base de datos con su esquema definido y un docker-compose que levante frontend, backend y BD con un solo comando. | Paula Meneses | Done |
| HU-13 | Como equipo, queremos pruebas unitarias del backend para verificar las funcionalidades críticas. | Paula Meneses | Done |
| HU-14 | Como equipo, queremos pruebas de Playwright del frontend para verificar los flujos críticos desde el navegador. | Simón Correa | Done |


## Despliegue en Kubernetes (Minikube)

Además de Docker Compose, el sistema se despliega en Kubernetes con los manifiestos de `k8s/`.

### Arquitectura en el cluster

| Componente | Recurso | Service | Exposición | Imagen |
|---|---|---|---|---|
| Base de datos | StatefulSet `folios-db` + PVC de 1Gi | `db` (ClusterIP, 5432) | Solo interna | `postgres:17` |
| Backend | Deployment `folios-backend` | `backend` (ClusterIP, 8000) | Solo interna | `paulas06/folios-backend:<sha>` |
| Frontend | Deployment `folios-frontend` | `frontend` (NodePort, 80) | **Única entrada externa** | `scorrea884/folios-frontend:<sha>` |

- El navegador solo habla con **nginx**, que sirve el sitio y reenvía las rutas `/api/` al Service `backend`. La API y la base de datos no son accesibles desde fuera del cluster.
- Las credenciales viven en el Secret `folios-secret`, que **no se versiona**: se crea a partir del `.env` local.
- Los scripts de `db/` se montan con el ConfigMap `folios-db-init` y PostgreSQL los ejecuta la primera vez que arranca con el volumen vacío.
- El backend tiene dos probes: **readiness** en `/health/ready` (verifica la conexión a la BD; si falla, deja de recibir tráfico) y **liveness** en `/health/live` (solo verifica que el proceso responde; si falla, se reinicia el contenedor).
- Las imágenes usan como tag el **SHA corto del commit** del que fueron construidas, nunca `latest`.

### Requisitos

- **Minikube** y **kubectl**
- **Docker Desktop** (driver de Minikube)

### Cómo desplegar desde cero

1. Iniciar Minikube:

   ```bash
   minikube start --driver=docker
   ```

2. Crear el `.env` a partir de la plantilla (si no existe) y crear el Secret desde él:

   ```bash
   cp .env.example .env      # y editar los valores
   kubectl create secret generic folios-secret --from-env-file=.env
   ```

3. Desplegar la base de datos y esperar a que esté lista:

   ```bash
   kubectl apply -f k8s/db-configmap.yaml
   kubectl apply -f k8s/db.yaml
   kubectl rollout status statefulset/folios-db
   ```

4. Desplegar el backend y el frontend:

   ```bash
   kubectl apply -f k8s/backend.yaml
   kubectl apply -f k8s/frontend.yaml
   kubectl rollout status deployment/folios-backend
   kubectl rollout status deployment/folios-frontend
   ```

5. Abrir la aplicación (dejar la terminal abierta, mantiene el túnel):

   ```bash
   minikube service frontend --url
   ```

### Verificación y diagnóstico

```bash
kubectl get pods,svc,deploy,statefulset,pvc        # estado general
kubectl logs deploy/folios-backend --tail=50        # logs de la API
kubectl describe pod -l app=folios-backend          # eventos y probes
```

Imagen exacta que ejecuta cada pod (trazabilidad tag → digest):

```bash
kubectl get pods -o custom-columns='POD:.metadata.name,IMAGEN:.spec.containers[0].image,DIGEST:.status.containerStatuses[0].imageID'
```

### Mantenimiento

- Si cambian los scripts de `db/`, regenerar el ConfigMap:

  ```bash
  kubectl create configmap folios-db-init --from-file=db/ --dry-run=client -o yaml > k8s/db-configmap.yaml
  ```

- Reiniciar la base de datos **borrando todos los datos** (los scripts se vuelven a ejecutar):

  ```bash
  kubectl delete statefulset folios-db
  kubectl delete pvc datos-folios-db-0
  kubectl apply -f k8s/db.yaml
  ```

## Integración y entrega continua

Cada repositorio tiene su workflow de GitHub Actions en `.github/workflows/ci.yml`:

| Repositorio | Job `test` | Job `build-push` |
|---|---|---|
| `folios-backend` | Pruebas unitarias con pytest | Imagen multi-arquitectura (`linux/amd64`, `linux/arm64`) publicada en Docker Hub |
| `folios-frontend` | Build de la imagen, prueba de humo de nginx y pruebas de Playwright que no dependen de la API | Ídem |

- Se ejecutan en cada `push` y `pull request` a `main`.
- `build-push` depende de `test` (`needs: test`): **si una prueba falla, no se publica la imagen**.
- En un pull request solo se ejecutan las pruebas; la imagen se publica únicamente cuando el cambio entra a `main`.
- Cada imagen se etiqueta con el SHA corto del commit (además de `latest`).

### Cadena de entrega

```
commit en GitHub → GitHub Actions (pruebas + build) → Docker Hub (imagen:<sha>)
                → manifiesto en k8s/ (image: ...:<sha>) → kubectl apply → pod
```

Para desplegar una versión nueva se cambia el tag en el manifiesto correspondiente de `k8s/`, se aplica con `kubectl apply` y se hace commit. El estado deseado del cluster queda versionado en Git; la aplicación al cluster es manual (no se usa una herramienta GitOps como Argo CD).

### Limitaciones conocidas

- La cuenta de GitHub dueña de `folios-backend` tiene GitHub Actions bloqueado por un problema de facturación ajeno al proyecto. Mientras tanto, la imagen del backend se construye con los mismos parámetros del workflow usando `docker buildx` y las pruebas se ejecutan localmente. Detalle y evidencias en `evidencias/ci-backend-bloqueo.md`.
- Las pruebas de Playwright que requieren backend y base de datos (registro, login, publicar documento) se ejecutan contra el entorno desplegado, no en el CI del frontend.