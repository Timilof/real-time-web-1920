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

// function checkWhoIsWho(matchdata, name){
//   const who = {};
//   if(name == matchdata[0].hisName){
//     who.img = matchdata[0].herImage;
//     who.name = matchdata[0].name
//     who.id = matchdata[0].roomID
//   }else{
//     who.img = matchdata[0].hisImage;
//     who.name = matchdata[0].hisName
//     who.id = matchdata[0].roomID
//   }
//   return who;
// }

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

// async function removeFromDB(room) {
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });
//   try {
//     await client.connect();
//     const db = client.db("dating-base");
//     const deleteDocument = await db
//       .collection("matches")
//       .deleteOne({ roomID: room });
//     return deleteDocument;
//   } catch (e) {
//     console.error(e);
//   } finally {
//     await client.close();
//   }
// }

// async function updateInCollection(nameOfDocument, newValue) {
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });
//   try {
//     await client.connect();
//     const db = client.db("dating-base");
//     const updatedDocument = await db
//       .collection("matches")
//       .updateOne(
//         { roomID: `${nameOfDocument}` },
//         { $set: { lastMessage: `${newValue}` } }
//       );
//     return updatedDocument;
//   } catch (e) {
//     console.error(e);
//   } finally {
//     await client.close();
//   }
// }

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
    io.to(data.room).emit("user joined", chatData);
    // chatData = await GetFromDB(data.room);
    // write to db that someone joined / in clubs > userlist
  });

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
    console.log(data)

    io.to(data.room).emit("chat message", {
      from: data.from,
      msg: data.msg,
      time: data.time,
      room: data.room
    });
    writeDb(`club-${data.room}`, data);
    // updateInCollection(data.room, data.msg);
  });

  // delete message handler
  socket.on("leave", function(room) {
    socket.leave(room);
    // remove this user from the userlist
    // socket.leave(room);
    // removeFromDB(room);
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
      res.render("club.ejs", {clubName: club[0].clubName, username: req.body.username ,pin: club[0].clubPin, bookList: club[0].bookList, users: club[0].userList, chat: clubChat });
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
