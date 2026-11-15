# CUBIKEITOR 3000

Proyecto independiente basado en el paquete `cubikeitor-integracion-reactiva-v2(1).zip`.

> Versión prototipo: costos demostrativos, sin Supabase ni integración completa de ingeniería. No sustituye `man-nuel-b/cotizacion-3d`.

# Cubikeitor Reactivo — prototipo de migración arquitectónica

**Estado:** versión independiente de demostración. No es una clonación completa del repositorio original `man-nuel-b/cotizacion-3d` ni sustituye sus módulos de instalaciones, APU completo, catálogo técnico o Supabase.

## Ejecutar

Con Node.js 22+: `npx http-server .` (si ya está instalado) o `python -m http.server 8080`. Abrir `http://localhost:8080`. Se requiere conexión a Internet para cargar Three.js desde CDN. No se requieren claves de Supabase.

## Incluido

- Estado paramétrico de una sola fuente y snapshots defensivos en `src/core.js`.
- Comandos validados (`ADD_OPENING`, `MOVE_OPENING`, `RESIZE_OPENING`, `REMOVE_OPENING`, `SET_FINISH`, `SET_CONTAINER`).
- Historial Deshacer/Rehacer con revisiones estrictamente crecientes.
- Vista 3D con paredes segmentadas alrededor de vanos, solo se reconstruye tras un comando confirmado.
- BOM/costo ilustrativo en `src/cost-worker.js` (Web Worker), resultados etiquetados por revisión y descarte de resultados obsoletos.
- Cálculo monetario en `BigInt` y milímetros enteros, más regla explícita de redondeo e IVA demo.
- Bloqueo de cotización si falta un precio.
- Guardado y recuperación local (sin nube), manual.
- Pruebas automatizadas (`node --test tests/*.test.cjs`).

## Limitaciones conocidas

- El motor de costos es **demo** y las recetas no reemplazan los APU y BOM verificados del producto original.
- No se usa `InstancedMesh` aún ni se prometen 60 FPS constantes.
- El render 3D recompone la envolvente ante cada comando confirmado; NO hay invalidación granular de cada objeto.
- El precio de cada abertura supone valores referenciales y no considera tamaño específico ni proveedor.
- No hay sincronización Supabase ni IA conectada; deben incorporarse después de migrar pruebas y contratos de datos.
- Materiales y muros son esquemáticos, sin ingeniería estructural ni resolución de encuentros constructivos.
- Los precios incluyen impuestos de demostración y deben ser reemplazados por una lista validada y versionada para producción.
- El prototipo se publica en un repositorio privado independiente `man-nuel-b/CUBIKEITOR-3000`.

## Integración planificada al repositorio original

1. Conservar las pruebas y el acceso restringido de `pruebas.html`; crear rama nueva de integración, no modificar `main` directamente.
2. Adaptar `app.js` y `faces-mounted.js` para emitir comandos al estado central, manteniendo sus interfaces y funciones heredadas.
3. Adaptar `supabase-3d-bom-bridge.js` para recibir snapshots paramétricos y producir cálculos puros; conservar reglas constructivas existentes, NO sustituir por el BOM ilustrativo de este paquete.
4. Mantener la compatibilidad de `project-persistence-core.js`, sus snapshots v4, controles de integridad y recuperación; agregar migraciones de esquema probadas antes de sustituir almacenamiento.
5. Añadir verificación de revisión de cada cálculo asincrónico y retención de lista de precios usada para cotizaciones emitidas.
6. Reutilizar autorización Supabase y RLS; nunca exponer secretos privilegiados en el navegador.
7. Extender GitHub Actions para incluir todo archivo de geometría, vanos y BOM; ejecutar pruebas de navegador y regresión de precios.

## Seguridad

No insertar claves `service_role` en el cliente. Los comandos de IA deben validar el mismo esquema y permisos que los comandos humanos. No ejecutar comandos arbitrarios ni código generado por IA en el navegador.

## Etapa 2 — Integración parcial con el formato existente (15-11-2026)

**Cambios realizados sobre el prototipo:**

- `src/legacy-adapter.js`: proyección **solo lectura** del proyecto heredado de `app.js` (`container`, `counts`, `layout`, `dimensions`, `projectMeta`) hacia un estado paramétrico en milímetros. Respeta la convención original de coordenadas `layout.x` centradas en cada cara. Advierte sobre elementos aún no trasladados: tabiques, electricidad, baños, climatización y otros.
- `src/worker-controller.js`: agenda cubicaciones con 75 ms de espera, envía revisiones al Worker, ignora resultados asincrónicos anteriores y usa cálculo local de respaldo cuando falla el Worker.
- `src/app.js`: visor con invalidación por **cara modificada** y reutilización de materiales de Three.js; libera geometrías anteriores antes de reemplazarlas, evitando acumular mallas de cambios previos.
- `index.html`: botón para importar JSON de un proyecto original no protegido, solo en modo de proyección experimental; un archivo `cubikeitor-project` v4 con sello de integridad se **rechaza** hasta conectarse al verificador existente, evitando la importación insegura de snapshots.
- `tests/integration.test.cjs`: pruebas de compatibilidad, inmutabilidad y resultados obsoletos.

### Precauciones importantes

- **La importación no es la migración íntegra del proyecto.** La versión reactiva solo representa ventanas/puertas y modelos `20hc` definidos en su adaptador. Los demás componentes se conservan en el JSON fuente de origen; no se incorporan al nuevo presupuesto y **no se deben guardar encima del archivo original**.
- No hemos descargado o incorporado aquí los 116 elementos del árbol GitHub del proyecto original. No se puede afirmar que el repositorio fuente haya sido clonado o que se haya integrado `supabase-3d-bom-bridge.js` íntegramente.
- Los costos de este paquete son de demostración. El APU real permanece en el original y requiere una segunda fase de migración y validación de recetas.
- La carga de `pruebas.html` y la protección Supabase originales **no se han modificado**. El visor experimental debe usarse solo localmente hasta auditar autenticación y autorización.
- No existen mediciones de FPS, estrés en proyectos grandes ni pruebas de navegador Chromium para esta fase. Se pasó validación sintáctica y pruebas automatizadas Node.js, no se certifica producción.
- La integración completa con `cotizacion-3d` sigue pendiente; este repositorio no sustituye el sistema original.

### Ejecutar pruebas

```bash
node --test tests/*.test.cjs
node --check src/app.js
```