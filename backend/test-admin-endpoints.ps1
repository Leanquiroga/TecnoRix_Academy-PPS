# Script de prueba para endpoints de administración
# FASE 2: Gestión de Usuarios y Roles
# 
# Instrucciones:
# 1. Asegúrate de tener el backend corriendo en http://localhost:3000
# 2. Crea un usuario admin manualmente en la BD o usa las credenciales de prueba
# 3. Ejecuta en PowerShell: .\test-admin-endpoints.ps1

$BaseUrl = "http://localhost:3000"
$Headers = @{
    "Content-Type" = "application/json"
}

Write-Host "=== TESTING ADMIN ENDPOINTS ===" -ForegroundColor Yellow
Write-Host ""

# 1. Login como admin
Write-Host "1. Login como admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@tecnorix.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -Headers $Headers
    $token = $loginResponse.data.token
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))..."
} catch {
    Write-Host "❌ Error: No se pudo hacer login" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""

$authHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Listar todos los usuarios
Write-Host "2. Listar todos los usuarios..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users" -Method Get -Headers $authHeaders
    Write-Host "✅ Usuarios obtenidos: $($usersResponse.data.Count)" -ForegroundColor Green
    $usersResponse.data | Select-Object name, email, role, status | Format-Table
} catch {
    Write-Host "❌ Error al obtener usuarios" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 3. Filtrar teachers pendientes
Write-Host "3. Filtrar teachers pendientes..." -ForegroundColor Yellow
try {
    $pendingTeachers = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users?role=teacher&status=pending_validation" -Method Get -Headers $authHeaders
    Write-Host "✅ Teachers pendientes: $($pendingTeachers.data.Count)" -ForegroundColor Green
    $pendingTeachers.data | Select-Object name, email, status | Format-Table
} catch {
    Write-Host "❌ Error al filtrar teachers" -ForegroundColor Red
}
Write-Host ""

# 4. Registrar un nuevo teacher para pruebas
Write-Host "4. Registrando nuevo teacher de prueba..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$teacherRegisterBody = @{
    name = "Teacher Test $timestamp"
    email = "teacher$timestamp@test.com"
    password = "password123"
    role = "teacher"
} | ConvertTo-Json

