# Landing (Next.js)

Landing page para promocionar la app de manga online.

## Iniciar

1. Copia `.env.example` a `.env.local`.

2. Instala y corre:

```bash
npm install
npm run dev
```

## Confirmacion de email (Supabase)

- Configura `NEXT_PUBLIC_APP_DEEPLINK` con el esquema deeplink de tu app.
- En Supabase Auth, usa `https://tu-dominio/auth/confirm` como URL de redireccion para confirmacion.
- La ruta `/auth/confirm` redirige automaticamente al deeplink y deja boton de fallback manual.
