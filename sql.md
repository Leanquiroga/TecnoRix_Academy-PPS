-- ============================================
-- TECNORIX ACADEMY - SUPABASE DATABASE SCHEMA v4.1
-- ============================================

-- 1️⃣ EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2️⃣ TABLAS PRINCIPALES
-- ============================================

-- TABLA: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_validation', 'suspended')),
    avatar_url TEXT,
    bio TEXT,
    country VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'draft')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    thumbnail_url TEXT,
    category VARCHAR(100),
    duration_hours INTEGER,
    level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    language VARCHAR(20) DEFAULT 'es',
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- TABLA: course_materials
CREATE TABLE course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'pdf', 'link', 'text')),
    url TEXT,
    content TEXT,
    preview_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- TABLA: enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_payment', 'completed', 'cancelled')),
    progress DECIMAL(5, 2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
    final_grade DECIMAL(5, 2),
    certificate_url TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(student_id, course_id)
);

-- TABLA: quizzes
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score DECIMAL(5, 2) DEFAULT 70.00,
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- TABLA: questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false', 'multiple_answer')),
    points DECIMAL(5, 2) DEFAULT 1.00,
    order_index INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: question_options
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: quiz_attempts
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    total_points DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    passed BOOLEAN,
    time_taken_minutes INTEGER,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (student_id, quiz_id, attempt_number)
);

-- TABLA: student_answers
CREATE TABLE student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL,
    points_earned DECIMAL(5, 2) DEFAULT 0.00,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: forum_posts
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    reactions JSONB DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- TABLA: forum_replies
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE SET NULL,
    likes_count INTEGER DEFAULT 0,
    reactions JSONB DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- TABLA: payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'mercadopago', 'paypal')),
    gateway_payment_id VARCHAR(255),
    receipt_url TEXT,
    invoice_number VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- TABLA: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    gateway_transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    details JSONB,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3️⃣ ÍNDICES
-- ============================================
-- Índices para campos verificados y búsqueda
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified_at);
CREATE INDEX IF NOT EXISTS idx_courses_tags ON courses USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- Índices para optimizar políticas RLS
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Índices para joins frecuentes
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);

-- ============================================
-- 4️⃣ TRIGGERS Y FUNCIONES
-- ============================================

-- Trigger de actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas clave
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_modtime BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quizzes_modtime BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_forum_posts_modtime BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_forum_replies_modtime BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger: marcar completed_at en pagos
CREATE OR REPLACE FUNCTION mark_payment_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_mark_payment_completed
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION mark_payment_completed();

-- Trigger para calcular resultados de quiz (corregido a AFTER)
CREATE OR REPLACE FUNCTION calculate_quiz_results()
RETURNS TRIGGER AS $$
DECLARE
    total_points_quiz DECIMAL(5,2);
    earned_points_student DECIMAL(5,2);
    quiz_passing_score DECIMAL(5,2);
BEGIN
    SELECT SUM(q.points) INTO total_points_quiz
    FROM questions q WHERE q.quiz_id = NEW.quiz_id;

    SELECT COALESCE(SUM(sa.points_earned), 0) INTO earned_points_student
    FROM student_answers sa WHERE sa.attempt_id = NEW.id;

    SELECT passing_score INTO quiz_passing_score
    FROM quizzes WHERE id = NEW.quiz_id;

    UPDATE quiz_attempts
    SET
        total_points = total_points_quiz,
        score = earned_points_student,
        percentage = CASE WHEN total_points_quiz > 0 THEN (earned_points_student / total_points_quiz) * 100 ELSE 0 END,
        passed = CASE WHEN (earned_points_student / total_points_quiz) * 100 >= quiz_passing_score THEN true ELSE false END
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_calculate_quiz_results
AFTER INSERT OR UPDATE ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION calculate_quiz_results();

