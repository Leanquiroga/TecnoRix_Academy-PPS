# RUTA DE DESARROLLO - TECNORIX ACADEMY
## Proyecto: Plataforma E-Learning con React + Node.js + Supabase

---

## FASE 0: PREPARACIÓN DEL ENTORNO (1-2 días)

### Backend Setup
- [x] Crear proyecto Node.js + Express + TypeScript
- [x] Configurar estructura de carpetas backend
- [x] Instalar dependencias (express, bcrypt, jsonwebtoken, multer, cors, dotenv)
- [x] Configurar conexión a Supabase (PostgreSQL)
- [x] Configurar variables de entorno (.env)
- [x] Configurar Cloudinary para subida de archivos

### Frontend Setup
- [x] Instalar dependencias Material UI
- [x] Instalar React Router, Axios, Zustand
- [x] Configurar estructura de carpetas frontend
- [x] Crear archivo de variables de entorno
- [x] Configurar proxy para desarrollo

### Database Setup
- [x] Crear proyecto en Supabase
- [x] Diseñar esquema de base de datos
- [x] Crear tablas: users, courses, enrollments, quizzes, questions, answers, forum_posts, payments, transactions
- [x] Definir relaciones y constraints
- [x] Crear índices necesarios

---

## FASE 1: AUTENTICACIÓN Y ROLES (3-5 días)

### Backend - Epic 1
 - [x] Crear modelo User (id, name, email, password, role, status, created_at)
 - [x] Implementar endpoint POST /api/auth/register
   - Validar datos de entrada
   - Hashear password (**Supabase Auth maneja el hash de contraseña automáticamente al crear el usuario, por lo que no se almacena en texto plano ni es necesario usar bcrypt manualmente**)
   - Guardar usuario en DB
   - Marcar teachers como "pending_validation"
 - [x] Implementar endpoint POST /api/auth/login
   - Validar credenciales
   - Generar JWT token
   - Retornar token y datos del usuario
 - [x] Crear middleware de autenticación (verificar JWT)
 - [x] Crear middleware de roles (admin, teacher, student)
 - [x] Implementar endpoint GET /api/auth/me (validar token)
 - [x] Implementar endpoint POST /api/auth/refresh (renovar token)

> **Nota:** El hash de la contraseña es gestionado por Supabase Auth, garantizando la seguridad de las credenciales sin intervención manual en el backend.

### Frontend - Epic 1
- [ ] Crear types: User, Role, AuthState
- [ ] Crear constants: ROLES, API_URL, TOKEN_KEY
- [ ] Crear authStore con Zustand
  - Estados: user, token, isAuthenticated, loading
  - Acciones: login, logout, register, validateToken
  - Persistir token en localStorage
- [ ] Crear auth.service.ts (llamadas API)
- [ ] Crear hook useAuth()
- [ ] Crear página Register
  - Formulario con validación
  - Selección de rol (student/teacher)
  - Material UI components
- [ ] Crear página Login
  - Formulario con validación
  - Manejo de errores
  - Redirect según rol
- [ ] Crear PrivateRoute component
- [ ] Crear RoleRoute component
- [ ] Configurar rutas protegidas en AppRoutes

### Testing Fase 1
- [ ] Probar registro de estudiante
- [ ] Probar registro de profesor (pending validation)
- [ ] Probar login y generación de token
- [ ] Probar redirección según rol
- [ ] Probar middleware de autenticación
- [ ] Probar protección de rutas

---

## FASE 2: GESTIÓN DE USUARIOS Y ROLES (2-3 días)

### Backend - Epic 1 (continuación)
- [ ] Implementar endpoint GET /api/admin/users (solo admin)
- [ ] Implementar endpoint PUT /api/admin/users/:id/approve (aprobar teachers)
- [ ] Implementar endpoint PUT /api/admin/users/:id/role (cambiar rol)
- [ ] Implementar endpoint PUT /api/admin/users/:id/suspend (suspender usuario)
- [ ] Agregar validación de usuario suspendido en login

