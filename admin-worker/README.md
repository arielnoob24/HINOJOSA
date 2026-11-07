# admin-worker — API del panel de administración

Cloudflare Worker que lee y guarda `hinojosa-web/src/data/productos.json` en GitHub.
Plan y decisiones: `PLAN.md` §0-E.

## Variables

| Nombre | Dónde | Valor |
|---|---|---|
| `GITHUB_TOKEN` | **Secreto en Cloudflare** | token fine-grained, solo `Contents: Read and write` sobre el repo |
| `ADMIN_PASSWORD` | **Secreto en Cloudflare** | contraseña de la dueña (≥ 12 caracteres) |
| `GITHUB_REPO`, `GITHUB_BRANCH`, `ALLOWED_ORIGIN` | `wrangler.toml` (`[vars]`) | no son secretas; para migrar de hosting se cambia `ALLOWED_ORIGIN` aquí y se vuelve a desplegar |

Los secretos se cambian en Cloudflare → Worker `hinojosa` → Settings → Variables and Secrets
(o con `npx wrangler secret put NOMBRE`).

## Desplegar

```
cd admin-worker
npx wrangler login      # una vez; abre el navegador
npx wrangler deploy
```

Las variables de texto salen del `wrangler.toml`; si se editan en el panel de Cloudflare,
el siguiente `deploy` las sobrescribe. (Se probó `--keep-vars` el 2026-11-07 y no las
conservó, por eso ahora viven en el archivo.)

## Probar (sin el panel)

```
# debe responder 401
curl -i https://hinojosa.mjkpqnx.workers.dev/productos

# debe responder 200 con { sha, categorias, productos }  (poner la contraseña real)
curl -H "X-Admin-Password: LA_CONTRASEÑA" https://hinojosa.mjkpqnx.workers.dev/productos
```

Desde `curl` no hay cabecera `Origin`, así que no se aplica el filtro de CORS; el navegador
sí lo aplica.

## Pruebas locales

```
node admin-worker/prueba-validar.mjs
```