-- ============================================
-- 5️⃣ SEGURIDAD RLS
-- ============================================
-- Habilitar RLS en todas las tablas necesarias
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Forzar RLS en todas las tablas
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE courses FORCE ROW LEVEL SECURITY;
ALTER TABLE enrollments FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE forum_posts FORCE ROW LEVEL SECURITY;
ALTER TABLE quizzes FORCE ROW LEVEL SECURITY;
ALTER TABLE questions FORCE ROW LEVEL SECURITY;
ALTER TABLE question_options FORCE ROW LEVEL SECURITY;
ALTER TABLE student_answers FORCE ROW LEVEL SECURITY;
ALTER TABLE forum_replies FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Funciones auxiliares para RLS
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS VARCHAR AS $$
DECLARE
  user_role VARCHAR;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE auth_user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nueva función para obtener el ID del usuario de forma optimizada
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM public.users WHERE auth_user_id = auth.uid();
  RETURN user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Revocar permisos por defecto
REVOKE EXECUTE ON FUNCTION get_user_id() FROM PUBLIC;
-- Otorgar permisos solo a roles autenticados
GRANT EXECUTE ON FUNCTION get_user_id() TO authenticated;

-- Políticas Admin
CREATE POLICY "Admins have full access" ON users
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON courses
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON enrollments
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON payments
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON quiz_attempts
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON forum_posts
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Políticas Students y Teachers (optimizadas)
CREATE POLICY "Students can view approved courses" ON courses
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Students can manage their enrollments" ON enrollments
  FOR ALL
  TO authenticated
  USING (student_id = get_user_id())
  WITH CHECK (student_id = get_user_id());

CREATE POLICY "Teachers can manage their own courses" ON courses
  FOR ALL
  TO authenticated
  USING (teacher_id = get_user_id())
  WITH CHECK (teacher_id = get_user_id());

CREATE POLICY "Teachers can view enrollments in their courses" ON enrollments
  FOR SELECT
  USING (course_id IN (
    SELECT id FROM courses WHERE teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Users can view and edit their own profile" ON users
  FOR ALL
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Políticas para quizzes
CREATE POLICY "Teachers can manage their own quizzes" ON quizzes
  FOR ALL
  USING (course_id IN (
    SELECT id FROM courses WHERE teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (course_id IN (
    SELECT id FROM courses WHERE teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Students can view quizzes from enrolled courses" ON quizzes
  FOR SELECT
  USING (course_id IN (
    SELECT course_id FROM enrollments WHERE student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

-- Políticas para questions y question_options
CREATE POLICY "Teachers can manage questions in their quizzes" ON questions
  FOR ALL
  USING (quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    WHERE c.teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    WHERE c.teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Students can view questions from enrolled courses" ON questions
  FOR SELECT
  USING (quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Question options follow question access" ON question_options
  FOR ALL
  USING (question_id IN (
    SELECT id FROM questions WHERE quiz_id IN (
      SELECT q.id FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE c.teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR c.id IN (
        SELECT course_id FROM enrollments 
        WHERE student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  ));

-- Políticas para student_answers
CREATE POLICY "Students can manage their own answers" ON student_answers
  FOR ALL
  USING (attempt_id IN (
    SELECT id FROM quiz_attempts 
    WHERE student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (attempt_id IN (
    SELECT id FROM quiz_attempts 
    WHERE student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Teachers can view answers for their courses" ON student_answers
  FOR SELECT
  USING (attempt_id IN (
    SELECT qa.id FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    WHERE c.teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ));

-- Políticas para forum_replies
CREATE POLICY "Users can manage their own replies" ON forum_replies
  FOR ALL
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view replies in accessible posts" ON forum_replies
  FOR SELECT
  USING (post_id IN (
    SELECT id FROM forum_posts
    WHERE course_id IN (
      SELECT id FROM courses WHERE teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      UNION
      SELECT course_id FROM enrollments WHERE student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  ));

-- Políticas para notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ✅ FIN DEL SCRIPT
