import BookingSearchService from "./BookSearchService";

const client = new BookingSearchService("json");

const booksByShakespeare = client.getBooksByAuthor({
  authorName: "Shakespeare",
  limit: 10,
});
