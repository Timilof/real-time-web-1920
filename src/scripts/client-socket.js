function featureCheck(feature, where, type) {
  return feature in where
      && type ?
          typeof where[feature] === type
          : true
}


function enableScript() {
  return featureCheck('classList', document.body)
      && featureCheck('Array', Array.prototype, 'function')
      && featureCheck('querySelectorAll', document.body, 'function')
      && featureCheck('getElementById', document.body)
      && featureCheck('forEach', document.body, 'function')
}

if (enableScript()) {
  // the rest of all javascript functionalities here...
  // if the browser doesn't support these features the user can use the application without javascript... sad but whatever haha

(function() {
  var socket = io();

  const attendeeBox = document.querySelector(".attendees");
  const date = document.querySelector(".date");
  const chatWindow = document.querySelector(".chat-container");
  const sendButton = document.querySelector(".send");
  const inputField = document.querySelector(".input");

  let userName = document.querySelector(".username").dataset.user;
  let roomId = document.querySelector(".sharePin").dataset.room;

  function scrollToEnd() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  
  function buildAMessage(from, messageContent, timestamp) {
    let setToSide;
    from == userName ? (setToSide = `<li class="message my-message"`) : (setToSide = `<span class="from">${from}:</span> <li class="message"`);
    let aMessage = `${setToSide}"><p class="message-txt">${messageContent}</p><span class="time">${timestamp}</span></li>`;
    return aMessage;
  }

  (function(){
      socket.emit("join", {room: roomId, user: userName});
  }())

  function clearInputfieldAndFocus() {
    document.querySelector(".input").value = "";
    document.querySelector(".input").focus();
    //maybe change the placeholder depending on input? user feedback iets
  }

  function getCurrentTime() {
    let minutes = new Date().getMinutes();
    let hours = new Date().getHours();
    const timestamp = hours + ":" + minutes;
    return timestamp;
  }

  function renderMessagePrompt() {
    const sendMessagePrompt = `<li class="prompt"><p>Send a message and she might actually reply</p></li>`;
    chatWindow.innerHTML = "";
    chatWindow.insertAdjacentHTML("beforeend", sendMessagePrompt);
  }


  document.querySelector(".leave").addEventListener("click", e =>{
    e.preventDefault();
    socket.emit("leave", {user: userName, room: roomId})
    location.href = "/"
  })

  socket.on("user left", function(data){
    console.log(data)
  })

  document.querySelector(".attend").addEventListener("click", e =>{
    e.preventDefault();
    socket.emit("attend", {user: userName, room: roomId})
  })

  socket.on("user attending", function(user){
      let attenders = `<p class="attendee" id="u${user}">${user}</p>`;
      attendeeBox.insertAdjacentHTML("beforeend", attenders)
  });
  
  socket.on("user un-attending", function(user){
      let deleteUser = attendeeBox.querySelector(`#u${user}`);
      deleteUser.remove();
  });
 
  document.querySelector(".date").addEventListener("keydown", e=>{
    let keystoppedTimer = null;
    clearTimeout(keystoppedTimer);
    keystoppedTimer = setTimeout(function() {
      socket.emit("new date", {room: roomId, date: e.target.value})
    }, 600);
  })

  socket.on("new date", function(newDate){
    date.value= newDate
  })

  




  socket.on("open chat", function(data) {
    chatWindow.innerHTML = "";
    data.forEach(messageObject => {
      const messageToRender = buildAMessage(
        messageObject.from,
        messageObject.msg,
        messageObject.time
      );
      chatWindow.insertAdjacentHTML("beforeend", messageToRender);
    });
    scrollToEnd();
  });

  socket.on("chat message", function(data) {
    const messageToRender = buildAMessage(data.from, data.msg, data.time);
    chatWindow.insertAdjacentHTML("beforeend", messageToRender);
    scrollToEnd();
  });

  sendButton.addEventListener("click", function(e) {
    e.preventDefault();
    sendMessage();
  });

  inputField.addEventListener("keydown", function(e) {
    if (e.key == "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const message = inputField.value;
    if (message.length < 1) {
      clearInputfieldAndFocus();
      return;
    }

    const timestamp = getCurrentTime();
      socket.emit("chat message", {
        from: userName,
        msg: message,
        room: roomId,
        time: timestamp,
      });
    clearInputfieldAndFocus();
  }

  // const filteredCharacters = characters.filter((character) => character.toLowerCase().includes(e.target.value.toLowerCase()));


})();
}