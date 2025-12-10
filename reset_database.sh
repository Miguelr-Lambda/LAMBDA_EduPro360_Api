#!/bin/bash

echo "=========================================="
echo "  RESETEAR BASE DE DATOS - EduPro360"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cambiar al directorio del backend
cd /home/user/LAMBDA_EduPro360_Api/LAMBDA_EduPro360_api

echo -e "${YELLOW}Paso 1: Eliminando archivos de migraciones...${NC}"
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
echo -e "${GREEN}✓ Archivos de migraciones eliminados${NC}"
echo ""

echo -e "${YELLOW}Paso 2: Eliminando y recreando base de datos PostgreSQL...${NC}"
# Eliminar la base de datos (debes tener permisos)
PGPASSWORD=postgres psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS edupro360;"
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE edupro360;"
echo -e "${GREEN}✓ Base de datos recreada${NC}"
echo ""

echo -e "${YELLOW}Paso 3: Creando nuevas migraciones...${NC}"
python manage.py makemigrations
echo -e "${GREEN}✓ Migraciones creadas${NC}"
echo ""

echo -e "${YELLOW}Paso 4: Aplicando migraciones...${NC}"
python manage.py migrate
echo -e "${GREEN}✓ Migraciones aplicadas${NC}"
echo ""

echo -e "${YELLOW}Paso 5: Creando roles básicos del sistema...${NC}"
python manage.py shell < setup_roles.py
echo -e "${GREEN}✓ Roles creados${NC}"
echo ""

echo -e "${YELLOW}Paso 6: Creando superusuario...${NC}"
echo -e "${YELLOW}Por favor ingresa los datos del superusuario:${NC}"
python manage.py createsuperuser
echo ""

echo -e "${GREEN}=========================================="
echo -e "  ✓ CONFIGURACIÓN COMPLETADA"
echo -e "==========================================${NC}"
echo ""
echo "El sistema está listo para usar. Ahora puedes:"
echo "1. Iniciar el servidor: python manage.py runserver"
echo "2. Acceder al admin en: http://localhost:8000/admin"
echo "3. Iniciar el frontend y probar el sistema"
echo ""
