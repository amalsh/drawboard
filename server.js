let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
/***
Temp hold user drawing board for each user accesing
If this is in real world this will be in sql,nosql DB or redis etc. depending on the requirement
**/
const allArtBoards = [];

app.use("/js", express.static(__dirname + "/js"));

app.get("/*", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

/*
Socket communitcation
Handle multi user communication
*/
io.on("connection", function(socket) {
  const boardId = socket.handshake.query && socket.handshake.query.boardId;
  if (!boardId) return;

  /*
   Send first response to newly joined users
   We can optimize this by implementing rooms
  */
  socket.emit("welcome", allArtBoards[boardId]);

  /**
   Broad cast drawing events
  */
  socket.on(`drawing${boardId}`, function(canvasJson) {
    if (canvasJson.objects) {
      const newData = (allArtBoards[boardId] = canvasJson);
      socket.broadcast.emit(`drawing${boardId}`, newData);
    }
  });
});

//node server
http.listen(3000, function() {
  console.log("listening on *:3000");
});
