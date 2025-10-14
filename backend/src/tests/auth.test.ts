import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testAuthFlow() {
  try {
    // 1. Registro de usuario (estudiante)
    console.log('\n1. Probando registro de estudiante...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Student',
      email: 'test.student@example.com',
      password: 'test1234',
      role: 'student'
    });
    console.log('✅ Registro exitoso:', registerResponse.data);

    // 2. Login
    console.log('\n2. Probando login...');
    interface LoginResponseData {
      token: string;
      refreshToken: string;
      [key: string]: any;
    }
    const loginResponse = await axios.post<LoginResponseData>(`${API_URL}/auth/login`, {
      email: 'test.student@example.com',
      password: 'test1234'
    });
    console.log('✅ Login exitoso:', loginResponse.data);

    const { token } = loginResponse.data;

    // 3. Get /me
    console.log('\n3. Probando endpoint /me...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ /me exitoso:', meResponse.data);

    // 4. Refresh token
    console.log('\n4. Probando refresh token...');
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: loginResponse.data.refreshToken
    });
    console.log('✅ Refresh token exitoso:', refreshResponse.data);

    // 5. Registro de profesor (debe quedar pending)
    console.log('\n5. Probando registro de profesor...');
    const teacherResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Teacher',
      email: 'test.teacher@example.com',
      password: 'test1234',
      role: 'teacher'
    });
    console.log('✅ Registro de profesor exitoso (pending_validation):', teacherResponse.data);

  } catch (error: any) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
console.log('🔥 Iniciando pruebas de autenticación...');
testAuthFlow();