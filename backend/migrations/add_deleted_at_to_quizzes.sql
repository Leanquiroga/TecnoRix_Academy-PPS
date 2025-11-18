-- Migración: Agregar columna deleted_at a la tabla quizzes para soft delete
-- Fecha: 2024-11-18

-- Agregar columna deleted_at
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Crear índice para mejorar consultas que filtren por deleted_at
CREATE INDEX IF NOT EXISTS idx_quizzes_deleted_at ON quizzes(deleted_at);

-- Comentarios para documentación
COMMENT ON COLUMN quizzes.deleted_at IS 'Timestamp de eliminación lógica (soft delete). NULL indica que el quiz está activo.';
