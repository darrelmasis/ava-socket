// Configuración compartida del chat
// Este archivo puede ser usado tanto por el servidor como por el cliente

// Límite configurable de mensajes a mantener en memoria (servidor) y mostrar (cliente)
export const MAX_MESSAGES_DISPLAY = parseInt(process.env.MAX_MESSAGES_DISPLAY || '6', 10)

// También se puede configurar desde variables de entorno
// Ejemplo: MAX_MESSAGES_DISPLAY=10 npm run chat:server

