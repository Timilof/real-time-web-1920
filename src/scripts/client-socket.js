

  var socket = io();

  const attendeeBox = document.querySelector(".attendees");
  const date = document.querySelector(".date");
  const chatWindow = document.querySelector(".chat-container");
  const sendButton = document.querySelector(".send");
  const inputField = document.querySelector(".input");
  const addButtons = document.querySelectorAll(".add");

  let userName = document.querySelector(".username").dataset.user;
  let roomId = document.querySelector(".sharePin").dataset.room;
  

  function scrollToEnd() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  scrollToEnd();
  

  // function sortByVotes(){
  //   document.querySelector('.readingList').sort(function (a, b) {
  //     return +a.dataset.name - +b.dataset.name;
  // })
  // .appendTo( $wrapper );
  // }


  document.querySelector(".leave").addEventListener("click", e =>{
    e.preventDefault();
    socket.emit("leave", {user: userName, room: roomId})
    location.href = "/"
  })


addButtons.forEach( button=>{
  button.addEventListener("click", e=>{
    e.preventDefault();
    const bookData = {
      title: e.target.dataset.title,
      subtitle: e.target.dataset.subtitle,
      cover: e.target.dataset.cover,
      description: e.target.dataset.description,
      price: e.target.dataset.price,
      author: e.target.dataset.author,
      bookid: e.target.dataset.bookid
    }
    addBook(bookData)
  })
})

function addToListEvents(elementId){
    document.querySelector(`#${elementId}`).addEventListener("click", e=>{
      e.preventDefault();
        const bookData = {
            title: e.target.dataset.title,
            subtitle: e.target.dataset.subtitle,
            cover: e.target.dataset.cover,
            description: e.target.dataset.description,
            price: e.target.dataset.price,
            author: e.target.dataset.author,
            bookid: e.target.dataset.bookid
          }
        addBook(bookData)
    })
  }

  // this is the search results
  function addListener(){
    document.querySelectorAll(".share").forEach(book=>{
      book.addEventListener("click", e=>{
        const bookData = {
          title: book.dataset.title,
          subtitle: book.dataset.subtitle,
          cover: book.dataset.cover,
          description: book.dataset.description,
          price: book.dataset.price,
          author: book.dataset.author,
          bookid: e.target.dataset.bookid
        }
        sendMessage(bookData)
      })
    })
  }
  
  function addBook(bookData){
    socket.emit("add book", {room: roomId, from: userName, book: bookData});
  }

  socket.on("add to reading list", function(data){
    console.log(data)
});

  function buildAMessage(from, messageContent, timestamp) {
    let setToSide;
    let aMessage;
    // <p class="small">€${messageContent.price}</p>
    // this is the book reccomended in the chat
    from == userName ? (setToSide = `<li class="message my-message"`) : (setToSide = `<span class="from">${from}:</span> <li class="message"`);
    if(messageContent.title){
      aMessage = `${setToSide}">
        <div class="message-book message-txt">
            <button id="${messageContent.bookid}" data-bookid="${messageContent.bookid}" class="add" data-title="${messageContent.title ? messageContent.title : ""}" data-subtitle="${messageContent.subtitle ? messageContent.subtitle: ""}" data-cover="${messageContent.cover ? messageContent.cover : ""}" data-description="${messageContent.description ? messageContent.description : ""}" data-author="${messageContent.author ? messageContent.author : ""}" data-price="${messageContent.price ? messageContent.price : ""}" >add to reading list</button>

            <div class="message-details">

                <img class="message-img" src="${messageContent.cover}">
                <p>${messageContent.title}</p>
                <p>${messageContent.subtitle}</p>
                <p class="small">${messageContent.author}</p>
            </div>
            <div class="message-description">
                <p class="desc">${messageContent.description}</p>
            </div>
          </div>
        </li>`
    }else{
      aMessage = `${setToSide}"><p class="message-txt">${messageContent}</p><span class="time">${timestamp}</span></li>`;
    }
    return aMessage;
  }

  (function(){
      socket.emit("join", {room: roomId, user: userName});
  }())

  function clearInputfieldAndFocus() {
    document.querySelector(".input").value = "";
    document.querySelector(".input").focus();
  }

  function getCurrentTime() {
    let minutes = new Date().getMinutes();
    let hours = new Date().getHours();
    const timestamp = hours + ":" + minutes;
    return timestamp;
  }

  // function renderMessagePrompt() {
  //   const sendMessagePrompt = `<li class="prompt"><p>Send a message and she might actually reply</p></li>`;
  //   chatWindow.innerHTML = "";
  //   chatWindow.insertAdjacentHTML("beforeend", sendMessagePrompt);
  // }


  socket.on("user left", function(data){
    console.log(data)
  })

  document.querySelector(".attend").addEventListener("click", e =>{
    e.preventDefault();
    socket.emit("attend", {user: userName, room: roomId})
  })

  socket.on("user attending", function(user){
      let attenders = `<li class="attendee" id="u${user}">${user}</li>`;
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

  socket.on("chat message", function(data) {
    const messageToRender = buildAMessage(data.from, data.msg, data.time);
    chatWindow.insertAdjacentHTML("beforeend", messageToRender);
    addListener()
    if(document.querySelector(`#${data.msg.bookid}`)){
      addToListEvents(data.msg.bookid);
    }
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

  function sendMessage(msg) {
    let message
    if(!msg){
        message = inputField.value;
    }else{
      message = msg
    }
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



