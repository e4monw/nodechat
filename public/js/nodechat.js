var clearChat = function() {
    $("#messages").empty();
    $("#m").focus();
    socket.emit("getusers");
};

function appendMessage(txt) {
    $("#messages").append($("<li>").text(txt));
    window.scrollTo(0,document.body.scrollHeight);
}

appendMessage("Connecting...");

var socket = io.connect();

socket.emit("getmotd", function(motd) {
    $("#motd").text(motd);
});

var nick = prompt("Nickname");

if ("" == nick.trim() || nick.length < 3) {
    alert("Nickname too short");
    location.reload();
}else if (nick.length > 12) {
    alert("Nickname too long");
    location.reload();
}

var admin = false;
var chatroom = "lobby";

socket.on("verified", function() {
    admin = true;
    socket.emit("chat message", {
        nickname: "Server",
        message: nick + " is now an operator!"
    });
});

socket.on("chat message", function(msg) {
    if(msg.nickname){
        if(msg.chatroom == chatroom){
            appendMessage("[" + msg.chatroom + "] " + msg.nickname +  ": " + msg.message);
        }
    }else{
        // Announcements
        appendMessage(msg.message);
    }
});

socket.on("usersonline", function(usersList) {
    appendMessage("Users online: " + usersList.toString());
});

appendMessage("Logging in...");

socket.emit("userconnect", nick);

appendMessage("You are in \"" + chatroom + "\"");

socket.emit("getusers");

$("form").submit(function() {
    var a = $("#m").val();
    if ("/" == a.charAt(0)) {
        // COMMANDS
        a = a.slice(1);
        if (a.search(/operator/) != -1) if ("operator" == a) socket.emit("printadmin"); else {
            a = a.replace(/operator\s/, "");
            socket.emit("verifyadmin", parseInt(a));
        }
        if (a.search(/users/) != -1) {
            a = a.replace(/users\s/, "");
            socket.emit("getusers");
        }
        if (a.search(/chatroom/) != -1){
            a = a.replace(/chatroom\s/, "");
            if(a){
                chatroom = a.toLowerCase();;
                appendMessage("You are now in \"" + chatroom + "\"");
            }else{
                appendMessage("You are in \"" + chatroom + "\"");
            }
        }
        if (a.search(/clear/) != -1) {
            clearChat();
        }
        if (admin) {
            // ADMIN COMMANDS
            if (a.search(/mute/) != -1) {
                a = a.replace(/mute\s/, "");
                if (a != nick) socket.emit("mute", a);
            }
            if (a.search(/motd/) != -1) {
                a = a.replace(/motd\s/, "");
                socket.emit("motd", a);
            }
        }
        $("#m").val("");
        return false;
    } else {
        socket.emit("chat message", {
            nickname: nick,
            message: a,
            chatroom: chatroom
        });
        $("#m").val("");
        return false;
    }
});

socket.on("usernametaken", function(username) {
    alert("Username taken");
    location.reload();
});

socket.on("mute", function(username) {
    if (nick == username){
        $("#m").remove();
    }
});

socket.on("motd", function(motd) {
    $("#motd").text(motd);
});

window.onbeforeunload = function() {
    socket.emit("userdisconnect", nick);
};