### Frontend - Epic 1 (continuación)
- [ ] Crear página AdminDashboard
- [ ] Crear componente UserManagement
  - Listar todos los usuarios
  - Filtros por rol y estado
  - Aprobar teachers pendientes
  - Suspender usuarios
  - Cambiar roles
- [ ] Crear user.service.ts
- [ ] Agregar validación de usuario suspendido en authStore

### Testing Fase 2
- [ ] Probar aprobación de teachers
- [ ] Probar cambio de roles
- [ ] Probar suspensión de usuarios
- [ ] Verificar que usuarios suspendidos no puedan entrar

---

## FASE 3: GESTIÓN DE CURSOS (4-6 días)

### Backend - Epic 2
- [ ] Crear modelo Course (id, title, description, teacher_id, status, price, created_at)
- [ ] Crear modelo CourseMaterial (id, course_id, title, type, url, order)
- [ ] Implementar endpoint POST /api/courses (crear curso - teacher)
  - Validar que usuario sea teacher aprobado
  - Marcar curso como "pending_approval"
  - Guardar materiales asociados
- [ ] Implementar endpoint GET /api/courses (listar cursos públicos)
- [ ] Implementar endpoint GET /api/courses/:id (detalle curso)
- [ ] Implementar endpoint PUT /api/courses/:id (editar curso - teacher)
- [ ] Implementar endpoint DELETE /api/courses/:id (eliminar curso - teacher)
- [ ] Implementar endpoint GET /api/admin/courses/pending (cursos pendientes - admin)
- [ ] Implementar endpoint PUT /api/admin/courses/:id/approve (aprobar curso - admin)
- [ ] Implementar endpoint PUT /api/admin/courses/:id/reject (rechazar curso - admin)
- [ ] Configurar Multer para subida de archivos
- [ ] Integrar Cloudinary para almacenar PDFs y videos
- [ ] Crear endpoint POST /api/upload (subir archivos a Cloudinary)

### Frontend - Epic 2
- [ ] Crear types: Course, CourseMaterial, CourseStatus
- [ ] Crear courseStore con Zustand
- [ ] Crear course.service.ts
- [ ] Crear upload.service.ts (Cloudinary)
- [ ] Crear hook useFileUpload()
- [ ] Crear página CreateCourse (teacher)
  - Formulario título y descripción
  - Subida de materiales (PDF, video, links)
  - Preview de materiales
  - Material UI File Upload
- [ ] Crear página EditCourse (teacher)
- [ ] Crear página CoursesList (pública)
  - Grid de cursos
  - Filtros por categoría/precio
  - Búsqueda
- [ ] Crear página CourseDetail
  - Información del curso
  - Lista de materiales
  - Botón de inscripción
  - Video player / PDF viewer
- [ ] Crear componente CourseCard
- [ ] Crear componente VideoPlayer
- [ ] Crear componente PdfViewer
- [ ] Crear página CourseApproval (admin)
  - Lista de cursos pendientes
  - Aprobar/Rechazar
  - Vista previa del curso

### Testing Fase 3
- [ ] Probar creación de curso por teacher
- [ ] Probar subida de archivos a Cloudinary
- [ ] Probar aprobación/rechazo por admin
- [ ] Probar listado de cursos públicos
- [ ] Probar visualización de materiales
- [ ] Probar edición de cursos

---

## FASE 4: INSCRIPCIONES Y ACCESO A CURSOS (2-3 días)

### Backend - Epic 2 (continuación)
- [ ] Crear modelo Enrollment (id, student_id, course_id, status, enrolled_at, progress)
- [ ] Implementar endpoint POST /api/enrollments (inscribir estudiante)
  - Validar si curso es gratuito o pago
  - Si es gratuito, inscribir directamente
  - Si es pago, marcar como "pending_payment"
- [ ] Implementar endpoint GET /api/enrollments/my-courses (cursos del estudiante)
- [ ] Implementar endpoint GET /api/courses/:id/students (estudiantes del curso - teacher)
- [ ] Implementar endpoint PUT /api/enrollments/:id/progress (actualizar progreso)

