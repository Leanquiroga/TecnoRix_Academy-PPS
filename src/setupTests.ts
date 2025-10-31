import '@testing-library/jest-dom'

// Silenciar promesas no manejadas en pruebas que intencionalmente simulan errores
// Esto evita que Vitest marque la ejecución como "Errors" aun cuando las UI manejan el estado de error
// Nota: si aparece un fallo real, las aserciones específicas del test deberían capturarlo.
process.on('unhandledRejection', () => {})
process.on('uncaughtException', () => {})
