let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
const allArtBoards = [];

app.use("/js", express.static(__dirname + "/js"));

app.get("/*", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  const boardId = socket.handshake.query && socket.handshake.query.boardId;
  if (!boardId) return;

  socket.emit("welcome", allArtBoards[boardId]);

  socket.on(`drawing${boardId}`, function(canvasJson) {
    if (canvasJson.objects) {
      const newData = (allArtBoards[boardId] = canvasJson);
      socket.broadcast.emit(`drawing${boardId}`, newData);
    }
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
});
