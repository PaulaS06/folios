# Incidente 01 · El backend no encontraba la base de datos

**Fecha:** 2026-11-16
**Entorno:** Minikube (driver docker), namespace `default`

## Síntoma
La API respondía `500 Internal Server Error` al consultar:

    curl http://localhost:8000/api/programas

El pod del backend estaba en `1/1 Running`, así que la red hasta FastAPI funcionaba:
el fallo estaba dentro de la aplicación.

## Diagnóstico
1. Logs del backend:

       kubectl logs deploy/folios-backend --tail=40

   Error al final del traceback:

       sqlalchemy.exc.OperationalError: (psycopg2.OperationalError)
       could not translate host name "db" to address: Name or service not known

   → El DNS del cluster no conocía el nombre `db`.

2. Revisión de los Services:

       kubectl get svc

   → Solo existían `backend` y `kubernetes`. **El Service `db` no existía.**

3. Al reaplicar `k8s/db.yaml`, kubectl solo respondía
   `statefulset.apps/folios-db configured` (un recurso, cuando el archivo debía tener dos).

## Causa raíz
En `k8s/db.yaml` faltaba el separador `---` entre el Service y el StatefulSet.
Sin él, YAML lee ambos bloques como **un solo documento** con claves repetidas,
la última definición (el StatefulSet) sobrescribe a la primera, y el Service se pierde
sin que kubectl muestre ningún error.

## Recuperación
1. Se agregó la línea `---` entre los dos recursos.
2. Se volvió a aplicar el manifiesto:

       kubectl apply -f k8s/db.yaml

   Respuesta esperada (dos recursos):

       service/db created
       statefulset.apps/folios-db configured

3. `kubectl get svc` muestra `db` en `5432/TCP`.
4. **No fue necesario reiniciar el backend:** SQLAlchemy usa `pool_pre_ping=True`,
   así que en la siguiente petición reintentó la conexión y la API respondió `200`.

## Lección
- En Kubernetes los pods se encuentran **por el nombre del Service**, no por IP.
  Si el Service no existe, el pod puede estar sano y aun así no llegar a la BD.
- Al aplicar un archivo con varios recursos, contar cuántas líneas devuelve `kubectl apply`.