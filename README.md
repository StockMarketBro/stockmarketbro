# StockMarketBro — Guía de despliegue

## Archivos incluidos
- `index.html` — App completa (PWA-ready)
- `manifest.json` — Configuración PWA
- `sw.js` — Service Worker (offline + instalable)
- `logo.png` — Logo oficial de StockMarketBro

---

## Publicar en Vercel (recomendado, gratis)

1. Ve a https://vercel.com y crea una cuenta gratuita
2. Haz clic en "Add New Project" → "Deploy without a framework"
3. Arrastra toda esta carpeta o sube los archivos
4. Vercel genera una URL pública automáticamente (ej. stockmarketbro.vercel.app)
5. Puedes conectar un dominio propio (ej. stockmarketbro.com) desde el dashboard

## Publicar en Netlify (alternativa, gratis)

1. Ve a https://netlify.com y crea una cuenta
2. Arrastra esta carpeta a la sección "Deploy manually"
3. Listo — obtienes una URL en segundos

---

## Personalizar antes de publicar

### Cambiar el PIN del autor
En `index.html`, busca esta línea:
```
const AUTHOR_PIN='1234';
```
Cámbiala por tu PIN secreto.

### Cambiar la API key de Finnhub
En `index.html`, busca:
```
const FINNHUB_KEY='tu_key_aqui';
```

### Agregar tu dominio personalizado
Desde el dashboard de Vercel o Netlify puedes conectar tu dominio propio.

---

## Convertir a app Android (Google Play)

1. Publica primero en Vercel/Netlify y obtén tu URL
2. Instala Android Studio (gratis)
3. Usa Bubblewrap CLI para empaquetar la PWA como TWA:
   ```
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest https://tu-url.vercel.app/manifest.json
   bubblewrap build
   ```
4. Sube el APK generado a Google Play Console ($25 única vez)

---

## Funcionalidades incluidas
- Mercado en tiempo real (TradingView)
- Buscador de símbolos (acciones, cripto, forex, materias primas)
- Simulador con precios reales (Finnhub)
- Señales del autor con panel protegido por PIN
- Educación (9 lecciones por nivel)
- Quiz interactivo (3 niveles)
- Alertas de precio en tiempo real
- Glosario financiero
- PWA instalable (Android + iOS)
- Banner de instalación automático

---

## Actualizar la app

Para actualizar cualquier contenido:
1. Edita `index.html`
2. Sube el archivo actualizado a Vercel/Netlify
3. Los cambios se reflejan automáticamente para todos los usuarios

No necesitas pasar por ninguna tienda de apps para actualizar el contenido.

---

Desarrollado con StockMarketBro · 2026
