# Real-Time Web @cmda-minor-web · 2019-2020

## Online booklub

welcome to your online book club, you can send messages, RSVP and reccomend and vote books to your club
Everything needed to help you swiftly plan your next meeting

https://i.imgur.com/SgB8SMU.png
![app do]: https://i.imgur.com/SgB8SMU.png "application go brr"

live link to the application on heroku!
[here](https://bookclub-rtw.herokuapp.com/)

Like reccomended books with your club mates and create a reading list together.

## table of content
install
api
Database
data life cycle
events
status
wishlist    

## Install

My application uses Node and Express, You'll need Node.js to run this project.
```
Clone my repo

cd real-time-web-1920

npm install

npm run dev
```

To use the book application, you'll need to make a MongoDb databass, make a collection called "rtw" and inside that make a document called clubs. Also you'll need to pass some environment variables but you could also just hardcode them if you really don't feel like...

These are the env variables i used:
```
DB_NAME=mongodb+srv://<name>:<password>@cluster0-agp6q.mongodb.net/<db-name>  
SESSION_SECRET=<secret>
```

thats all you'll need so let's get it

## APi

The Google Books API has a couple features but I only used 1 (the application can do filters on all sorts of book data but I wasn't interested in that for this application). The Api is free and I didn't run into any rate-limits which is great.

The only call coming from the application goes straight from the client and looks like this:

```
  function dataFetch(typeUrl) {
    fetch(typeUrl)
      .then(function(data) {
        return data
      })
      .then(function(unparsedData) {
        return unparsedData.json()
      })      
```
that's it.

The user can send data from the api through the server to friends in the same space which is what is nice about this application.
You can read more about the Google Books Api [here](https://developers.google.com/books/docs/v1/using).

## Database

The database is the nice part, here all the users data is stored so that if a user leaves a room that the data is still there if they re-enter. (Also we perform some checks with the data to make sure we have one true source but that's )
The database is the nice part, here all the users data is stored so that if a user leaves a room that the data is still there if they re-enter. (Also we perform some checks with the data to make sure we have one true source but that would be done either way if you were to save the data on the server).

The application writes to, updates and looks up data from the Mongo DB database and does so with a few calls which are structured in a similar manner.  
Such a call could look like this

```
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
    return updatedDocument;
```

If you were to look in the code you'd see a lot of repetition which I know is bad... sorry.  

## Data life cycle


## Events

Users in this application have a number of different ways with which they may interact with each other.
They can:
* send messages to one another
* receive said messages
* change the date of meeting 
* share books
* vote about books (through likes)
* show attendance of meeting through rsvp

These are all socket io powered events, nice. They work in similar manner:
```
user fires event to server > sever emits event to all users in specific room > users in room receive event
```

some events such as likes and rsvp-ing check in the database for clarity so we can make sure all users receive the right data and that we don't start having a hickups (technical term?). And those events have an extensive check before so they take only a second longer than the others, they could look like this:  
```
// this is the function that handles the rsvp's

socket.on("attend", async function(data) {
    const club = await GetFromDB("clubs", data.room);
    if(!club[0].userlist.includes(data.user)){
      club[0].userlist.push(data.user) 
      io.to(data.room).emit("user attending", data.user);
      updateInCollection(data.room, club[0].userlist, "userlist");
    }else{
      const indexOfItem = club[0].userlist.indexOf(data.user);
      io.to(data.room).emit("user un-attending", data.user);
      if (indexOfItem > -1) {
        club[0].userlist.splice(indexOfItem, 1);
      }
      updateInCollection(data.room, club[0].userlist, "userlist");
    }
```

there is a data parameter that comes from the client emmitting certain data, this data is then used to fetch the according object from the database so we can perform checks on it before emmitting the correct data to the entire room.  

Another one is a very simple message sending function that takes the users message-inputfield value, sends that to the server, which in turn emits it back to the users:  
```
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
```
If you look closely you can see that the message is not only emmitted to the room but also added to the room's chat document in the database.

## Wishlist    

- [x] Search for book
- [x] create custom rooms with socket.io
- [x] Join room
- [x] Chat in room
- [ ] Separate club-host from users (with differenet features for hosts)
- [ ] club-host can remove books from reading list
- [ ] make responsive 
- [x] share book to club
- [x] Add book to reading list
- [x] Users can rsvp
- [x] Users can share books
- [x] Users can change date
- [x] Users can vote for books they like
- [x] Store data in database
- [x] Use socket.io for everything
- [ ] View most-liked books
- [ ] View other clubs lists (read-only)
- [ ] Top books/reading lists on homescreen
- [ ] Error handling

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[rubric]: https://docs.google.com/spreadsheets/d/e/2PACX-1vTjLC7HzQngsRCmkxTGWvKkkH1JuA5KivKdky_9dzr1zzghARw4-ldQW_tWO3zpxT7ZQC7SpiUa0q2z/pubhtml?gid=0&single=true
