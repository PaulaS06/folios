# Falla provocada: apagar la base de datos

## Preparación

**Paso 1. Terminal A: observar los pods**
Para qué: ver en tiempo real cómo cambia el estado de los pods durante toda la prueba.

```bash
kubectl get pods -w
```

**Paso 2. Terminal C: abrir la aplicación**
Para qué: obtener la URL de la app en el navegador. Esta terminal debe quedar abierta.

```bash
minikube service frontend --url
```

**Paso 3. Terminal B: ver a qué pod le manda tráfico el Service**
Para qué: mostrar el estado sano antes de la falla (aparece una IP).

```bash
kubectl get endpoints backend
```

## Provocar la falla

**Paso 4. Apagar la base de datos**
Para qué: simular que la BD deja de estar disponible.

```bash
kubectl scale statefulset folios-db --replicas=0
```

Esperar unos 30 segundos.

## Diagnosticar

**Paso 5. Ver el estado de los pods**
Para qué: comprobar que el backend queda en `0/1 Running` y que RESTARTS no cambia (no se reinicia).

```bash
kubectl get pods
```

**Paso 6. Ver por qué el backend no está listo**
Para qué: mostrar que falló la readiness probe con código 503.

```bash
kubectl describe pod -l app=folios-backend | grep -i "probe failed"
```

**Paso 7. Ver a qué pod le manda tráfico el Service ahora**
Para qué: mostrar que la lista quedó vacía y ya no se envía tráfico al backend.

```bash
kubectl get endpoints backend
```

**Paso 8. Probar en el navegador**
Para qué: mostrar lo que ve el usuario. Iniciar sesión en la app con DevTools → Network abierto: la petición `login` falla.

## Recuperar

**Paso 9. Encender la base de datos**
Para qué: devolver el sistema a su estado normal.

```bash
kubectl scale statefulset folios-db --replicas=1
```

**Paso 10. Ver la recuperación**
Para qué: comprobar que la BD y el backend vuelven a `1/1` y que el backend no se reinició.

```bash
kubectl get pods
```

**Paso 11. Ver que el Service vuelve a mandar tráfico**
Para qué: comprobar que la IP del backend aparece otra vez.

```bash
kubectl get endpoints backend
```

**Paso 12. Probar en el navegador**
Para qué: iniciar sesión con un usuario creado antes de la falla y comprobar que los datos se conservaron.
