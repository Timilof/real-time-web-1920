// let lastKeyTime = Date.now();
// if (currentTime - lastKeyTime > 1000) {
//   horsey = [];
// empty the word array if the letter is typed too late so we start all over again
// }
// lastKeyTime = currentTime;

const searchButton = document.querySelector(".searchButton");
const searchField = document.querySelector(".searchField");
const searchContainer = document.querySelector(".searchContainer");
let staticUrl = "https://www.googleapis.com/books/v1/volumes?q=";

function buildBooks(data){
  let book = `
    <div class="book-result">
        <div class="premium-book-data">
            ${data.volumeInfo.imageLinks ? `<img class="book-cover" src="${data.volumeInfo.imageLinks.thumbnail}" alt="${data.volumeInfo.title}">` : `<img src="https://i.stack.imgur.com/y9DpT.jpg" alt="${data.volumeInfo.title}">`}
            ${data.volumeInfo.title ? `<p>${data.volumeInfo.title}</p>` : ""}
            ${data.volumeInfo.subtitle ? `<p class="small">${data.volumeInfo.subtitle}</p>` : ""}
            ${data.volumeInfo.authors ? `<p class="small">by ${data.volumeInfo.authors[0]}</p>` : ""}
        </div>
        <div class="descriptionContainer">
            ${data.volumeInfo.description ? `<p>${data.volumeInfo.description}</p>` : ""}
            ${data.volumeInfo.publishedDate ? `<p class="small">published in ${data.volumeInfo.publishedDate}</p>` : ""}
        </div>
        <div class="priceContainer">            
            <button data-bookid="bm${data.id}" data-title="${data.volumeInfo.title ? data.volumeInfo.title : ""}" data-subtitle="${data.volumeInfo.subtitle ? data.volumeInfo.subtitle: ""}" data-cover="${data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : ""}" data-description="${data.volumeInfo.description ? data.volumeInfo.description : ""}" data-author="${data.volumeInfo.authors ? data.volumeInfo.authors[0] : ""}" data-price="${data.saleInfo.listPrice ? data.saleInfo.listPrice.amount : ""}" class="share">share</button>
            ${data.saleInfo.listPrice ? `<p class="book-price">€${data.saleInfo.listPrice.amount}</p>` : ""}
            ${data.saleInfo.buyLink ? `<a class="buy-link" target="_blank" href="${data.saleInfo.buyLink}">Buy</a>` : `<p class="buy-link inactive">Unnavailable</p>`}
        </div>
    </div>
  `
  searchContainer.insertAdjacentHTML('beforeend', book)
}

document.querySelector(".collapse").addEventListener("click", e=>{
  e.preventDefault();
  searchContainer.classList.toggle("hidden")
})

function toggleResults(){
  searchContainer.classList.remove("hidden")
}



  function dataFetch(typeUrl) {
    fetch(typeUrl)
      .then(function(data) {
        return data
      })
      .then(function(ongeparsteData) {
        return ongeparsteData.json()
      })
      .then(function(geparsteData) {
          // removeEvents()
          searchContainer.innerHTML = "";
          // dangerously placed innerHTML...
          
          geparsteData.items.forEach((book) => {
            buildBooks(book)
          })
          addListener()
          toggleResults()
      })
  }

  function search(value){
    let typeUrl = staticUrl + value
    dataFetch(typeUrl)
  }

searchButton.addEventListener("click", function(e) {
  e.preventDefault();
  search(searchField.value)
});

searchField.addEventListener("keydown", function(e) {
  if (e.key == "Enter") {
    e.preventDefault();
    search(searchField.value)
  }
});

