#!/bin/bash

echo "Eliminando Vite y React, pasando a arquitectura clásica Express + EJS..."

# 1. Eliminar dependencias de React, Vite y Next
echo "Limpiando dependencias del package.json..."
npm uninstall react react-dom vite @vitejs/plugin-react react-router-dom next

# 2. Instalar dependencias de Express y EJS
echo "Instalando Express y EJS..."
npm install express ejs cors dotenv cookie-parser

# 3. Eliminar archivos de configuración de Vite
echo "Eliminando configuraciones de Vite..."
rm -f vite.config.js
rm -f index.html
rm -f src/main.jsx
rm -rf src/

# 4. Crear estructura de carpetas para EJS
echo "Creando carpetas views/ y public/..."
mkdir -p views
mkdir -p public/css
mkdir -p public/js
mkdir -p public/assets
mkdir -p server/routes

# 5. Mover estilos si existen
if [ -f "app/globals.css" ]; then
    cp app/globals.css public/css/style.css
fi

# Eliminar carpeta app (Next.js) si aún existe
rm -rf app

echo "========================================"
echo "Vite eliminado. Arquitectura EJS lista."
echo "========================================"
echo "PRÓXIMOS PASOS (MANUALES):"
echo "1. Debes reconstruir tu frontend creando plantillas .ejs dentro de la carpeta views/."
echo "2. Puedes usar el archivo public/css/style.css para los estilos."
echo "3. Ejecuta 'npm install' y luego 'npm start' para levantar el servidor."
