// Servidor Socket.io para chat en tiempo real
// Ejecutar: npm run chat:server

import { Server } from 'socket.io'
import { createServer } from 'http'
import { getCorsHeaders } from './cors.js'
import { MAX_MESSAGES_DISPLAY } from './config.js'

const PORT = process.env.CHAT_PORT || 8000

// Crear servidor HTTP
const server = createServer((req, res) => {
  // Manejar CORS para peticiones HTTP
  const CORS_HEADERS = getCorsHeaders(req)
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'Chat server running', port: PORT }))
})

// Crear servidor Socket.io con CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.LOCAL_URL,
      process.env.VERCEL_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Almacenar mensajes en memoria (en producción usar Redis o DB)
const messages = []
// Almacenar usuarios conectados
const connectedUsers = new Map()

// Función para obtener lista de usuarios conectados
const getConnectedUsersList = () => {
  return Array.from(connectedUsers.values())
}

// Función para emitir lista de usuarios a todos
const emitUsersList = () => {
  const usersList = getConnectedUsersList()
  io.emit('users:list', usersList)
}

io.on('connection', socket => {
  // console.log('✅ Cliente conectado:', socket.id)

  // Enviar historial al nuevo cliente (últimos MAX_MESSAGES_DISPLAY mensajes)
  if (messages.length > 0) {
    socket.emit('message:history', messages.slice(-MAX_MESSAGES_DISPLAY))
  }

  // Enviar lista de usuarios conectados
  socket.emit('users:list', getConnectedUsersList())

  // Cuando un usuario se une
  socket.on('user:join', userData => {
    // console.log(`👤 Usuario ${userData.userName} se unió al chat`, userData)
    socket.userData = userData
    // Guardar usuario conectado
    connectedUsers.set(socket.id, {
      id: userData.id,
      userName: userData.userName,
      fullName: userData.fullName,
      socketId: socket.id,
    })
    // console.log(`📋 Total de usuarios conectados: ${connectedUsers.size}`)
    // console.log(`📋 Lista de usuarios:`, Array.from(connectedUsers.values()))
    // Notificar a otros usuarios
    socket.broadcast.emit('user:joined', {
      userName: userData.userName,
      message: `${userData.userName} se unió al chat`,
    })
    // Enviar lista actualizada a todos (incluyendo al que se acaba de conectar)
    emitUsersList()
  })

  // Cuando se recibe un mensaje
  socket.on('message:send', messageData => {
    const message = {
      id: Date.now().toString(),
      text: messageData.text,
      user: messageData.user || socket.userData?.userName || 'Usuario',
      userId: messageData.userId || socket.userData?.id,
      timestamp: new Date().toISOString(),
    }

    // Guardar mensaje (máximo MAX_MESSAGES_DISPLAY en memoria)
    messages.push(message)
    if (messages.length > MAX_MESSAGES_DISPLAY) {
      messages.shift()
    }

    // Enviar a todos los clientes
    io.emit('message:new', message)

    // console.log(`💬 ${message.user}: ${message.text}`)
  })

  // Cuando un usuario empieza a escribir
  socket.on('typing:start', () => {
    if (socket.userData) {
      const typingData = {
        userId: socket.userData.id,
        userName: socket.userData.userName,
        fullName: socket.userData.fullName,
        isTyping: true,
      }
      // console.log('⌨️ Usuario escribiendo:', typingData)
      // Notificar a todos excepto al que está escribiendo
      socket.broadcast.emit('typing:status', typingData)
    }
  })

  // Cuando un usuario deja de escribir
  socket.on('typing:stop', () => {
    if (socket.userData) {
      const typingData = {
        userId: socket.userData.id,
        userName: socket.userData.userName,
        fullName: socket.userData.fullName,
        isTyping: false,
      }
      // console.log('⌨️ Usuario dejó de escribir:', typingData)
      // Notificar a todos excepto al que dejó de escribir
      socket.broadcast.emit('typing:status', typingData)
    }
  })

  // Cuando un usuario se desconecta
  socket.on('disconnect', () => {
    // console.log('❌ Cliente desconectado:', socket.id)
    if (socket.userData) {
      // Remover usuario de la lista
      connectedUsers.delete(socket.id)
      socket.broadcast.emit('user:left', {
        userName: socket.userData.userName,
        message: `${socket.userData.userName} dejó el chat`,
      })
      // Enviar lista actualizada a todos
      emitUsersList()
    }
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Servidor de chat Socket.io corriendo en puerto ${PORT}`)
  console.log(`📡 Conecta desde: http://localhost:${PORT}`)
})

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('Cerrando servidor de chat...')
  io.close(() => {
    server.close(() => {
      process.exit(0)
    })
  })
})
