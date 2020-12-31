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
  // if the browser doesn't support these features the user can use the application without javascript

(function() {
  var socket = io();

  const usernameField = document.querySelector(".username");
  
  const chatArea = document.querySelector(".chat-area");
  const chatWindow = document.querySelector(".chat-container");

  const sendButton = document.querySelector(".send");
  // const searchButton = document.querySelector(".searchButton");

  const inputField = document.querySelector(".input");
  // const searchField = document.querySelector(".searchField");

  let userName = document.querySelector(".username").dataset.user;
  let roomId = document.querySelector(".sharePin").dataset.room;

  function scrollToEnd() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function buildAMessage(from, messageContent, timestamp) {
    let setToSide;
    from == userName ? (setToSide = "my-message") : (setToSide = "");
    let aMessage = `<li class="message ${setToSide}"><p class="message-txt">${messageContent}</p><span class="time">${timestamp}</span></li>`;
    return aMessage;
  }

  // function updateLastMessages(lastMessage, room) {
  //   chatLinks.forEach(chatLink => {
  //     if (chatLink.dataset.room == room) {
  //       chatLink.querySelector(".last-message").textContent = lastMessage;
  //     }
  //   });
  // }

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

  // location.reload();

  function leaveRoom(){
    socket.emit("unmatch", roomId);
  }

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
    // if (isNewMatch) {
    //   chatWindow.innerHTML = "";
    // }
    const messageToRender = buildAMessage(data.from, data.msg, data.time);
    chatWindow.insertAdjacentHTML("beforeend", messageToRender);
    scrollToEnd();
    // updateLastMessages(data.msg, data.room);
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

  // searchButton.addEventListener("click", function(e) {
  //   e.preventDefault();
  //   // searchGoogleBook();
  // });
  
  // searchField.addEventListener("keydown", function(e) {
  //   if (e.key == "Enter") {
  //     e.preventDefault();
  //     // searchGoogleBook();
  //   }
  // });

  function sendMessage() {
    const message = inputField.value;
    console.log(message)
    if (message.length < 1) {
      clearInputfieldAndFocus();
      return;
    }

    const timestamp = getCurrentTime();
    // if (isNewMatch) {
    //   isNewMatch = "reload";
    //   socket.emit("make new chat", {
    //     from: userName,
    //     msg: message,
    //     time: timestamp,
    //     room: roomId
    //   });
    // }
    //  else {
      socket.emit("chat message", {
        from: userName,
        msg: message,
        room: roomId,
        time: timestamp,
      });
    // }
    clearInputfieldAndFocus();
  }

  // const filteredCharacters = characters.filter((character) => character.toLowerCase().includes(e.target.value.toLowerCase()));


})();
}