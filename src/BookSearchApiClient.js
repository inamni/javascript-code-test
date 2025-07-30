function BookSearchApiClient(format) {
  this.format = format;
}

BookSearchApiClient.prototype.getBooksByAuthor = function (authorName, limit) {
  var xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.open(
      "GET",
      "http://api.book-seller-example.com/by-author?q=" +
        authorName +
        "&limit=" +
        limit +
        "&format=" +
        this.format
    );

    xhr.onload = () => {
      if (xhr.status == 200) {
        if (this.format == "json") {
          var json = JSON.parse(xhr.responseText);
          resolve(
            json.map(function (item) {
              return {
                title: item.book.title,
                author: item.book.author,
                isbn: item.book.isbn,
                quantity: item.stock.quantity,
                price: item.stock.price,
              };
            })
          );
        } else if (this.format == "xml") {
          var xml = xhr.responseXML;

          resolve(
            Array.from(xml.documentElement.children).map((item) => {
              const book = item.getElementsByTagName("book")[0];
              const stock = item.getElementsByTagName("stock")[0];
              return {
                title: book.getElementsByTagName("title")[0].textContent,
                author: book.getElementsByTagName("author")[0].textContent,
                isbn: book.getElementsByTagName("isbn")[0].textContent,
                quantity: parseInt(
                  stock.getElementsByTagName("quantity")[0].textContent,
                  10
                ),
                price: parseFloat(
                  stock.getElementsByTagName("price")[0].textContent,
                  10
                ),
              };
            })
          );
        }
      } else {
        alert("Request failed.  Returned status of " + xhr.status);
        reject(new Error("Request failed with status " + xhr.status));
      }
    };
    xhr.send();
  });
};

module.exports = BookSearchApiClient;
