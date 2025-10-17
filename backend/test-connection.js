import { supabase, supabaseAdmin } from './src/config/supabase.js';

console.log('🧪 Testing Supabase Connection...\n');

async function testConnection() {
  try {
    // Test 1: Client público
    console.log('1️⃣ Testing public client...');
    const { data: publicData, error: publicError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (publicError && publicError.code !== 'PGRST116') {
      console.log('❌ Public client error:', publicError.message);
    } else {
      console.log('✅ Public client connected');
    }

    // Test 2: Admin client
    console.log('\n2️⃣ Testing admin client...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.log('❌ Admin client error:', adminError.message);
    } else {
      console.log('✅ Admin client connected');
    }

      // Test 3: Verificar tablas existentes
      console.log('\n3️⃣ Checking database schema...');
      const knownTables = ['users', 'courses', 'enrollments', 'quizzes', 'questions', 
                           'question_options', 'quiz_attempts', 'student_answers',
                           'forum_posts', 'forum_replies', 'payments', 'transactions', 
                           'notifications', 'course_materials'];
    
      let foundTables = [];
      for (const table of knownTables) {
        const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
        if (!error || error.code !== '42P01') { // 42P01 = table doesn't exist
          foundTables.push(table);
        }
      }
    
      if (foundTables.length > 0) {
        console.log('✅ Database accessible');
        console.log(`\n📋 Tables found: ${foundTables.length}/${knownTables.length}`);
        foundTables.forEach((t, idx) => {
          console.log(`   ${idx + 1}. ${t}`);
        });
      } else {
        console.log('⚠️  No tables found in public schema');
        console.log('   (You need to create them first)');
      }

    console.log('\n📊 Summary:');
    console.log('- Supabase URL configured:', process.env.SUPABASE_URL ? '✅' : '❌');
    console.log('- Anon Key configured:', process.env.SUPABASE_KEY ? '✅' : '❌');
  console.log('- Service Role Key configured:', process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here' ? '✅' : '⚠️  (using placeholder)');
  console.log('- Tables created:', foundTables.length > 0 ? `✅ (${foundTables.length} found)` : '❌ (none found)');
    
    console.log('\n💡 Next Steps:');
    if (foundTables.length === 0) {
      console.log('1. Create tables in Supabase Dashboard or apply SQL from notes/propuestaDeBasesDeDatos.md');
    } else if (foundTables.length < knownTables.length) {
      console.log('1. Some tables are missing. Check your Supabase schema.');
      console.log(`   Missing: ${knownTables.filter(t => !foundTables.includes(t)).join(', ')}`);
    } else {
      console.log('1. ✅ All tables present! Ready to start FASE 1 (Authentication)');
    }
    console.log('2. Test backend: npm run dev (backend) → http://localhost:5000/health');
    console.log('3. Test frontend: npm run dev (root) → http://localhost:5173');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
