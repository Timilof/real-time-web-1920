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

function makeid() {
  let result           = '';
  let characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( let i = 0; i < 5; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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
          { $set: { bookList: newValue } }
        );
     }else if(explicit == "clubName"){
        updatedDocument = await db
        .collection("clubs")
        .updateOne(
          { clubPin: `${pin}` },
          { $set: { clubName: `${newValue}` } }
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

async function createNewCollection(nameOfNewCollection) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    const db = client.db("rtw");
    // const newCollection = await db.createCollection(`club-${nameOfNewCollection}`);
    await db.createCollection(`club-${nameOfNewCollection}`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function writeDb(collection, data, inclub) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  let fullDump
  try {
    await client.connect();
    const db = client.db("rtw");
    if(inclub == "to clubs"){
      fullDump = await db.collection(`${collection}`).insertOne({
        userlist: [],
        bookList: [],
        clubPin:data.pin,
        clubName: data.clubName,
        date: data.date,
        host: data.host
      });
    }else{
        fullDump = await db.collection(`${collection}`).insertOne({
          from: data.from,
          msg: data.msg,
          time: data.time,
          // id: data.id
        });
    }
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
      // todo idl what is happening here
      const indexOfItem = club[0].userlist.indexOf(data.user);
      io.to(data.room).emit("user un-attending", data.user);
      if (indexOfItem > -1) {
        club[0].userlist.splice(indexOfItem, 1);
      }
      updateInCollection(data.room, club[0].userlist, "userlist");
    }
  });

  // normal message handler
  socket.on("chat message", function(data) {
    io.to(data.room).emit("chat message", {
      from: data.from,
      msg: data.msg,
      time: data.time,
      room: data.room,
      bookId: data.bookid
    });
    writeDb(`club-${data.room}`, data);
  });

  // add book to bookList
  socket.on("add book", async function(data) {
    const reccomended = {
      title: data.book.title, bookid: data.book.bookid, cover: data.book.cover, author: data.book.author, votes:[], reccomendedBy:data.from
    }
    const club = await GetFromDB("clubs", data.room);
    let result = club[0].bookList.find(obj => {
      return obj.id === data.book.bookid
    })
    if(!result || result == undefined){
      club[0].bookList.push({title: data.book.title, bookid: data.book.bookid, cover: data.book.cover, author: data.book.author, votes:[], reccomendedBy:data.from});
      io.to(data.room).emit("add to reading list", {
        from: data.from,
        book: reccomended
      });
      updateInCollection(data.room, club[0].bookList, "bookList");
    }else{
      console.log(data.book.title, " is already in the booklist")
  };
})

  // new meeting-date-time handler
  socket.on("new date", function(data) {
    io.to(data.room).emit("new date", data.date);
    updateInCollection(data.room, data.date, "date");
  });


  // new like and remove like ---- it is a toggle function
  socket.on("like", async function(data) {
    const club = await GetFromDB("clubs", data.room);
    const IsSameId = (element) => element.bookid == data.bookid;
    let bookIndex = club[0].bookList.findIndex(IsSameId);
    if(bookIndex > -1){
      let userVote = club[0].bookList[bookIndex].votes.find(vote => {
        return vote === data.user;
      })
          if(!userVote || userVote == undefined){
              // push the new user into the votes of the booklist
              club[0].bookList[bookIndex].votes.push(data.user)
              updateInCollection(data.room, club[0].bookList, "bookList");
              io.to(data.room).emit("new like", {user: data.user, bookid: data.bookid, NumberOflikes: club[0].bookList[bookIndex].votes.length});
            }else{
              // remove user from votes
              let filtered = club[0].bookList[bookIndex].votes.filter(function(value, index, arr){ 
                return value !== userVote;
              })
              club[0].bookList[bookIndex].votes = filtered;
              io.to(data.room).emit("new like", {user: data.user, bookid: data.bookid, NumberOflikes: filtered.length});
              updateInCollection(data.room, club[0].bookList, "bookList");
          }
      }else{
        console.log("book is no longer in the booklist. period. maybe send back error msg")
    };
  });
  
});

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  res.render("index.ejs", {errorMsg: ""});
});

  app.post('/', async function(req, res) {
    let cleanPin = req.body.roomName.toLowerCase()
    club = await GetFromDB("clubs" ,cleanPin);
    clubChat = await GetFromDB(`club-${cleanPin}`);
    console.log(club);
    if (club[0]){
      res.render("club.ejs", {
				clubName: club[0].clubName,
				username: req.body.username,
				pin: club[0].clubPin,
				date: club[0].date,
				bookList: club[0].bookList,
				users: club[0].userlist,
				chat: clubChat
			});
    }
    else{
      res.render("index.ejs", {errorMsg: "room pin doesn't exist! pick another one"});
    }
  })

  // create new club room and fill it in 
  app.post('/create-new', async function(req, res) {
      let clubPin = makeid()
      const check = await GetFromDB(`club-${clubPin}`)
      if(check.length == 0){
        await createNewCollection(clubPin);
      }else{
        // we should be using a callback to check if the id has already been used and if it has then generate a new one... but im gonna do a quick and dirty thing here so yea.. sorry
        clubPin = makeid();
        await createNewCollection(clubPin);
      }
      await writeDb(
				"clubs",
				{
          clubName: req.body.clubName,
					host: req.body.username,
					date: `${req.body.date ? req.body.date : "set date here"}`,
					pin: clubPin
				},
				"to clubs"
      )
      club = await GetFromDB("clubs" ,clubPin);
      clubChat = await GetFromDB(`club-${clubPin}`);
      res.render("club.ejs", {
				clubName: club[0].clubName,
				username: req.body.username,
				pin: club[0].clubPin,
				date: club[0].date,
				bookList: club[0].bookList,
				users: club[0].userlist,
				chat: clubChat
			});
  })
  
 
  app.get('/new-room', async function(req,res){
      res.render("create.ejs");
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

http.listen(process.env.PORT || port, () =>
  console.log(`Realtime app on ${port}!`)
);
