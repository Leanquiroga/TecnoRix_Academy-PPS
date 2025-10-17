import { supabaseAdmin } from './src/config/supabase'

async function createAdmin() {
  try {
    const email = 'admin@tecnorx.com'
    const password = 'Admin123!'
    const name = 'Administrador'

    console.log('🔄 Creando usuario admin en Supabase Auth...\n')

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name,
      }
    })

    if (authError) {
      // Si el usuario ya existe en auth, intentar obtenerlo
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuario ya existe en Auth, buscando...')
        
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('❌ Error al listar usuarios:', listError)
          return
        }

        const existingAuthUser = users.find(u => u.email === email)
        
        if (!existingAuthUser) {
          console.error('❌ No se pudo encontrar el usuario en Auth')
          return
        }

        console.log('✅ Usuario encontrado en Auth:', existingAuthUser.id)

        // 2. Actualizar o crear en la tabla users
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        if (existingUser) {
          // Actualizar usuario existente
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              role: 'admin',
              status: 'active',
              auth_user_id: existingAuthUser.id
            })
            .eq('email', email)

          if (updateError) {
            console.error('❌ Error al actualizar usuario:', updateError)
            return
          }

          console.log('\n✅ Usuario actualizado a ADMIN exitosamente!')
        } else {
          // Crear en tabla users
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              auth_user_id: existingAuthUser.id,
              email,
              name,
              role: 'admin',
              status: 'active'
            })

          if (insertError) {
            console.error('❌ Error al insertar usuario:', insertError)
            return
          }

          console.log('\n✅ Usuario ADMIN creado exitosamente!')
        }
      } else {
        console.error('❌ Error al crear usuario en Auth:', authError)
        return
      }
    } else {
      console.log('✅ Usuario creado en Supabase Auth:', authData.user.id)

      // 2. Crear en la tabla users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email,
          name,
          role: 'admin',
          status: 'active'
        })

      if (insertError) {
        console.error('❌ Error al insertar en tabla users:', insertError)
        return
      }

      console.log('\n✅ Usuario ADMIN creado exitosamente!')
    }

    console.log('\n' + '═'.repeat(50))
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 Nombre:', name)
    console.log('🎯 Rol: ADMIN')
    console.log('🟢 Status: active')
    console.log('═'.repeat(50))
    console.log('\n💡 Usa estas credenciales para hacer login en:')
    console.log('   http://localhost:5173/login')
    console.log('\n📍 Luego accede al panel de admin en:')
    console.log('   http://localhost:5173/admin')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

createAdmin()
