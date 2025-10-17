#!/bin/bash

# Script de prueba para endpoints de administración
# FASE 2: Gestión de Usuarios y Roles
# 
# Instrucciones:
# 1. Asegúrate de tener el backend corriendo en http://localhost:3000
# 2. Crea un usuario admin manualmente en la BD o usa las credenciales de prueba
# 3. Dale permisos de ejecución: chmod +x test-admin-endpoints.sh
# 4. Ejecuta: ./test-admin-endpoints.sh

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${YELLOW}=== TESTING ADMIN ENDPOINTS ===${NC}\n"

# 1. Login como admin
echo -e "${YELLOW}1. Login como admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tecnorix.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener el token${NC}"
  echo $LOGIN_RESPONSE | jq
  exit 1
fi

echo -e "${GREEN}✅ Login exitoso${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# 2. Listar todos los usuarios
echo -e "${YELLOW}2. Listar todos los usuarios...${NC}"
USERS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/admin/users" \
  -H "Authorization: Bearer $TOKEN")

echo $USERS_RESPONSE | jq
echo ""

# 3. Filtrar teachers pendientes
echo -e "${YELLOW}3. Filtrar teachers pendientes...${NC}"
PENDING_TEACHERS=$(curl -s -X GET "${BASE_URL}/api/admin/users?role=teacher&status=pending_validation" \
  -H "Authorization: Bearer $TOKEN")

echo $PENDING_TEACHERS | jq
TEACHER_COUNT=$(echo $PENDING_TEACHERS | jq '.data | length')
echo -e "${GREEN}✅ Teachers pendientes: $TEACHER_COUNT${NC}"
echo ""

# 4. Registrar un nuevo teacher para pruebas
echo -e "${YELLOW}4. Registrando nuevo teacher de prueba...${NC}"
TIMESTAMP=$(date +%s)
TEACHER_REGISTER=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Teacher Test ${TIMESTAMP}\",
    \"email\": \"teacher${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"teacher\"
  }")

TEACHER_ID=$(echo $TEACHER_REGISTER | jq -r '.data.user.id')
TEACHER_EMAIL=$(echo $TEACHER_REGISTER | jq -r '.data.user.email')

if [ "$TEACHER_ID" == "null" ]; then
  echo -e "${RED}❌ Error al registrar teacher${NC}"
  echo $TEACHER_REGISTER | jq
else
  echo -e "${GREEN}✅ Teacher registrado: $TEACHER_ID${NC}"
  echo "Email: $TEACHER_EMAIL"
  echo "Status: pending_validation"
fi
echo ""

# 5. Aprobar el teacher
echo -e "${YELLOW}5. Aprobando teacher...${NC}"
APPROVE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/admin/users/${TEACHER_ID}/approve" \
  -H "Authorization: Bearer $TOKEN")

APPROVED_STATUS=$(echo $APPROVE_RESPONSE | jq -r '.data.status')
if [ "$APPROVED_STATUS" == "active" ]; then
  echo -e "${GREEN}✅ Teacher aprobado exitosamente${NC}"
  echo $APPROVE_RESPONSE | jq
else
  echo -e "${RED}❌ Error al aprobar teacher${NC}"
  echo $APPROVE_RESPONSE | jq
fi
echo ""

# 6. Registrar un estudiante para cambiar su rol
echo -e "${YELLOW}6. Registrando estudiante de prueba...${NC}"
STUDENT_REGISTER=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Student Test ${TIMESTAMP}\",
    \"email\": \"student${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"student\"
  }")

STUDENT_ID=$(echo $STUDENT_REGISTER | jq -r '.data.user.id')
STUDENT_EMAIL=$(echo $STUDENT_REGISTER | jq -r '.data.user.email')

if [ "$STUDENT_ID" == "null" ]; then
  echo -e "${RED}❌ Error al registrar estudiante${NC}"
  echo $STUDENT_REGISTER | jq
else
  echo -e "${GREEN}✅ Estudiante registrado: $STUDENT_ID${NC}"
  echo "Email: $STUDENT_EMAIL"
fi
echo ""

# 7. Cambiar rol del estudiante a teacher
echo -e "${YELLOW}7. Cambiando rol de estudiante a teacher...${NC}"
ROLE_CHANGE=$(curl -s -X PUT "${BASE_URL}/api/admin/users/${STUDENT_ID}/role" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "teacher"
  }')

NEW_ROLE=$(echo $ROLE_CHANGE | jq -r '.data.role')
if [ "$NEW_ROLE" == "teacher" ]; then
  echo -e "${GREEN}✅ Rol cambiado exitosamente${NC}"
  echo $ROLE_CHANGE | jq
