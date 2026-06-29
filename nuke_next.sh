#!/bin/bash

echo "Iniciando migración completa de Next.js a Express + Vite..."

# 1. Instalar dependencias necesarias para Node.js y React
echo "Instalando dependencias de Express y Vite..."
npm install express cors dotenv cookie-parser
npm install vite @vitejs/plugin-react react-router-dom -D

# 2. Eliminar dependencias de Next.js
echo "Desinstalando Next.js..."
npm uninstall next

# 3. Crear estructura de Express (Backend)
echo "Creando estructura del servidor Express..."
mkdir -p server/routes

# Mover la lógica de la API de Next.js (como referencia para su reescritura)
if [ -d "app/api" ]; then
    cp -r app/api/* server/routes/
    echo "NOTA: Las rutas en server/routes/ usan la sintaxis de Next.js y deben reescribirse a Express."
fi

# 4. Crear estructura de Vite (Frontend)
echo "Moviendo archivos del frontend a src/..."
# Eliminar la carpeta api original para que no pase al frontend
rm -rf app/api

# Mover el resto de app/ (componentes de React) a src/
if [ -d "app" ]; then
    cp -r app/* src/
    rm -rf app
fi

# Renombrar page.js a page.jsx para Vite
find src -name "*.js" -exec bash -c 'mv "$0" "${0%.js}.jsx"' {} \;

# 5. Eliminar rastros y archivos de configuración de Next.js
echo "Eliminando archivos de Next.js..."
rm -rf .next
rm -f next.config.js
rm -f next-env.d.ts

echo "========================================"
echo "Migración estructural completada."
echo "========================================"
echo "PRÓXIMOS PASOS (MANUALES):"
echo "1. En tus componentes React en src/, busca 'next/link' y cámbialo por 'react-router-dom' (Link)."
echo "2. Reescribe tus archivos en server/routes/ para usar express.Router() en lugar de export async function GET()."
echo "3. Ejecuta 'npm run dev' con Vite configurado, y 'node server.js' para tu backend."
