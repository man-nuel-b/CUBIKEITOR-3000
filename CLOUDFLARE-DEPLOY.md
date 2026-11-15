# Despliegue de CUBIKEITOR 3000 con Cloudflare Pages

El repositorio de GitHub permanece **privado**. La interfaz publicada puede ser accesible públicamente aunque el código fuente del repositorio sea privado. El JavaScript enviado al navegador será visible para quien pueda abrir el sitio.

## Crear proyecto en Cloudflare

1. Abre https://dash.cloudflare.com/ e ingresa a **Workers & Pages**.
2. Selecciona **Create application > Pages > Connect to Git**.
3. Autoriza a Cloudflare para acceder solamente a `man-nuel-b/CUBIKEITOR-3000`.
4. Selecciona la rama de producción `main`.
5. Configura:
   - Project name: `cubikeitor-3000` (si está disponible)
   - Framework preset: `None`
   - Build command: `sh scripts/build-pages.sh`
   - Build output directory: `dist`
   - Root directory: raíz del repositorio (vacío / `/`)
6. Haz clic en **Save and Deploy**.

El script crea `dist/index.html` y copia únicamente los scripts y precios de demostración utilizados por la aplicación.

## Restricción de acceso

Los despliegues de Cloudflare Pages se pueden visitar sin autenticarse salvo que configures Cloudflare Access explícitamente.

Para limitar el acceso a la vista previa, habilita una política de Cloudflare Access para los despliegues y otra para el dominio principal `cubikeitor-3000.pages.dev` (el nombre efectivo lo asignará Cloudflare). En Cloudflare Zero Trust > Access > Applications, define quién puede abrir el sitio. No confundas la política de *preview deployments* con la protección del dominio principal.

`robots.txt` solicita no indexar, **pero no restringe el acceso**.

## Estado y límites

La aplicación es un prototipo experimental; precios de demostración, sin autenticación propia ni APU real/Supabase. No uses la vista previa con información confidencial de clientes.

Cada push a `main` iniciará un despliegue automático una vez que Cloudflare quede conectado a GitHub.
