import { Server } from 'socket.io'
import { createServer } from 'http'

const PORT = process.env.PORT || 8080
const server = createServer((req, res) => {
  res.writeHead(200)
  res.end('Socket.io Chat Running')
})
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
})
const messages = []
io.on('connection', socket => {
  if(messages.length) socket.emit('message:history', messages.slice(-50))

  socket.on('user:join', userData => {
    socket.userData = userData
  })

  socket.on('user:left', userData => {
    socket.userData = userData
  })

  socket.on('message:send', messageData => {
    const msg = {
      id: Date.now().toString(),
      text: messageData.text,
      user: messageData.user || socket.userData?.userName || 'Usuario',
      userId: messageData.userId || socket.userData?.id,
      timestamp: new Date().toISOString(),
    }
    messages.push(msg)
    if (messages.length > 100) messages.shift()
    io.emit('message:new', msg)
  })
})

server.listen(PORT, () => {
  console.log('Chat corriendo en puerto', PORT)
})