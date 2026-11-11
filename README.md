# DeliSmart Restaurant Front

Panel de cada pollería: React + Vite + TypeScript + Tailwind CSS, con TanStack Query y Axios. Usa el mismo sistema visual que el landing y el panel admin. Consume `delismart-restaurant-back`.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5174
```

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | Backend de la pollería (por defecto `http://localhost:8001`; en producción `.env.production` apunta a https://delismart-restaurant-back.onrender.com) |
| `VITE_POLLING_MS` | Intervalo del polling de pedidos nuevos, entre 5000 y 10000 ms |

Con `seed_demo` en el backend se entra con `admin`, `cajero` o `cocina` (contraseña `demo12345`).

## Vistas

| Ruta | Roles | Uso |
| --- | --- | --- |
| `/login` | todos | Login del personal con JWT |
| `/sso` | admin | Entrada desde "Mi Plan" del panel admin con un enlace de un solo uso: abre el panel con la sesión iniciada |
| `/dashboard` | admin | KPIs del día, ventas de 7 días, canal WhatsApp y más vendidos |
| `/pedidos-whatsapp` | admin, cajero | Pedidos de WhatsApp por validar (polling cada 5 s), comprobante, ubicación, chat y **Confirmar pago** |
| `/tablero` | todos | Tablero de cocina y delivery por estado |
| `/pedidos` | admin, cajero | Historial con filtros y alta de pedidos manuales |
| `/conversaciones` | admin, cajero | Chats de WhatsApp; responder pausa al asistente |
| `/simulador` | admin, cajero | Cliente falso de WhatsApp que crea pedidos reales |
| `/carta` | todos | Categorías y platos; la cocina solo marca agotados |
| `/clientes` | admin, cajero | Clientes con pedidos y gasto |
| `/inventario` | admin, cocina | Insumos, entradas/salidas y alertas de stock |
| `/reportes` | admin, cajero | Ventas por día, estados y productos top |
| `/usuarios` | admin | Personal y roles |
| `/configuracion` | todos (edita admin) | Ubicación, cobertura, tiempos, pagos y WhatsApp |

Sin WebSockets: los pedidos, el tablero y los chats se refrescan por polling. Si la licencia no está activa, el backend responde `402` y el panel muestra la pantalla de bloqueo.

## Pendiente

Las integraciones reales (Meta, OpenAI y Google Maps) dependen de las claves del backend; mientras falten, el header muestra **Modo simulado** y el simulador indica qué claves faltan.
