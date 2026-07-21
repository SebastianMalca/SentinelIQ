# SentinelIQ - Setup Guide

Bienvenido al repositorio de SentinelIQ. Sigue estas instrucciones para configurar el entorno de desarrollo en tu máquina local.

## 1. Requisitos Previos

Asegúrate de tener instalado en tu computadora:
- **Node.js** (v18 o superior)
- **PostgreSQL** (corriendo localmente o en la nube como Supabase/Neon)
- **Git**

## 2. Instalación

1. Clona el repositorio e instala las dependencias usando `npm`:
   ```bash
   npm install
   ```

## 3. Variables de Entorno

1. Copia el archivo de ejemplo para crear tu propio archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` y rellena las variables obligatorias:
   - `DATABASE_URL`: Pon la cadena de conexión a tu base de datos PostgreSQL.
   - `STRIPE_*`: Necesitarás crear una cuenta en Stripe y obtener tus claves de API de prueba, además de crear 2 productos (Pro y Business) y copiar sus Price IDs.
   - `NEXTAUTH_SECRET`: Genera un texto al azar o usa `openssl rand -base64 32`.

## 4. Configuración de la Base de Datos (Prisma)

El proyecto utiliza **Prisma ORM** para interactuar con la base de datos PostgreSQL.

1. Sincroniza el esquema de la base de datos (creará las tablas automáticamente):
   ```bash
   npx prisma db push
   ```
   *(Nota: si estuvieras en un entorno de producción o con datos existentes, usarías `npx prisma migrate dev` en lugar de push).*

2. Genera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```

## 5. Levantar el Proyecto

Para iniciar el servidor de desarrollo en tu computadora, ejecuta:
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## 6. Comandos Adicionales Útiles

- **Explorar la base de datos visualmente:**
  ```bash
  npx prisma studio
  ```
  Esto abrirá un panel de administración en `localhost:5555` donde podrás ver y editar los registros de las tablas directamente.

- **Probar Webhooks de Stripe en Localhost:**
  Necesitas instalar la [CLI de Stripe](https://stripe.com/docs/stripe-cli) y luego ejecutar:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
  Esto te dará tu `STRIPE_WEBHOOK_SECRET` que debes pegar en el archivo `.env`.
