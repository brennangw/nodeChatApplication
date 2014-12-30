//tell people entering or exsiting

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


function Room (roomName, roomPassword) {
    this.roomname = roomName;
    this.password = roomPassword;
    this.users = {};
    this.userslen = function() {
      var k;
      var l = 0;
      for (k in this.users){
        l = l + 1;
      }
      return l;
    };
}
var rooms = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    socket.on('disconnect', function(){

      if (socket.username != undefined && socket.roomname != undefined){
        //fix this next
        console.log(rooms.users)
        delete rooms[socket.roomname].users[socket.username];
        console.log(rooms.users)
        socket.leave(socket.roomname);
        console.log("length: " + rooms[socket.roomname].userslen())
        if (rooms[socket.roomname].userslen() == 0) {
          delete rooms[socket.roomname];
          console.log("roomdeleted");
        }
    };
  });

  socket.on('chat message', function(msg){
    io.to(socket.roomname).emit('chat message', msg, socket.username);
  });

  socket.on('join', function(roomname, password, username){
  	console.log("joining: " + roomname);
  	//does a room with that name exist?
    if (rooms[roomname] != undefined) {
          //is the password correct
          if(password == rooms[roomname].password){
            //yes, join the room
            //is the user name taken
            //yes
            if (rooms[roomname].users[username] == undefined){
              socket.roomname = roomname;
              socket.username = username;
              rooms[roomname].users[username] = socket;
              socket.join(roomname);
              socket.emit("joinresponse", "success", username)
            //no
            } else {
              i = 2;
              //get a new username
              newusername = username.concat(String(i));
              while(rooms[roomname].users[newusername] != undefined){
                i++;
                newusername = username.concat(String(i));
              }
              username = newusername;
              socket.roomname = roomname;
              socket.username = username;

              rooms[roomname].users[username] = socket;
              socket.join(roomname);
              socket.emit("joinresponse", "success", username)
            }
          } else {
            socket.emit("joinresponse", "wrongPassword","")
          }
    } else {
      socket.emit("joinresponse", "noRoomFound", "")
    }
  });

  socket.on('setup', function(roomname, password, username){
  	if(rooms[roomname] === undefined){
      var newroom = new Room(roomname, password);
      //rooms.push(newroom);
    	socket.username = username;
    	socket.roomname = roomname;
    	
      console.log("newroom.roomname: " + newroom.roomname); 
    	console.log("newroom.password: " + newroom.password);
    	console.log("socket.username: " + socket.username);
      
      socket.join(roomname);
      newroom.users[username]=socket;
      rooms[roomname] = newroom;
      socket.emit('roomSetUp', username); //do i need the ""
    } else {
      for (var i = 1; i < 10000; i++) {
        newname = roomname.concat(String(i));
        if(rooms[newname] === undefined){
          socket.emit('roomNameTaken', newname); 
          break;
        }
      }
      if (i >= 1000){
        socket.emit('roomNameTaken', ""); 
      }
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});