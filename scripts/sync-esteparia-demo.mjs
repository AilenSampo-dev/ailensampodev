import { execSync } from "child_process";
import fs from "fs";

let html = execSync(
  "git show feat/sitio:src/content/propuestas/esteparia-accesorios/demo.html",
  { encoding: "utf8" }
);

html = html.replace(
  "const IMG = DEMO_BASE + 'assets/web/fotoproductos/';",
  "const IMG = '/assets/propuestas/esteparia-accesorios/';"
);
html = html.replace(
  "if(src.startsWith('assets/')) return DEMO_BASE + src;",
  "if(src.startsWith('assets/')) return '/' + src;"
);
if (!html.includes('name="robots"')) {
  html = html.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex, nofollow">'
  );
}
html = html.replace(
  `'sombreroOndulado.jpg':'sombreroOndulado.svg'\n  };`,
  `'sombreroOndulado.jpg':'sombreroOndulado.svg',
    'sombreroOndulado.svg':'sombreroOndulado.svg',
    'anteojosVintage.svg':'anteojosVintage.svg',
    'cadenaCirculoCorazon.svg':'cadenaCirculoCorazon.svg',
    'collarBolas.svg':'collarBolas.svg'
  };`
);

fs.mkdirSync("p/esteparia-accesorios/demo", { recursive: true });
fs.writeFileSync("p/esteparia-accesorios/demo/index.html", html, "utf8");
console.log("demo written", html.includes("Armá"));
