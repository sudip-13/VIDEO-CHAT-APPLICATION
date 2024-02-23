const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
dotenv.config({ path: "../.env.local" });
process.setMaxListeners(3);
const app = express();
const ioPort = process.env.IO_PORT;
const PORT = process.env.PORT;
const io = new Server({
  cors: true,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.json());

app.get("/api/generatesessionid", (req, res) => {
  const length = 9;
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomChar = alphabet.charAt(
      Math.floor(Math.random() * alphabet.length)
    );
    randomString += randomChar;
    if ((i + 1) % 3 === 0 && i !== length - 1) {
      randomString += "-";
    }
  }
  res.status(200).send({ token: randomString });
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  let clients = {};

  socket.on("join-room", ({ roomId, email, name }) => {
    clients[socket.id] = { roomId, email, name };
    console.log(`user ${name}(${email}) joined room ${roomId}`);
    emailToSocketMapping.set(email, socket.id);
    socketToEmailMapping.set(socket.id, email);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast
      .to(roomId)
      .emit("user-joined", { email: email, name: name, roomId: roomId });
  });

  socket.on("new-meeting", ({ name, email, roomId }) => {
    clients[socket.id] = { name, email, roomId };
    console.log(roomId, email);
    emailToSocketMapping.set(email, socket.id);
    socketToEmailMapping.set(socket.id, email);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast
      .to(roomId)
      .emit("user-joined", { email: email, name: name, roomId: roomId });
  });

  socket.on("call-user", ({ roomId, email, name, offer }) => {
    clients[socket.id] = { roomId, email, name, offer };
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(email);
    socket.to(socketId).emit("incomming-call", { from: fromEmail, offer });
  });

  socket.on("call-accept", ({ email, ans }) => {
    const socketId = emailToSocketMapping.get(email);
    socket.to(socketId).emit("call-accept", { ans });
  });
  socket.on("message", ({ message }) => {
    console.log("Received message:", message);
    emailToSocketMapping.set(email, socket.id);
    socketToEmailMapping.set(socket.id, email);
    socket.emit("message", message);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
app.listen(PORT, () => {
  console.log(`Server listening from http://localhost:${PORT}`);
});
io.listen(ioPort, () => {
  console.log(`Socket listening on http://localhost:${ioPort}`);
});