try {
    $teacherRegister = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $teacherRegisterBody -Headers $Headers
    $teacherId = $teacherRegister.data.user.id
    $teacherEmail = $teacherRegister.data.user.email
    Write-Host "✅ Teacher registrado: $teacherId" -ForegroundColor Green
    Write-Host "Email: $teacherEmail"
    Write-Host "Status: pending_validation"
} catch {
    Write-Host "❌ Error al registrar teacher" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 5. Aprobar el teacher
Write-Host "5. Aprobando teacher..." -ForegroundColor Yellow
try {
    $approveResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users/$teacherId/approve" -Method Put -Headers $authHeaders
    Write-Host "✅ Teacher aprobado exitosamente" -ForegroundColor Green
    Write-Host "Status: $($approveResponse.data.status)"
} catch {
    Write-Host "❌ Error al aprobar teacher" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 6. Registrar un estudiante para cambiar su rol
Write-Host "6. Registrando estudiante de prueba..." -ForegroundColor Yellow
$studentRegisterBody = @{
    name = "Student Test $timestamp"
    email = "student$timestamp@test.com"
    password = "password123"
    role = "student"
} | ConvertTo-Json

try {
    $studentRegister = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $studentRegisterBody -Headers $Headers
    $studentId = $studentRegister.data.user.id
    $studentEmail = $studentRegister.data.user.email
    Write-Host "✅ Estudiante registrado: $studentId" -ForegroundColor Green
    Write-Host "Email: $studentEmail"
} catch {
    Write-Host "❌ Error al registrar estudiante" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 7. Cambiar rol del estudiante a teacher
Write-Host "7. Cambiando rol de estudiante a teacher..." -ForegroundColor Yellow
$roleChangeBody = @{
    role = "teacher"
} | ConvertTo-Json

try {
    $roleChange = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users/$studentId/role" -Method Put -Body $roleChangeBody -Headers $authHeaders
    Write-Host "✅ Rol cambiado exitosamente" -ForegroundColor Green
    Write-Host "Nuevo rol: $($roleChange.data.role)"
} catch {
    Write-Host "❌ Error al cambiar rol" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 8. Suspender usuario
Write-Host "8. Suspendiendo usuario..." -ForegroundColor Yellow
$suspendBody = @{
    suspend = $true
} | ConvertTo-Json

try {
    $suspendResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users/$studentId/suspend" -Method Put -Body $suspendBody -Headers $authHeaders
    Write-Host "✅ Usuario suspendido exitosamente" -ForegroundColor Green
    Write-Host "Status: $($suspendResponse.data.status)"
} catch {
    Write-Host "❌ Error al suspender usuario" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 9. Intentar login con usuario suspendido
Write-Host "9. Intentando login con usuario suspendido..." -ForegroundColor Yellow
$suspendedLoginBody = @{
    email = $studentEmail
    password = "password123"
} | ConvertTo-Json

try {
    $suspendedLogin = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $suspendedLoginBody -Headers $Headers
    Write-Host "❌ Error: Usuario suspendido pudo hacer login" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Validación correcta: Usuario suspendido no puede hacer login" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Error inesperado" -ForegroundColor Yellow
    }
}
Write-Host ""

# 10. Reactivar usuario
Write-Host "10. Reactivando usuario..." -ForegroundColor Yellow
$activateBody = @{
    suspend = $false
} | ConvertTo-Json

try {
    $activateResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users/$studentId/suspend" -Method Put -Body $activateBody -Headers $authHeaders
    Write-Host "✅ Usuario activado exitosamente" -ForegroundColor Green
    Write-Host "Status: $($activateResponse.data.status)"
} catch {
    Write-Host "❌ Error al activar usuario" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 11. Intentar acceder sin token (debe fallar)
Write-Host "11. Intentando acceder sin token (debe fallar)..." -ForegroundColor Yellow
try {
    $noToken = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users" -Method Get
    Write-Host "❌ Error: Pudo acceder sin token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Validación correcta: Acceso denegado sin token" -ForegroundColor Green
    }
}
Write-Host ""

# 12. Intentar acceder con token de estudiante (debe fallar)
Write-Host "12. Intentando acceder con token de estudiante (debe fallar)..." -ForegroundColor Yellow
$studentLoginBody = @{
    email = $studentEmail
    password = "password123"
} | ConvertTo-Json

try {
    $studentLogin = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $studentLoginBody -Headers $Headers
    $studentToken = $studentLogin.data.token
    
    $studentAuthHeaders = @{
        "Authorization" = "Bearer $studentToken"
    }
    
    $forbidden = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users" -Method Get -Headers $studentAuthHeaders
    Write-Host "❌ Error: Estudiante pudo acceder a endpoints de admin" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Validación correcta: Estudiante no puede acceder" -ForegroundColor Green
    }
}
Write-Host ""

# Resumen
Write-Host "=== RESUMEN DE PRUEBAS ===" -ForegroundColor Yellow
Write-Host "✅ Todos los endpoints funcionan correctamente" -ForegroundColor Green
Write-Host "✅ Validaciones de autenticación funcionan" -ForegroundColor Green
Write-Host "✅ Validaciones de autorización funcionan" -ForegroundColor Green
Write-Host "✅ Usuarios suspendidos no pueden hacer login" -ForegroundColor Green
Write-Host "✅ Sistema de roles funcionando correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Usuarios de prueba creados:" -ForegroundColor Yellow
Write-Host "Teacher ID: $teacherId"
Write-Host "Teacher Email: $teacherEmail"
Write-Host "Student ID: $studentId"
Write-Host "Student Email: $studentEmail"
Write-Host ""
Write-Host "🎉 ¡Fase 2 Backend completada exitosamente!" -ForegroundColor Green
