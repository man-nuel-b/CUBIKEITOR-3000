# CUBIKEITOR 3000

Repositorio privado independiente para el prototipo de integración reactiva del configurador 3D.

**Estado:** prototipo experimental. No reemplaza `man-nuel-b/cotizacion-3d`. El presupuesto utiliza precios demostrativos; no incluye el APU real ni conexión Supabase.

## Ejecutar

Servir la carpeta del proyecto con `python -m http.server 8080` y abrir `http://localhost:8080`. La vista requiere conexión a Internet para Three.js.

## Pruebas

```bash
node --test tests/*.test.cjs
node --check src/app.js
```

## Seguridad

No publicar como producto comercial sin revisar autenticación, cálculos técnicos y catálogo de precios.
