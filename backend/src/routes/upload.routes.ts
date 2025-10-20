import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../config/multer'
import { uploadFileController } from '../controllers/upload.controller'

const router = Router()

// Proteger con autenticación
router.use(authMiddleware)

// POST /api/upload - Subir archivo (PDF o video)
// El middleware 'upload.single('file')' procesa el archivo del form-data
router.post('/', upload.single('file'), uploadFileController)

export default router
