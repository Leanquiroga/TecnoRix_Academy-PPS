import dotenv from 'dotenv'
import app from './app'

dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   TecnoRix Academy Backend Server    ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}     ║
  ║   Status: 🚀 Running                  ║
  ╚═══════════════════════════════════════╝
  `)
})

export default app;