### Frontend - Epic 2 (continuación)
- [ ] Crear types: Enrollment
- [ ] Actualizar courseStore para manejar inscripciones
- [ ] Crear página StudentDashboard
  - Mis cursos activos
  - Progreso en cada curso
  - Acceso rápido a materiales
- [ ] Crear página MyCourses
  - Lista de cursos inscritos
  - Barra de progreso
- [ ] Crear página CourseView (estudiante)
  - Contenido del curso
  - Materiales disponibles
  - Marcar como completado
- [ ] Crear componente EnrollmentButton
- [ ] Crear página TeacherDashboard
  - Mis cursos creados
  - Estadísticas de inscripciones
- [ ] Crear página StudentsList (teacher)
  - Lista de estudiantes por curso
  - Progreso de cada estudiante

### Testing Fase 4
- [ ] Probar inscripción a curso gratuito
- [ ] Probar inscripción a curso pago
- [ ] Probar acceso a contenido del curso
- [ ] Probar actualización de progreso
- [ ] Probar visualización de estudiantes (teacher)

---

## FASE 5: FOROS DE COMUNICACIÓN (3-4 días)

### Backend - Epic 3
- [ ] Crear modelo ForumPost (id, course_id, user_id, message, created_at)
- [ ] Crear modelo ForumReply (id, post_id, user_id, message, created_at)
- [ ] Implementar endpoint POST /api/courses/:id/forum (crear post)
- [ ] Implementar endpoint GET /api/courses/:id/forum (listar posts)
- [ ] Implementar endpoint POST /api/forum/:postId/reply (responder post)
- [ ] Implementar endpoint GET /api/forum/:postId/replies (listar respuestas)
- [ ] Implementar endpoint DELETE /api/forum/posts/:id (eliminar post)
- [ ] Validar que solo usuarios inscritos puedan participar

### Frontend - Epic 3
- [ ] Crear types: ForumPost, ForumReply
- [ ] Crear forumStore con Zustand
- [ ] Crear forum.service.ts
- [ ] Crear página CourseForum
  - Lista de posts
  - Ordenar por fecha (cronológico)
  - Crear nuevo post
- [ ] Crear componente ForumPost
  - Mostrar mensaje y autor
  - Botón para responder
  - Eliminar (si es propio)
- [ ] Crear componente ForumReply
  - Mostrar respuestas
  - Anidar respuestas
- [ ] Crear componente ForumPostForm
- [ ] Agregar link al foro desde CourseView
- [ ] Validar acceso solo para inscritos

### Testing Fase 5
- [ ] Probar creación de posts
- [ ] Probar respuestas a posts
- [ ] Probar ordenamiento cronológico
- [ ] Probar restricción de acceso
- [ ] Probar eliminación de posts propios

---

## FASE 6: EVALUACIONES Y QUIZZES (4-5 días)

### Backend - Epic 4
- [ ] Crear modelo Quiz (id, course_id, title, description, created_at)
- [ ] Crear modelo Question (id, quiz_id, question_text, type, order)
- [ ] Crear modelo QuestionOption (id, question_id, option_text, is_correct)
- [ ] Crear modelo StudentAnswer (id, student_id, quiz_id, question_id, selected_option_id, submitted_at)
- [ ] Crear modelo QuizResult (id, student_id, quiz_id, score, total_questions, submitted_at)
- [ ] Implementar endpoint POST /api/courses/:id/quizzes (crear quiz - teacher)
- [ ] Implementar endpoint GET /api/courses/:id/quizzes (listar quizzes)
- [ ] Implementar endpoint GET /api/quizzes/:id (obtener quiz)
- [ ] Implementar endpoint POST /api/quizzes/:id/submit (enviar respuestas)
  - Calcular nota automáticamente
  - Guardar resultado
  - Retornar nota y respuestas correctas
- [ ] Implementar endpoint GET /api/quizzes/:id/results (resultados - teacher)
- [ ] Implementar endpoint GET /api/students/:id/results (historial - student)

