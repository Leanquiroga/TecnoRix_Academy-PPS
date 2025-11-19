import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Importar configuración
import './config/supabase'
import './config/cloudinary'

const app: Express = express()

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logger middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Rutas
import authRoutes from './routes/auth.routes'
import adminRoutes from './routes/admin.routes'
import courseRoutes from './routes/course.routes'
import adminCourseRoutes from './routes/admin.courses.routes'
import uploadRoutes from './routes/upload.routes'
import publicUploadRoutes from './routes/public-upload.routes'
import enrollmentRoutes from './routes/enrollment.routes'
import forumRoutes from './routes/forum.routes'
import quizRoutes from './routes/quiz.routes'
import teacherRoutes from './routes/teacher.routes'
import userRoutes from './routes/user.routes'

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/admin/courses', adminCourseRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/public/upload', publicUploadRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api', teacherRoutes) // Teacher routes tienen sus propios prefijos /teacher y /admin
app.use('/api', forumRoutes)
app.use('/api', quizRoutes)
app.use('/api/users', userRoutes)

// Ruta de prueba
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'TecnoRix Academy API',
    version: '1.0.0',
    status: 'running'
  })
})

// Ruta de health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Manejador de errores global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// Manejador para rutas no encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

export default app
