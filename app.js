const express = require("express");
const dotenv = require("dotenv").config();
const session = require('express-session')
const bodyParser = require('body-parser')
const mongo = require("mongodb");

const app = express()
  .use(express.static(__dirname + "/src"))
  .set("views", "views")
  // .use(session({
  //   resave: true,
  //   saveUninitialized: true,
  //   secret: process.env.SESSION_SECRET,
  //   cookie: {maxAge: 3600000}
  // }))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json());

const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3500;

const { MongoClient } = require("mongodb");

const uri = process.env.DB_NAME;

let chatData;

async function GetFromDB(collection, explicit) {
  const client = new mongo.MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("rtw");
    let data;
    if (explicit){
       data = await db
      .collection(`${collection}`)
      .find({ clubPin: explicit })
      .toArray();
    }else{
       data = await db
        .collection(`${collection}`)
        .find({})
        .toArray();
    }
    return data;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function removeFromDB(room) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("rtw");
    const deleteDocument = await db
      .collection("clubs")
      .deleteOne({ roomID: room });
    return deleteDocument;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function updateInCollection(pin, newValue, explicit) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("rtw");
    let updatedDocument;
      if (explicit == "userlist"){
        updatedDocument = await db
        .collection("clubs")
        .updateOne(
          { clubPin: `${pin}` },
          { $set: { userlist: newValue } }
        );
     }else if(explicit == "bookList"){
        updatedDocument = await db
        .collection("clubs")
        .updateOne(
          { clubPin: `${pin}` },
          { $set: { bookList: `${newValue}` } }
        );
     }else{
      updatedDocument = await db
      .collection("clubs")
      .updateOne(
        { clubPin: `${pin}` },
        { $set: { date: `${newValue}` } }
      );
     }
    return updatedDocument;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

// async function createNewCollection(nameOfNewCollection) {
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });

//   try {
//     await client.connect();
//     const db = client.db("dating-base");
//     const newCollection = await db.createCollection(`${nameOfNewCollection}`);
//   } catch (e) {
//     console.error(e);
//   } finally {
//     await client.close();
//   }
// }

// createNewCollection('match-Claudia-Janno-5e6fcac84d32897c95566666');

async function writeDb(collection, data) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    const db = client.db("rtw");
    const fullDump = await db.collection(`${collection}`).insertOne({
      from: data.from,
      msg: data.msg,
      time: data.time
    });
    return fullDump;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

io.on("connection", function(socket) {

  socket.on("join", async function(data) {
    console.log(`user: ${data.user} just joined the ${data.room} room `)
    socket.join(data.room);
    io.to(data.room).emit("user joined", data.user);
  });

  // leave handler
  socket.on("leave", async function(data) {
    console.log(data.user, "left the club... sad :-(")
    socket.leave(data.room);
    io.to(data.room).emit("user left", data.user);
  });

  // add to attending list
  socket.on("attend", async function(data) {
    const club = await GetFromDB("clubs", data.room);
    if(!club[0].userlist.includes(data.user)){
      club[0].userlist.push(data.user) 
      io.to(data.room).emit("user attending", data.user);
      updateInCollection(data.room, club[0].userlist, "userlist");
    }else{
      io.to(data.room).emit("user un-attending", data.user);
      
      const indexOfItem = club[0].userlist.indexOf(data.user);
      if (indexOfItem > -1) {
        club[0].userlist.splice(indexOfItem, 1);
      }
      updateInCollection(data.room, club[0].userlist, "userlist");
    }
  });

  // remove from attending list

//   // creates a new collection and writes the text message in it
//   socket.on("make new chat", async function(data) {
//     chatData = await createNewCollection(data.room);
//     writeDb(data, data.room);
//     updateInCollection(data.room, data.msg);
//     io.to(data.room).emit("chat message", {
//       from: data.from,
//       msg: data.msg,
//       time: data.time,
//       room: data.room
//     });
//   });

  // normal message handler
  socket.on("chat message", function(data) {
    io.to(data.room).emit("chat message", {
      from: data.from,
      msg: data.msg,
      time: data.time,
      room: data.room
    });
    writeDb(`club-${data.room}`, data);
  });

  // new meeting date handler
  socket.on("new date", function(data) {
    io.to(data.room).emit("new date", data.date);
    updateInCollection(data.room, data.date, "date");
  });

  
  
});

app.set("view engine", "ejs");
app.get("/", async (req, res, next) => {

  // if(!req.session.user) {
  //   req.session.user = 'Janno';
  // }
  
  // const matches = await GetFromDB("matches");
  // const newMatches = matches.filter(match => match.lastMessage == "");
  // const oldMatches = matches.filter(match => match.lastMessage !== "");
  // res.render("chat.ejs", { oldMatches: oldMatches, newMatches: newMatches, user: req.session.user });
  res.render("index.ejs", {errorMsg: ""});
});

  app.post('/', async function(req, res) {
    club = await GetFromDB("clubs" ,req.body.roomName);
    clubChat = await GetFromDB(`club-${req.body.roomName}`);
    console.log(club);
    if (club[0].clubPin.length > 0){
      res.render("club.ejs", {clubName: club[0].clubName, username: req.body.username ,pin: club[0].clubPin, date: club[0].date, bookList: club[0].bookList, users: club[0].userList, chat: clubChat });
    }
    else{
      res.render("index.ejs", {errorMsg: "room pin doesn't exist! pick another one"});
    }
  })
  
  app.get('/chat/:match', async function(req,res){
    chatData = await GetFromDB(req.params.match);
    matchData = await GetFromDB("matches", req.params.match);
    const partnerData = checkWhoIsWho(matchData, req.session.user);
    res.render("chat-detail.ejs", {messages: chatData, user:req.session.user, partner: partnerData} );
  })
  
  app.get('/unmatch/:id', async function(req,res){
    await removeFromDB(room)
    .then(async () => {
      if(!req.session.user) {
        req.session.user = 'Janno';
      }
      const matches = await GetFromDB("matches");
      const newMatches = matches.filter(match => match.lastMessage == "");
      const oldMatches = matches.filter(match => match.lastMessage !== "");
      res.render("chat.ejs", { oldMatches: oldMatches, newMatches: newMatches, user: req.session.user });
    })
  })
  
  app.post('/chat/:match', async function(req,res){
    const messageData = {
      from: req.session.user,
      msg: req.body.messageInput,
      time: new Date().getHours() + ":" + new Date().getMinutes(),
      room: req.params.match
    }
    await updateInCollection(messageData.room, messageData.msg)
    await writeDb(messageData, req.params.match)
    .then(async () => {
      const chatData = await GetFromDB(req.params.match);
      const matchData = await GetFromDB("matches", req.params.match);
      const partnerData = checkWhoIsWho(matchData, req.session.user);
      res.render("chat-detail.ejs", {messages: chatData, user:req.session.user, partner: partnerData} );
    }, err => {
      console.error(err); 
    });
  });

  // app.post('/', async function(req, res) {
  //   const username = req.body.username;
  //   req.session.user = username;
  //   const matches = await GetFromDB("matches");
  //   const newMatches = matches.filter(match => match.lastMessage == "");
  //   const oldMatches = matches.filter(match => match.lastMessage !== "");
  //   res.render("chat.ejs", { oldMatches: oldMatches, newMatches: newMatches, user: req.session.user });
  // });

http.listen(process.env.PORT || port, () =>
  console.log(`Realtime app on ${port}!`)
);


// {
//   "userlist": [],
//   "bookList": [] ,
// "roomId":"",
// "clubPin":"",
// "clubName":""
// }