### Frontend - Epic 4
- [ ] Crear types: Quiz, Question, QuestionOption, QuizResult
- [ ] Crear quizStore con Zustand
- [ ] Crear quiz.service.ts
- [ ] Crear página CreateQuiz (teacher)
  - Formulario para crear quiz
  - Agregar preguntas múltiple opción
  - Marcar respuestas correctas
  - Ordenar preguntas
- [ ] Crear página QuizView (student)
  - Mostrar preguntas una por una
  - Selección de opciones
  - Timer (opcional)
  - Enviar respuestas
- [ ] Crear página QuizResults
  - Mostrar nota
  - Respuestas correctas e incorrectas
  - Explicaciones (si hay)
- [ ] Crear componente QuizQuestion
- [ ] Crear componente QuizProgress
- [ ] Crear página StudentProgress
  - Historial de quizzes
  - Notas obtenidas
  - Gráfico de progreso
- [ ] Agregar estadísticas a TeacherDashboard
  - Promedio de notas por curso
  - Quizzes completados

### Testing Fase 6
- [ ] Probar creación de quiz
- [ ] Probar respuesta a quiz
- [ ] Probar cálculo automático de nota
- [ ] Probar visualización de resultados
- [ ] Probar historial de evaluaciones
- [ ] Probar estadísticas del teacher

---

## FASE 7: PAGOS E INTEGRACIÓN (3-4 días)

### Backend - Epic 6
- [ ] Crear modelo Payment (id, student_id, course_id, amount, status, payment_method, created_at)
- [ ] Crear modelo Transaction (id, payment_id, gateway_id, status, details, created_at)
- [ ] Configurar Stripe/MercadoPago SDK
- [ ] Implementar endpoint POST /api/payments/create-session (crear sesión de pago)
- [ ] Implementar endpoint POST /api/payments/webhook (webhook de confirmación)
  - Verificar firma del webhook
  - Actualizar estado de pago
  - Activar inscripción al curso
  - Enviar email de confirmación
- [ ] Implementar endpoint GET /api/admin/payments (historial - admin)
- [ ] Implementar endpoint GET /api/payments/my-transactions (historial - student)

### Frontend - Epic 6
- [ ] Crear types: Payment, Transaction
- [ ] Crear payment.service.ts
- [ ] Configurar claves de Stripe/MercadoPago
- [ ] Crear página Checkout
  - Resumen del curso
  - Botón "Pagar con Stripe/MercadoPago"
  - Redirección a gateway
- [ ] Crear página PaymentSuccess
  - Confirmación de pago
  - Link al curso
- [ ] Crear página PaymentFailed
  - Mensaje de error
  - Reintentar pago
- [ ] Crear página PaymentHistory (admin)
  - Lista de transacciones
  - Filtros por fecha, estado
  - Exportar a CSV
- [ ] Actualizar EnrollmentButton para cursos pagos
  - Mostrar precio
  - Redirigir a checkout

### Testing Fase 7
- [ ] Probar creación de sesión de pago
- [ ] Probar pago exitoso (modo test)
- [ ] Probar webhook de confirmación
- [ ] Probar activación de inscripción
- [ ] Probar historial de pagos
- [ ] Probar pago fallido

---

## FASE 8: DASHBOARDS COMPLETOS (2-3 días)

### Frontend - Epic 5
- [ ] Mejorar AdminDashboard
  - Total de usuarios (por rol)
  - Total de cursos (aprobados/pendientes)
  - Total de pagos (hoy, semana, mes)
  - Gráficos con recharts
  - Últimas actividades
- [ ] Mejorar TeacherDashboard
  - Mis cursos
  - Total estudiantes
  - Ingresos generados
  - Cursos más populares
  - Notificaciones de nuevos estudiantes
- [ ] Mejorar StudentDashboard
  - Cursos en progreso
  - Próximos quizzes
  - Notificaciones del foro
  - Recomendaciones de cursos
- [ ] Crear componente StatCard (tarjeta de estadística)
- [ ] Crear componente RecentActivity
- [ ] Crear componente CourseProgress
- [ ] Agregar gráficos con Recharts

