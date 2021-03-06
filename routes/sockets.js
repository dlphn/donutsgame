var io = require('socket.io');
var Room = require('./datasets/rooms');
var playerList = {};
var counter = 0;
var darkRoom;
var goldenRoom;
var bagWeight = 11.5;
var maxWeight = 50;

exports.initialize = function(server) {
    io = io.listen(server);
    
    Room.find({ name: 'Dark entrance' }, function (err, room) {
        if (err) return console.error(err);
        darkRoom = room[0];
    });

    Room.find({ name: 'Golden bathroom' }, function (err, room) {
        if (err) return console.error(err);
        goldenRoom = room[0];
    });
    
    var chatInfra = io.of("/chat_infra")
    .on("connection", function(socket){
        socket.on("set_name",function(data){
            socket.nickname = data.name;
            counter ++;
            playerList[ socket.nickname ] = {
                id: counter,
                name: data.name,
                bag: [
                    {item: 'bottle(s) of water', number: 1},
                    {item: 'tissue(s)', number: 15},
                    {item: 'pill(s) to help digestion', number: 1},
                    {item: 'brush(es)', number: 0},
                    {item: 'golden brush(es)', number: 0}
                ]
            };
            console.log("new player logged in -> id = "+counter+", nickname is "+data.name);
            
            socket.join(darkRoom.name);
            socket.namespace = chatCom;
            socket.join(darkRoom.name);
            socket.namespace = chatInfra;
            
            socket.emit('name_set', data);
            socket.send(JSON.stringify(
                {type:'serverMessage', 
                    message: "You enter the house of Donuts. It smells all sugary around here. You have just enrolled in the quest for the golden donut! But which one is it? You will have to try them ALL.<br>"
                    + "Type: 'highscore' to see the table of scores,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'open' to find something,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'eat' to eat the donut and gain points, which are recorded in your score,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'help' to have a reminder of the commands,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'go north', 'north' or 'n' to move in a certain direction,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'pick [object]' to pick the object,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'bag' to see what you have in your bag,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'use [object]' to use the object,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'paint [color]' to put a paint streak next to the door,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'quit' to stop playing. You won't be able to chat anymore.<br>"
                    + "Your only weapons are your hands and your mouth.<br>"
                    + "You are in the "+darkRoom.name+". "+darkRoom.description+"<br>"
                    + "On the ground lay:<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ "+darkRoom.items[0].item+" that weighs "+darkRoom.items[0].weight+" kg,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ "+darkRoom.items[1].item+" that weighs "+darkRoom.items[1].weight+" kg.<br>"
                    + "There is a door on "+darkRoom.doors[0].door+"ern wall and a "+darkRoom.color+" paint streak next to that door.<br>"}
            ));
            socket.broadcast.to(darkRoom.name).emit('user_entered', data.name);
        });
        
        socket.on('message', function(message) {
            message = JSON.parse(message);
            nickname = message.username;
            if (message.message == 'exit_DarkEntrance') {
                // console.log("changing room...");
                socket.leave(darkRoom.name);
                socket.join(goldenRoom.name);
                socket.namespace = chatCom;
                socket.leave(darkRoom.name);
                socket.join(goldenRoom.name);
                socket.namespace = chatInfra;
                socket.emit('connectToRoom', goldenRoom);
                socket.broadcast.to(goldenRoom.name).emit('user_entered', nickname);
                socket.broadcast.to(darkRoom.name).emit('user_left', nickname);
            }
            if (message.message == 'exit_GoldenBathroom') {
                // console.log("changing room...");
                socket.leave(goldenRoom.name);
                socket.join(darkRoom.name);
                socket.namespace = chatCom;
                socket.leave(goldenRoom.name);
                socket.join(darkRoom.name);
                socket.namespace = chatInfra;
                socket.emit('connectToRoom', darkRoom);
                socket.broadcast.to(darkRoom.name).emit('user_entered', nickname);
                socket.broadcast.to(goldenRoom.name).emit('user_left', nickname);
            }
            if (message.message == 'paint') {
                // console.log("painting a streak in", message.room);
                if ((playerList[ socket.nickname ].bag[3].number == 0) && (playerList[ socket.nickname ].bag[4].number == 0)) {
                    socket.emit('no_paint');
                } else {
                    if (message.room == darkRoom.name) {
                        darkRoom.color = message.color;
                        data = {
                            user: nickname,
                            color: message.color,
                            room: darkRoom.name,
                        };
                        darkRoom.save(function (err, updatedRoom) {
                            if (err) return console.error(err);
                            darkRoom = updatedRoom;
                            socket.emit('your_paint_streak', {
                                color: message.color,
                                room: darkRoom.name,
                            });
                            socket.broadcast.emit('paint_streak', data);
                        });
                    } else if (message.room == goldenRoom.name) {
                        goldenRoom.color = message.color;
                        data = {
                            user: nickname,
                            color: message.color,
                            room: goldenRoom.name,
                        };
                        goldenRoom.save(function (err, updatedRoom) {
                            if (err) return console.error(err);
                            goldenRoom = updatedRoom;
                            socket.emit('your_paint_streak', {
                                color: message.color,
                                room: goldenRoom.name,
                            });
                            socket.broadcast.emit('paint_streak', data);
                        });
                    }
                }
            }
            if (message.message == 'pickObject') {
                // console.log("picking an object in", message.room);
                if (message.room == darkRoom.name) {
                    if ((message.object == 'bottle') || (message.object == 'water')) {
                        if (bagWeight + 10 > maxWeight) {
                            socket.emit('tooHeavy', message.object);
                        } else {
                            playerList[ socket.nickname ].bag[0].number += 1;
                            bagWeight += 10;
                            socket.emit('picked', 'bottle');
                        }
                    } else if (message.object == 'brush') {
                        if (bagWeight + 5 > maxWeight) {
                            socket.emit('tooHeavy', message.object);
                        } else {
                            playerList[ socket.nickname ].bag[3].number += 1;
                            bagWeight += 5;
                            socket.emit('picked', message.object);
                        }
                    } else {
                        socket.emit('notPicked', message.object);
                    }
                } else if (message.room == goldenRoom.name) {
                    if (message.object == 'pill') {
                        if (bagWeight + 1.5 > maxWeight) {
                            socket.emit('tooHeavy', message.object);
                        } else {
                            playerList[ socket.nickname ].bag[2].number += 1;
                            bagWeight += 1.5;
                            socket.emit('picked', message.object);
                        }
                    } else if (message.object == 'golden brush') {
                        if (bagWeight + 15 > maxWeight) {
                            socket.emit('tooHeavy', message.object);
                        } else {
                            playerList[ socket.nickname ].bag[4].number += 1;
                            bagWeight += 15;
                            socket.emit('picked', message.object);
                        }
                    } else {
                        socket.emit('notPicked', message.object);
                    }
                }
            }
            if (message.message == 'showBag') {
                var bag = "";
                for (var i=0; i<playerList[socket.nickname].bag.length; i++) {
                    bag += playerList[socket.nickname].bag[i].number + " " + playerList[socket.nickname].bag[i].item + ", ";
                }
                bag += "for a total of "+bagWeight+"kg, ";
                socket.emit('bag', bag);
            }
            if (message.message == 'useObject') {
                // console.log("using object in", message.room);
                if ((message.object == 'bottle') || (message.object == 'water')) {
                    if (playerList[ socket.nickname ].bag[0].number > 0) {
                        playerList[ socket.nickname ].bag[0].number += -1;
                        bagWeight += -10;
                        socket.emit('used', message.object);
                    } else {
                        socket.emit('unused', message.object);
                    }
                } else if (message.object == 'pill') {
                    if (playerList[ socket.nickname ].bag[2].number > 0) {
                        playerList[ socket.nickname ].bag[2].number += -1;
                        bagWeight += -1.5;
                        socket.emit('used', message.object);
                    } else {
                        socket.emit('unused', message.object);
                    }
                } else if (message.object == 'brush') {
                    if (playerList[ socket.nickname ].bag[3].number > 0) {
                        socket.emit('used', message.object);
                    } else {
                        socket.emit('unused', message.object);
                    }
                } else if (message.object == 'golden brush') {
                    if (playerList[ socket.nickname ].bag[4].number > 0) {
                        socket.emit('used', message.object);
                    } else {
                        socket.emit('unused', message.object);
                    }
                } else if (message.object == 'tissue') {
                    if (playerList[ socket.nickname ].bag[1].number > 0) {
                        playerList[ socket.nickname ].bag[1].number += -1;
                        socket.emit('used', message.object);
                    } else {
                        socket.emit('unused', message.object);
                    }
                } 
            }
        });
        
        socket.on('quit_game', function(data) {
            socket.broadcast.emit('user_quit', data);
            delete playerList[ socket.nickname ];
            // console.log(playerList);
        });

        /*socket.on('disconnect', function() {
            console.log("disconnected " + JSON.stringify(playerList[socket.id]));
            socket.broadcast.emit('user_quit', {name: playerList[socket.id].name});
            delete playerList[ socket.id ];
            //counter --;
        });*/
    });
       
    var chatCom = io.of("/chat_com")
    .on("connection", function(socket) {
        socket.on('message', function(message){
            message = JSON.parse(message);
            if (message.type == "userMessage") {

                if (!message.message.startsWith('.')) {
                    // console.log("... message re-sent to all except sender in room "+message.room);
                    socket.broadcast.emit('message', JSON.stringify(message));
                }
                
                // console.log("... message re-sent to sender");
                message.type = "myMessage";
                socket.send(JSON.stringify(message));
            }
        });
    });
}
