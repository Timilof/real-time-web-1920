

  var socket = io();

  const attendeeBox = document.querySelector(".attendees");
  const date = document.querySelector(".date");
  const chatWindow = document.querySelector(".chat-container");
  const sendButton = document.querySelector(".send");
  const inputField = document.querySelector(".input");
  const addButtons = document.querySelectorAll(".add");
  const likeButtons = document.querySelectorAll(".like-button");
  const readingList = document.querySelector(".readingList");

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


  


  let categoryItems = document.querySelectorAll(".reccomended-book button");
  let categoryItemsArray = Array.from(categoryItems);
  
  let sorted = categoryItemsArray.sort(sorter);
  
  function sorter(a,b) {
      if(a.dataset.likes < b.dataset.likes) return -1;
      if(a.dataset.likes > b.dataset.likes) return 1;
      return 0;
  }

  console.log(sorted)
  // todo: have this fire when a user likes a book... so inside the socket.on("newlike" ()=>{ sorting here })
  // document.querySelector("button").onclick = () => sorted.forEach(e => document.querySelector("#demo").appendChild(e));





  function returnDataset(event){
    const bookData = {
      title: event.dataset.title,
      subtitle: event.dataset.subtitle,
      cover: event.dataset.cover,
      description: event.dataset.description,
      price: event.dataset.price,
      author: event.dataset.author,
      bookid: event.dataset.bookid
    }
    return(bookData)
  }

  likeButtons.forEach(button =>{
    button.addEventListener("click", e=>{
      e.preventDefault();
      socket.emit("like", {user: userName, room: roomId, bookid: e.target.dataset.bookid })
    })
  })

  socket.on("new like", function(data){
    const like = document.querySelector(`#like-${data.bookid}`)
    if(data.user == userName){
      like.classList.toggle("liked");
    }
    like.querySelector("span").innerHTML = data.NumberOflikes + " likes"
});

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
    addABook(data)
  });
  
  function addABook(data){
    let book = `
      <li class="reccomended-book">
        <p class="tiny bold recco">${data.from} reccomend:</p>
        <div class="book-img-container">
            <img class="reading-img" src="${data.book.cover}" alt="${data.book.title} ${data.book.subtitle}">
            <button class="like-button ${data.book.votes.forEach(function(vote){ vote === username ? 'liked' : '' })}" 
            id="like-${data.book.bookid}" 
              data-bookid="${data.book.bookid}" class="add" 
              data-title="${data.book.title ? data.book.title : ""}"
              data-cover="${data.book.cover ? data.book.cover : ""}"
              data-author="${data.book.author ? data.book.author : ""}"
              data-likes="${data.book.votes ? data.book.votes.length : ""}">
                  <span>${data.book.votes.length} likes</span>
            </button>
        </div>
        <p>${data.book.title}</p>
        <p class="bold small">by ${data.book.author}</p>
    </li>`;

    readingList.insertAdjacentHTML("beforeend", book);
    // add a listener to the like button

    document.querySelector(`#like-${data.book.bookid}`).addEventListener("click", e=>{
      e.preventDefault();
      socket.emit("like", {user: userName, room: roomId, bookid: e.target.dataset.bookid })
    })
  }

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
                <p class="bold">${messageContent.title}</p>
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



