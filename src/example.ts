import BookingSearchService from "./BookSearchService";

const client = new BookingSearchService("json");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const booksByShakespeare = client.getBooksByAuthor({
  authorName: "Shakespeare",
  limit: 10,
});