### Testing Fase 8
- [ ] Probar visualización de estadísticas
- [ ] Probar actualización en tiempo real
- [ ] Probar gráficos
- [ ] Probar notificaciones

---

## FASE 9: SEGURIDAD Y MANTENIMIENTO (2-3 días)

### Backend - Epic 7
- [ ] Implementar renovación automática de JWT
  - Refresh token
  - Endpoint /api/auth/refresh
- [ ] Configurar expiración de tokens (configurable)
- [ ] Implementar rate limiting (express-rate-limit)
- [ ] Agregar validación de inputs (express-validator)
- [ ] Implementar logs de actividad
- [ ] Configurar backups automáticos de Supabase
  - Daily backups
  - Retención de 30 días
- [ ] Implementar endpoint POST /api/admin/backup (crear backup manual)
- [ ] Implementar endpoint POST /api/admin/restore (restaurar backup)
- [ ] Agregar sanitización de datos
- [ ] Implementar CORS correctamente
- [ ] Agregar helmet para security headers

### Frontend - Epic 7
- [ ] Implementar renovación automática de token
- [ ] Agregar interceptor de Axios para refresh token
- [ ] Manejar expiración de sesión
- [ ] Agregar validaciones de formularios robustas
- [ ] Implementar manejo global de errores
- [ ] Agregar logs de errores (Sentry/LogRocket)

### Testing Fase 9
- [ ] Probar renovación de token
- [ ] Probar expiración de sesión
- [ ] Probar rate limiting
- [ ] Probar validaciones
- [ ] Probar backups y restore

---

## FASE 10: UI/UX Y OPTIMIZACIÓN (3-4 días)

### Frontend
- [ ] Personalizar tema de Material UI
  - Colores corporativos
  - Tipografía
  - Componentes custom
- [ ] Crear página Home (landing page)
  - Hero section
  - Cursos destacados
  - Testimonios
  - Call to action
- [ ] Crear página About
- [ ] Crear página Contact
- [ ] Mejorar responsive design
  - Mobile first
  - Tablet
  - Desktop
- [ ] Agregar dark mode (opcional)
- [ ] Implementar skeleton loaders
- [ ] Agregar animaciones con Framer Motion (opcional)
- [ ] Optimizar imágenes y assets
- [ ] Implementar lazy loading
- [ ] Agregar notificaciones con Snackbar
- [ ] Crear componente NotificationProvider
- [ ] Mejorar accesibilidad (ARIA labels)

### Testing Fase 10
- [ ] Probar en diferentes dispositivos
- [ ] Probar en diferentes navegadores
- [ ] Validar responsive design
- [ ] Testear accesibilidad

---

## FASE 11: TESTING COMPLETO (2-3 días)

### Backend Testing
- [ ] Unit tests con Jest
  - Controllers
  - Services
  - Middlewares
- [ ] Integration tests
  - Endpoints principales
  - Flujos completos
- [ ] Probar todas las validaciones
- [ ] Probar manejo de errores
- [ ] Probar rate limiting

### Frontend Testing
- [ ] Probar todos los flujos de usuario
  - Registro → Login → Dashboard
  - Crear curso → Aprobar → Inscribirse
  - Realizar quiz → Ver resultados
  - Realizar pago → Acceder curso
- [ ] Probar validaciones de formularios
- [ ] Probar protección de rutas
- [ ] Probar manejo de errores
- [ ] Performance testing (Lighthouse)

### User Acceptance Testing
- [ ] Probar con usuarios reales
- [ ] Recopilar feedback
- [ ] Ajustar según feedback

---

## FASE 12: DEPLOYMENT (2-3 días)

### Database
- [ ] Verificar configuración de Supabase
- [ ] Configurar políticas de RLS (Row Level Security)
- [ ] Verificar índices
- [ ] Configurar backups automáticos

### Backend Deployment
- [ ] Configurar variables de entorno en Render/Railway
- [ ] Subir código a repositorio
- [ ] Conectar repositorio con Render/Railway
- [ ] Configurar dominio personalizado
- [ ] Configurar SSL
- [ ] Configurar logs y monitoreo
- [ ] Verificar conexión a Supabase
- [ ] Verificar webhooks de pago

