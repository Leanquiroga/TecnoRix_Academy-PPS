-- ============================================
-- TECNORIX ACADEMY - TEACHER REGISTRATION MIGRATION
-- ============================================
-- Fecha: 17 de noviembre de 2025
-- Fase: 6.5 - Sistema de Aplicación de Profesores
-- 
-- OBJETIVO:
-- Agregar tablas para gestionar perfiles y credenciales de profesores
-- que solicitan unirse a la plataforma como docentes.
-- 
-- CAMBIOS:
-- ✅ Tabla teacher_profiles para datos profesionales del profesor
-- ✅ Tabla teacher_credentials para documentos de verificación
-- ✅ Índices para optimizar consultas
-- ✅ Triggers para updated_at automático
-- ✅ Políticas RLS para seguridad
-- ============================================

-- ============================================
-- 1️⃣ TABLAS NUEVAS
-- ============================================

-- TABLA: teacher_profiles
-- Almacena información profesional extendida de profesores
CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    photo_url TEXT,
    headline VARCHAR(255) NOT NULL, -- Ej: "Ingeniero de Software con 10 años de experiencia"
    bio TEXT NOT NULL,
    years_experience INTEGER,
    linkedin_url TEXT,
    phone VARCHAR(20),
    profile_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT valid_years_experience CHECK (years_experience >= 0 AND years_experience <= 50),
    CONSTRAINT valid_bio_length CHECK (LENGTH(bio) BETWEEN 150 AND 500)
);

-- TABLA: teacher_credentials
-- Almacena documentos de verificación profesional
CREATE TABLE teacher_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_type VARCHAR(50) NOT NULL CHECK (credential_type IN ('degree', 'certification', 'work_experience')),
    institution VARCHAR(255) NOT NULL, -- Universidad o Empresa
    document_url TEXT NOT NULL, -- PDF en Cloudinary
    year_obtained INTEGER,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin que aprobó/rechazó
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT valid_year_obtained CHECK (year_obtained >= 1950 AND year_obtained <= EXTRACT(YEAR FROM NOW()))
);

-- ============================================
-- 2️⃣ ÍNDICES
-- ============================================

-- Índices para teacher_profiles
CREATE INDEX idx_teacher_profiles_user_id ON teacher_profiles(user_id);

-- Índices para teacher_credentials
CREATE INDEX idx_teacher_credentials_user_id ON teacher_credentials(user_id);
CREATE INDEX idx_teacher_credentials_status ON teacher_credentials(verification_status);
CREATE INDEX idx_teacher_credentials_verified_by ON teacher_credentials(verified_by);

-- Índice para búsqueda de profesores pendientes
CREATE INDEX idx_teacher_profiles_completed ON teacher_profiles(profile_completed_at);

-- ============================================
-- 3️⃣ TRIGGERS
-- ============================================

-- Trigger de actualización automática de updated_at
-- (Reutilizando la función existente update_updated_at_column)

CREATE TRIGGER update_teacher_profiles_modtime 
BEFORE UPDATE ON teacher_profiles 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_teacher_credentials_modtime 
BEFORE UPDATE ON teacher_credentials 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 4️⃣ SEGURIDAD RLS
-- ============================================

-- Habilitar RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_credentials ENABLE ROW LEVEL SECURITY;

-- Forzar RLS
ALTER TABLE teacher_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE teacher_credentials FORCE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - teacher_profiles
-- ============================================

-- Admins tienen acceso completo
CREATE POLICY "Admins have full access to teacher profiles" ON teacher_profiles
  FOR ALL 
  USING (get_my_role() = 'admin') 
  WITH CHECK (get_my_role() = 'admin');

-- Todos pueden ver perfiles de profesores (para mostrar en cursos)
CREATE POLICY "Users can view all teacher profiles" ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Profesores pueden crear su propio perfil
CREATE POLICY "Teachers can insert their own profile" ON teacher_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_user_id());

-- Profesores pueden actualizar su propio perfil
CREATE POLICY "Teachers can update their own profile" ON teacher_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = get_user_id())
  WITH CHECK (user_id = get_user_id());

-- ============================================
-- POLÍTICAS RLS - teacher_credentials
-- ============================================

-- Admins pueden ver todas las credenciales
CREATE POLICY "Admins can view all credentials" ON teacher_credentials
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Admins pueden actualizar credenciales (aprobar/rechazar)
CREATE POLICY "Admins can update all credentials" ON teacher_credentials
  FOR UPDATE
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Profesores pueden ver sus propias credenciales
CREATE POLICY "Teachers can view their own credentials" ON teacher_credentials
  FOR SELECT
  USING (user_id = get_user_id());

-- Profesores pueden insertar sus propias credenciales
CREATE POLICY "Teachers can insert their own credentials" ON teacher_credentials
  FOR INSERT
  WITH CHECK (user_id = get_user_id());

-- Profesores NO pueden actualizar credenciales una vez enviadas
-- (solo admin puede cambiar verification_status)

-- ============================================
-- 5️⃣ COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE teacher_profiles IS 'Perfiles profesionales extendidos de profesores';
COMMENT ON TABLE teacher_credentials IS 'Credenciales y documentos de verificación de profesores';

COMMENT ON COLUMN teacher_profiles.headline IS 'Título profesional breve (ej: "Ingeniero de Software Senior")';
COMMENT ON COLUMN teacher_profiles.bio IS 'Biografía profesional (150-500 caracteres)';
COMMENT ON COLUMN teacher_profiles.profile_completed_at IS 'Fecha en que el perfil fue completado y enviado para revisión';

COMMENT ON COLUMN teacher_credentials.credential_type IS 'Tipo de credencial: degree (título), certification (certificación), work_experience (experiencia laboral)';
COMMENT ON COLUMN teacher_credentials.document_url IS 'URL del documento PDF en Cloudinary';
COMMENT ON COLUMN teacher_credentials.verification_status IS 'Estado de verificación: pending, approved, rejected';
COMMENT ON COLUMN teacher_credentials.verified_by IS 'Admin que aprobó o rechazó la credencial';
COMMENT ON COLUMN teacher_credentials.rejection_reason IS 'Razón proporcionada por el admin al rechazar';

-- ============================================
-- 6️⃣ VERIFICACIÓN
-- ============================================

-- Verificar que las tablas fueron creadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('teacher_profiles', 'teacher_credentials')
ORDER BY table_name;

-- Verificar índices
SELECT 
    tablename, 
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('teacher_profiles', 'teacher_credentials')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('teacher_profiles', 'teacher_credentials')
ORDER BY tablename, policyname;

-- ✅ FIN DE LA MIGRACIÓN
-- ============================================
-- PRÓXIMOS PASOS:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Verificar que las tablas se crearon correctamente
-- 3. Crear backend/src/types/teacher.types.ts
-- 4. Crear backend/src/services/teacher.service.ts
-- 5. Crear backend/src/controllers/teacher.controller.ts
-- ============================================
