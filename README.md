# Real-Time Web @cmda-minor-web · 2019-2020

## Online booklub

welcome to your online book club, you can send messages, RSVP and reccomend and vote books to your club
Everything needed to help you swiftly plan your club's next meeting

![book app](https://i.imgur.com/xj4NJOE.png "application go brr")  

live link to the application on heroku!
[here](https://bookclub-rtw.herokuapp.com/)

talk-about, share and vote for books with your club mates and create a reading list together.

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

## Concept
It's for helping bookclubs pick a book and a date for their next meeting!  

The rooms in my application are created by users and are for plannning a meeting for a bookclub. I got this idea from a friend I was visiting who would do this over the phone and via a Whatsapp chatgroup wherein their bookclub would spend a couple days picking a book (or books) and picking a date, I thought it could be very cool if I could make a simple tool to help out with that and this is my result. A user can create a room specifying the name of the club/meeting and the first initial date (date can always be changed in later). The app generates a unique 5-symbol pin which is like your club pin and users can use that pin to join your clubroom!  
The application then creates a room for them where they can quickly search books and share them in the group, add them to a reading list and vote for books you like to show them at the top of the list. This way everyone see clearly what the plan is and the room is kept online even after all users leave, so they can revisit the room if they would choose to.


## APi

The Google Books API has a couple features but I only used 1 (the application can do filters on all sorts of book data but I wasn't interested in that for this application). The Api is free and I didn't run into any rate-limits which is great.

The only call coming from the application goes straight from the client and looks like this:

```javascript
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

You can see the data returned in the data life-cycle part two sections below, if interested.

## Database

What's very important that I forgot to mention was that the server generates a unique 5-symbol pin which is like your identifier pretty much and thats how users can join their respective clubrooms and we also use that pin to do all the database stuff (writing, updating and fetching).

The database is the nice part, here all the users data is stored so that if a user leaves a room that the data is still there if they re-enter. (Also we perform some checks with the data to make sure we have one true source but that would be done either way if you were to save the data on the server).

here's what a clubroom's data object could look like:  
![clubroom data object](https://i.imgur.com/d54xdTw.png "data object goes brr brr")  

<details>
  <summary>Click to show explanation of the club's data object</summary>
  
```

Userlist = the users that rsvp'd
booklist = all the books in the reading list (also contains likes that a book has)
clubpin = the unique code for joining
clubname = the name specified at the start and can NEVER EVER be changed (without accessing the database manually)
date = the current meeting date (this one CAN be changed at all times by regular users in the room)
host = creator of the room (I wanted to add host-only functionalities but I ran out of time... would have been nice though!)  
```
</details>

The application writes to, updates, and fetches data from the Mongo DB database and does so with a few calls which are structured in a similar manner.  
Such a call could look like this

```javascript
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
Here's a small visualisation of the data life cycle, showing where data is available and where the data changes/is manipulated.
![book app](https://i.imgur.com/LUkvP18.png "application go brr")  

Data being manipulated:  

The data being manipulated from the Api is just a small cleanup of all the results received after a search.   
This is the data object a search could return:
<details>
  <summary>Click to expand huge data object</summary>
  
  ```json
accessInfo:
accessViewStatus: "SAMPLE"
country: "NL"
embeddable: true
epub:
isAvailable: false
pdf:
isAvailable: false
publicDomain: false
quoteSharingAllowed: false
textToSpeechPermission: "ALLOWED"
viewability: "PARTIAL"
webReaderLink: "http://play.google.com/books/reader?id=-XtqDQAAQBAJ&hl=&printsec=frontcover&source=gbs_api"
etag: "U+U2xCy5NHw"
id: "-XtqDQAAQBAJ"
kind: "books#volume"
saleInfo:
country: "NL"
isEbook: false
saleability: "NOT_FOR_SALE"
searchInfo:
textSnippet: "The second tier is the commitment to the set of rules governing trade for specific sectors, such as agricultural and textile goods, or information technology and telecommunications. This is set out in China&#39;s accession protocol."
selfLink: "https://www.googleapis.com/books/v1/volumes/-XtqDQAAQBAJ"
volumeInfo:
allowAnonLogging: false
authors: (2) ["Cheong Ching", "Hung Yee Ching"]
canonicalVolumeLink: "https://books.google.com/books/about/Handbook_on_China_s_WTO_Accession_and_It.html?hl=&id=-XtqDQAAQBAJ"
categories: ["Business & Economics"]
contentVersion: "1.1.1.0.preview.1"
description: "It has taken China 15 long years of tough negotiations to achieve accession to the World Trade Organization (WTO). By becoming a full member of the WTO, China has in fact made three tiers of commitments. The first tier is the commitment to the objectives of the WTO, such as free trade, most-favoured nations, national treatment and transparency, as expounded in the various documents setting up the organization and its predecessor, the GATT. The second tier is the commitment to the set of rules governing trade for specific sectors, such as agricultural and textile goods, or information technology and telecommunications. This is set out in China's accession protocol..."
imageLinks: {smallThumbnail: "http://books.google.com/books/content?id=-XtqDQAAQ…=frontcover&img=1&zoom=5&edge=curl&source=gbs_api", thumbnail: "http://books.google.com/books/content?id=-XtqDQAAQ…=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"}
industryIdentifiers: (2) [{…}, {…}]
infoLink: "http://books.google.nl/books?id=-XtqDQAAQBAJ&dq=yee&hl=&source=gbs_api"
language: "en"
maturityRating: "NOT_MATURE"
pageCount: 443
panelizationSummary: {containsEpubBubbles: false, containsImageBubbles: false}
previewLink: "http://books.google.nl/books?id=-XtqDQAAQBAJ&printsec=frontcover&dq=yee&hl=&cd=7&source=gbs_api"
printType: "BOOK"
publishedDate: "2003"
publisher: "World Scientific"
readingModes: {text: false, image: true}
title: "Handbook on China's WTO Accession a...
```
</details>


It's a lot of data and not everything was needed so i cleaned it up a bit to this:  
```javascript
{
data.volumeInfo.imageLinks,
data.volumeInfo.title,
data.volumeInfo.subtitle,
data.volumeInfo.authors,
data.volumeInfo.description,
data.volumeInfo.publishedDate,
data.saleInfo.listPrice,
data.saleInfo.buyLink,
}
```
nice  

Other data being manipulated is all the data about the clubroom itself, so the date, rsvp's, books in the reading list, likes of said books and also the chat of course.  
All of these are simple writing and updating functions to Mongo Db, I explain a little bit about it in the section above. 


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
```javascript
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
```javascript
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
- [ ] feedback message for when a book is added to reading list (kind of important...)
- [ ] feedback message for when a user has voted/liked
- [ ] View most-liked books
- [ ] View other clubs lists (read-only)
- [ ] Top books/reading lists on homescreen
- [ ] Error handling

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[rubric]: https://docs.google.com/spreadsheets/d/e/2PACX-1vTjLC7HzQngsRCmkxTGWvKkkH1JuA5KivKdky_9dzr1zzghARw4-ldQW_tWO3zpxT7ZQC7SpiUa0q2z/pubhtml?gid=0&single=true
