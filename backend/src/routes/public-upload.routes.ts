import { Router } from 'express'
import { uploadPublicPdf } from '../config/multer'
import { publicUploadCredentialController } from '../controllers/upload.controller'

const router = Router()

// POST /api/public/upload - Subida pública de credenciales (PDF, máx 5MB)
router.post('/', uploadPublicPdf.single('file'), publicUploadCredentialController)

export default router
