# Calendario de contenido · s(a)

- `index.html`: la página (HTML + CSS + JS, sin dependencias; solo carga Nunito Sans y Silkscreen de Google Fonts).
- `data.json`: todas las piezas. La página lo lee con `fetch("data.json")`.
- `img/`: miniaturas de los diseños.

## Probarlo local
Hay que servirlo (el fetch no funciona abriendo el archivo con doble clic):
    npx serve .      (o)      python -m http.server

## Pasarlo al ERP (Next.js)
- Copiá `data.json` e `img/` a `public/calendario/`.
- Opción rápida: copiá también `index.html` a `public/calendario/` → queda en /calendario/index.html.
- Opción integrada: convertí cada pieza en una fila de tu base (campos: id, semana, fecha, hora, tipo, titulo, pilar, estado, estadoTexto, imagenes[], formato, canva, copy, notas) y renderizá las tarjetas con tus componentes.
