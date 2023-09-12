const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.listen(3000);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {
  1: [],
  2: [],
  3: [],
};

io.on('connection', (socket) => {
  console.log("Conexão detectada...");

  socket.on('join-room', ({ room, username }) => {
    socket.join(room);

    rooms[room].push({ username, id: socket.id });

    console.log(`Usuário ${username} entrou na sala ${room}`);
    console.log(`Usuários na sala ${room}:`, rooms[room]);

    socket.emit('user-ok', rooms[room]);
    socket.to(room).emit('list-update', {
      joined: username,
      list: rooms[room].map((user) => user.username),
    });
  });

  socket.on('disconnect', () => {
    for (const room of Object.keys(rooms)) {
      const userIndex = rooms[room].findIndex((user) => user.id === socket.id);
      if (userIndex !== -1) {
        const disconnectedUser = rooms[room][userIndex];
        rooms[room].splice(userIndex, 1);
        console.log(`Usuário ${disconnectedUser.username} desconectou da sala ${room}`);
        console.log(`Usuários na sala ${room}:`, rooms[room]);

        socket.to(room).emit('list-update', {
          left: disconnectedUser.username,
          list: rooms[room].map((user) => user.username),
        });
      }
    }
  });

  socket.on('send-msg', (txt, room) => {
    if (rooms[room]) {
        const userInRoom = rooms[room].find((user) => user.id === socket.id);
        if (userInRoom) {
            const username = userInRoom.username;
            let obj = {
                username: username,
                message: txt
            };

            io.to(room).emit('show-msg', { room: room, ...obj }); // Inclua a sala como parte do objeto enviado

            
        }
    }
});

});