### Frontend Deployment
- [ ] Configurar variables de entorno en Vercel
- [ ] Subir código a repositorio
- [ ] Conectar repositorio con Vercel
- [ ] Configurar dominio personalizado
- [ ] Configurar redirects y rewrites
- [ ] Optimizar build
- [ ] Verificar que apunte al backend correcto

### Post-Deployment
- [ ] Probar aplicación en producción
- [ ] Verificar todos los flujos
- [ ] Probar pagos en modo producción
- [ ] Configurar monitoreo de errores
- [ ] Configurar analytics
- [ ] Crear documentación de deployment

---

## FASE 13: DOCUMENTACIÓN (1-2 días)

### Backend Documentation
- [ ] Documentar API con Swagger/Postman
- [ ] Documentar variables de entorno
- [ ] Documentar estructura de base de datos
- [ ] Crear README del backend
- [ ] Documentar endpoints principales

### Frontend Documentation
- [ ] Documentar estructura de carpetas
- [ ] Documentar stores de Zustand
- [ ] Documentar componentes principales
- [ ] Crear README del frontend
- [ ] Documentar flujos de usuario

### General Documentation
- [ ] Manual de usuario (Admin)
- [ ] Manual de usuario (Teacher)
- [ ] Manual de usuario (Student)
- [ ] Guía de despliegue
- [ ] Troubleshooting común

---

## FASE 14: MANTENIMIENTO Y MEJORAS (Ongoing)

### Monitoreo
- [ ] Configurar alertas de errores
- [ ] Monitorear performance
- [ ] Revisar logs regularmente
- [ ] Monitorear uso de recursos

### Mejoras Futuras
- [ ] Notificaciones push
- [ ] Chat en vivo
- [ ] Certificados de finalización
- [ ] Gamificación (badges, puntos)
- [ ] Integración con Google Calendar
- [ ] App móvil (React Native)
- [ ] Sistema de reseñas y calificaciones
- [ ] Recomendaciones personalizadas con ML

---

## RESUMEN DE TIEMPOS ESTIMADOS

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 0 | Preparación del entorno | 1-2 días |
| 1 | Autenticación y roles | 3-5 días |
| 2 | Gestión de usuarios | 2-3 días |
| 3 | Gestión de cursos | 4-6 días |
| 4 | Inscripciones | 2-3 días |
| 5 | Foros | 3-4 días |
| 6 | Evaluaciones | 4-5 días |
| 7 | Pagos | 3-4 días |
| 8 | Dashboards | 2-3 días |
| 9 | Seguridad | 2-3 días |
| 10 | UI/UX | 3-4 días |
| 11 | Testing | 2-3 días |
| 12 | Deployment | 2-3 días |
| 13 | Documentación | 1-2 días |

**TOTAL ESTIMADO: 34-50 días (7-10 semanas)**

---

## PRIORIDADES

### MUST HAVE (MVP)
- Autenticación y roles
- Crear y aprobar cursos
- Inscripciones (gratuitas)
- Visualización de contenido
- Dashboards básicos

### SHOULD HAVE
- Foros
- Quizzes
- Pagos
- Estadísticas avanzadas

### COULD HAVE
- Dark mode
- Notificaciones push
- Certificados
- Chat en vivo

### WON'T HAVE (Para v2)
- App móvil
- Gamificación
- ML/AI features

---

## NOTAS IMPORTANTES

1. **Trabajar por EPICs**: Completar un EPIC antes de pasar al siguiente
2. **Testing continuo**: Probar cada feature antes de continuar
3. **Git workflow**: Hacer commits frecuentes con mensajes descriptivos
4. **Code reviews**: Si trabajas en equipo, hacer PR reviews
5. **Documentar mientras desarrollas**: No dejar documentación para el final
6. **Backups regulares**: Hacer backups de la DB regularmente
7. **Security first**: No descuidar la seguridad en ninguna fase