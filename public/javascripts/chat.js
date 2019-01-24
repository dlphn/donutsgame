var chatInfra = io.connect('/chat_infra'),
    chatCom = io.connect('/chat_com');

var currentRoomName = "Dark entrance";

chatInfra.on('name_set', function(data) {
    
    var score = 0;
    var stomach = 0;
    var discover = 0; //donut discovered
    var highscore = $.makeArray(JSON.parse(localStorage.getItem('highscore')));
    var name = data.name;
    var taste1 = [{flavour:"dark chocolate", points: 10}, {flavour:"milk chocolate", points: 7}, {flavour:"white chocolate", points: 5}, {flavour:"sugar", points: 15}, {flavour:"vanilla", points: 13}, {flavour:"strawberry", points: 12}, {flavour:"jelly", points: 9}, {flavour:"cinnamon", points: 3}, {flavour:"mayonnese", points: -10}, {flavour:"ketchup", points: -9}, {flavour:"peanut butter", points: 10}, {flavour:"coffee", points: 6}, {flavour:"blueberry", points: 16}, {flavour:"mustard", points: -12}, {flavour:"BBQ", points: -7}, {flavour:"béchamel", points: -18}, {flavour:"spinach", points: -20}, {flavour:"ham", points: -19}, {flavour:"banana", points: 10}, {flavour:"avocado", points: 8}];
    // 20 flavours
    var donut = {flavour1:"", flavour2:"", points:0};
    var gameIsRunning = true;
    var output = $("#output");
    var chat = $('#chat');
    var cmd = $("#cmd");
    var validCmd = false;
    
    chatInfra.on('user_entered', function (user) {
        output.append('<div class="systemMessage">' + user + ' has joined the room.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('user_left', function (user) {
        output.append('<div class="systemMessage">' + user + ' has left the room.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('user_quit', function (user) {
        output.append('<div class="systemMessage">' + user.name + ' has quit the game.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('message', function(data) {
        var data = JSON.parse(data);
        output.append('<div class="'+data.type+'">' + data.message + '</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('connectToRoom', function(data) {
        output.empty();
        output.append('<div class="serverMessage">You are in the '+data.name+'. '+data.description+'<br>'
                      + 'On the ground lay:<br>'
                      + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ '+data.items[0].item+' that weighs '+data.items[0].weight+' kg,<br>'
                      + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ '+data.items[1].item+' that weighs '+data.items[1].weight+' kg.<br>'
                      + 'There is a door on '+data.doors[0].door+'ern wall and a '+data.color+' paint streak next to that door.</div>');
        output.scrollTop(output[0].scrollHeight);
        currentRoomName = data.name;
    });
    
    chatInfra.on('your_paint_streak', function (color) {
        output.append('<div class="serverMessage">You put a '+color+' paint streak next to the door.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('paint_streak', function (data) {
        output.append('<div class="serverMessage">' + data.user + ' has put a '+data.color+' paint streak next to the door.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('no_paint', function () {
        output.append('<div class="serverMessage">You need a brush to paint on the wall.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('picked', function (object) {
        output.append('<div class="serverMessage">You picked a '+object+'.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('notPicked', function (object) {
        output.append('<div class="serverMessage">There is no '+object+' in this room.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('tooHeavy', function (object) {
        output.append('<div class="serverMessage">Your bag is going to be too heavy :/ You were not able to take the '+object+'.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('bag', function (bag) {
        output.append('<div class="serverMessage">You have: '+bag+'in your bag.</div>');
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('used', function (object) {
        if ((object == 'bottle') || (object == 'water')) {
            stomach = Math.floor(stomach/2);
            output.append('<div class="serverMessage">You drank a whole bottle of water, you feel a bit better and can eat some more.</div>');
        }
        if (object == "pill") {
            stomach = 0;
            output.append('<div class="serverMessage">You took a digestive pill, you feel way better! Ready to devour all the donuts!</div>');
        }
        if (object.includes("brush")) {
            output.append('<div class="serverMessage">Try to paint a color and see what happens :)</div>');
        }
        if (object == "tissue") {
            stomach += -1;
            output.append('<div class="serverMessage">You used a tissue, your face is cleaner and you can eat a few more donuts.</div>');
        }
        output.scrollTop(output[0].scrollHeight);
    });
    
    chatInfra.on('unused', function (object) {
        output.append('<div class="serverMessage">You don\'t have any '+object+' in your bag.</div>');
        output.scrollTop(output[0].scrollHeight);
    });

    chatCom.on('message', function (data) {
        data = JSON.parse(data);
        output.append('<div class="'+data.type+'">' + '<span class="name">' + data.username + ':</span> '+ data.message + '</div>');
        
        if (data.type == 'myMessage') {
            if (data.message == '.highscore') {
                output.append('<div class="serverMessage">' + highscore.map(function(element){
                  return '<br>' + element.name + '=>' + element.score;
                }) + '</div>');
                validCmd = true;
            } 
            if (data.message == '.open') {
                var random1 = Math.floor(Math.random() * 20);
                var random2 = Math.floor(Math.random() * 20);
                donut.flavour1 = taste1[random1].flavour;
                donut.flavour2 = taste1[random2].flavour;
                donut.points = taste1[random1].points + taste1[random2].points;
                discover += 1;
                output.append('<div class="serverMessage">You discover a '+donut.flavour1+'-'+donut.flavour2+' donut.</div>');
                validCmd = true;
            }
            if (data.message == '.eat') {
                if (discover !== 0)  {
                    if (stomach < 6) { //max 6 donuts in a row
                        if ((donut.flavour1 == 'béchamel') && (donut.flavour2 == 'white chocolate')) { //golden donut
                            output.append('<div class="serverMessage">CONGRATULATIONS!!! You found the golden donut! You get 100 points!</div>');
                            score += 100;
                            stomach += 1;
                        } else {
                            output.append('<div class="serverMessage">This donut gives you '+donut.points+' point(s)!</div>');
                            score += donut.points;
                            stomach += 1;
                        }
                        donut = {flavour1:"", flavour2:"", points:0};
                        discover = 0;
                    } else {
                        output.append('<div class="serverMessage">You cannot eat any more donuts for now, you\'re too full!</div>');
                    }
                } else {
                    output.append("<div class='serverMessage'>You haven't discovered any donut yet! Type 'open' to do so.</div>");
                }
                validCmd = true;
            }
            if (data.message == '.go north' || data.message == '.north' || data.message == '.n') {
                if (currentRoomName === "Dark entrance")  {
                    var data = {
                        room: currentRoomName,
                        message: 'exit_DarkEntrance',
                        type: 'serverMessage'
                    };
                    chatInfra.send(JSON.stringify(data));
                } else {
                    output.append("<div class='serverMessage'>You cannot go that way, it's just a wall.</div>");
                }
                validCmd = true;
            }
            if (data.message == '.go south' || data.message == '.south' || data.message == '.s') {
                if (currentRoomName === "Golden bathroom")  {
                    var data = {
                        room: currentRoomName,
                        message: 'exit_GoldenBathroom',
                        type: 'serverMessage'
                    };
                    chatInfra.send(JSON.stringify(data));
                } else {
                    output.append("<div class='serverMessage'>You cannot go that way, it's just a wall.</div>");
                }
                validCmd = true;
            }
            if (data.message == '.go east' || data.message == '.east' || data.message == '.e') {
                output.append("<div class='serverMessage'>You cannot go that way, it's just a wall.</div>");
                validCmd = true;
            }
            if (data.message == '.go west' || data.message == '.west' || data.message == '.w') {
                output.append("<div class='serverMessage'>You cannot go that way, it's just a wall.</div>");
                validCmd = true;
            }
            if (data.message == '.help') {
                output.append("<div class='serverMessage'>Type: 'highscore' to see the table of scores,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'open' to find something,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'eat' to eat the donut and gain points, which are recorded in your score,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'help' to have a reminder of the commands,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'go north', 'north' or 'n' to move in a certain direction,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'pick [object]' to pick the object,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'bag' to see what you have in your bag,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'use [object]' to use the object,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'paint [color]' to put a paint streak next to the door,<br>"
                    + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'quit' to stop playing. You won't be able to chat anymore.<br></div>");
                validCmd = true;
            }
            if (data.message.startsWith('.paint') && (data.message !== '.paint') && (data.message !== '.paint ')) {
                var data = {
                    room: currentRoomName,
                    message: 'paint',
                    type: 'serverMessage',
                    color: data.message.slice(7)
                };
                chatInfra.send(JSON.stringify(data));
                validCmd = true;
            }
            if (data.message.startsWith('.pick') && (data.message !== '.pick') && (data.message !== '.pick ')) {
                var data = {
                    room: currentRoomName,
                    message: 'pickObject',
                    type: 'serverMessage',
                    object: data.message.slice(6)
                };
                chatInfra.send(JSON.stringify(data));
                validCmd = true;
            }
            if (data.message == '.bag') {
                var data = {
                    room: currentRoomName,
                    message: 'showBag',
                    type: 'serverMessage'
                };
                chatInfra.send(JSON.stringify(data));
                validCmd = true;
            }
            if (data.message.startsWith('.use') && (data.message !== '.use') && (data.message !== '.use ')) {
                var data = {
                    room: currentRoomName,
                    message: 'useObject',
                    type: 'serverMessage',
                    object: data.message.slice(5)
                };
                chatInfra.send(JSON.stringify(data));
                validCmd = true;
            }
            if (data.message === '.quit') {

                var elmt = null;
                var previousPlayer = false;

                for (i = 0; i < highscore.length; i++){
                    var element = highscore[i];
                    if (element.name === name) {
                        previousPlayer = true;
                        if (element.score < score) {
                            elmt = element;
                        }
                    }
                }

                if (!previousPlayer) {
                    highscore.push({'name':name,'score':score});
                } else {
                    if (elmt != null) {
                        highscore = $.grep(highscore, function(value){
                            return value != elmt;
                        });
                    highscore.push({'name':name,'score':score});
                    }
                }

                //sort highscore
                highscore.sort(function(a,b) {
                    if (a.score < b.score) {
                        return 1;
                    }
                    if (a.score > b.score) {
                        return -1;
                    }
                    return 0;
                });

                output.append('<div class="serverMessage">** GAME OVER ** Thank you for playing!</div>');
                output.append('<div class="serverMessage">HIGH SCORES' + highscore.map(function(element){
                    return('<br>' + element.name + '=>' + element.score);
                    }) + '</div>');

                validCmd = true;
                gameIsRunning = false; // game over!
                localStorage.setItem('highscore', JSON.stringify(highscore));
                cmd.attr('disabled','disabled');
                $("#sendButton").attr('disabled','disabled');
                chatInfra.emit("quit_game", {name: name});
            }
            if (data.message.startsWith(".")) {
                if (validCmd===false) {
                    output.append('<div class="serverMessage">Sorry '+name+', what?</div>');
                } else {
                    output.append('<div class="serverMessage">[current score is:'+score+']</div>');
                    validCmd = false;
                }
            }
        }
        output.scrollTop(output[0].scrollHeight);
    });
    
    $('#nameform').hide();
    output.append('<div class="systemMessage">Hello ' + data.name + ', hope you\'re ready to eat some donuts! When you want to play, start your input with "." so that the server knows you\'re actually playing and not just chatting with the other players.</div><br>');

    $("#sendButton").click(function() {
        if (gameIsRunning) {
            console.log('Game is running');
            var data = {
                username: name,
                type: 'userMessage',
                message: cmd.val(),
                room: currentRoomName
            };
            chatCom.send(JSON.stringify(data));
            cmd.val('');
        } else {
            console.log('Game not running');
        }
    });

});


$(function() {
    
    $('#setname').click(function(){
	   chatInfra.emit("set_name", {name: $('#nickname').val() });
    });
    
    $("#nickname").keyup(function(event) {
        if (event.keyCode == 13) {
            $("#setname").click();
        }
    });
    
    $("#cmd").keyup(function(event) {
        if (event.keyCode == 13) {
            $("#sendButton").click();
        }
    });
    
});