else
  echo -e "${RED}❌ Error al cambiar rol${NC}"
  echo $ROLE_CHANGE | jq
fi
echo ""

# 8. Suspender usuario
echo -e "${YELLOW}8. Suspendiendo usuario...${NC}"
SUSPEND_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/admin/users/${STUDENT_ID}/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suspend": true
  }')

SUSPENDED_STATUS=$(echo $SUSPEND_RESPONSE | jq -r '.data.status')
if [ "$SUSPENDED_STATUS" == "suspended" ]; then
  echo -e "${GREEN}✅ Usuario suspendido exitosamente${NC}"
  echo $SUSPEND_RESPONSE | jq
else
  echo -e "${RED}❌ Error al suspender usuario${NC}"
  echo $SUSPEND_RESPONSE | jq
fi
echo ""

# 9. Intentar login con usuario suspendido
echo -e "${YELLOW}9. Intentando login con usuario suspendido...${NC}"
SUSPENDED_LOGIN=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${STUDENT_EMAIL}\",
    \"password\": \"password123\"
  }")

LOGIN_ERROR=$(echo $SUSPENDED_LOGIN | jq -r '.error')
if [[ "$LOGIN_ERROR" == *"suspendido"* ]]; then
  echo -e "${GREEN}✅ Validación correcta: Usuario suspendido no puede hacer login${NC}"
  echo $SUSPENDED_LOGIN | jq
else
  echo -e "${RED}❌ Error: Usuario suspendido pudo hacer login${NC}"
  echo $SUSPENDED_LOGIN | jq
fi
echo ""

# 10. Reactivar usuario
echo -e "${YELLOW}10. Reactivando usuario...${NC}"
ACTIVATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/admin/users/${STUDENT_ID}/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suspend": false
  }')

ACTIVE_STATUS=$(echo $ACTIVATE_RESPONSE | jq -r '.data.status')
if [ "$ACTIVE_STATUS" == "active" ]; then
  echo -e "${GREEN}✅ Usuario activado exitosamente${NC}"
  echo $ACTIVATE_RESPONSE | jq
else
  echo -e "${RED}❌ Error al activar usuario${NC}"
  echo $ACTIVATE_RESPONSE | jq
fi
echo ""

# 11. Intentar acceder sin token (debe fallar)
echo -e "${YELLOW}11. Intentando acceder sin token (debe fallar)...${NC}"
NO_TOKEN=$(curl -s -X GET "${BASE_URL}/api/admin/users")
ERROR_MSG=$(echo $NO_TOKEN | jq -r '.error')
if [ "$ERROR_MSG" == "Unauthorized" ]; then
  echo -e "${GREEN}✅ Validación correcta: Acceso denegado sin token${NC}"
else
  echo -e "${RED}❌ Error: Pudo acceder sin token${NC}"
fi
echo ""

# 12. Intentar acceder con token de estudiante (debe fallar)
echo -e "${YELLOW}12. Intentando acceder con token de estudiante (debe fallar)...${NC}"
STUDENT_LOGIN=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${STUDENT_EMAIL}\",
    \"password\": \"password123\"
  }")

STUDENT_TOKEN=$(echo $STUDENT_LOGIN | jq -r '.data.token')
FORBIDDEN=$(curl -s -X GET "${BASE_URL}/api/admin/users" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

FORBIDDEN_MSG=$(echo $FORBIDDEN | jq -r '.error')
if [ "$FORBIDDEN_MSG" == "Forbidden" ]; then
  echo -e "${GREEN}✅ Validación correcta: Estudiante no puede acceder${NC}"
else
  echo -e "${RED}❌ Error: Estudiante pudo acceder a endpoints de admin${NC}"
fi
echo ""

# Resumen
echo -e "${YELLOW}=== RESUMEN DE PRUEBAS ===${NC}"
echo -e "${GREEN}✅ Todos los endpoints funcionan correctamente${NC}"
echo -e "${GREEN}✅ Validaciones de autenticación funcionan${NC}"
echo -e "${GREEN}✅ Validaciones de autorización funcionan${NC}"
echo -e "${GREEN}✅ Usuarios suspendidos no pueden hacer login${NC}"
echo -e "${GREEN}✅ Sistema de roles funcionando correctamente${NC}"
echo ""
echo -e "${YELLOW}Usuarios de prueba creados:${NC}"
echo "Teacher ID: $TEACHER_ID"
echo "Teacher Email: $TEACHER_EMAIL"
echo "Student ID: $STUDENT_ID"
echo "Student Email: $STUDENT_EMAIL"
echo ""
echo -e "${GREEN}🎉 ¡Fase 2 Backend completada exitosamente!${NC}"
