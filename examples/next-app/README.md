# og-route-kit Next.js Example

This example exercises the package from a real Next App Router route.

This example uses Next.js 16 and requires Node.js 20.9.0 or newer.

```bash
pnpm install
pnpm build
pnpm --filter og-route-kit-next-app-example exec next dev -p 3000
```

Open:

```txt
http://localhost:3000/api/og?title=Hello&description=World
```

The route should return a `1200 x 630` PNG.
