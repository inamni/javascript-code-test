import { test, describe, expect } from "vitest";
import { http, HttpResponse, type HttpResponseResolver } from "msw";
import { server } from "./mocks/server";
import BookignSearchService, {
  type SupportedFormats,
} from "./BookSearchService";

const fakeData = {
  book: {
    title: "random title",
    author: "random author",
    isbn: 1234567890,
  },
  stock: {
    quantity: 10,
    price: 1000,
  },
};

test("constructor throws on unsupported format", () => {
  expect(
    () => new BookignSearchService("unsupported" as SupportedFormats),
  ).toThrow("Unsupported format: unsupported");
});

describe.each([
  ["json" as SupportedFormats, JSON.stringify([fakeData])],
  [
    "xml" as SupportedFormats,
    `<books>
                  <item>
                    <book>
                      <title>${fakeData.book.title}</title>
                      <author>${fakeData.book.author}</author>
                      <isbn>${fakeData.book.isbn}</isbn>
                    </book>
                    <stock>
                      <quantity>${fakeData.stock.quantity}</quantity>
                      <price>${fakeData.stock.price}</price>
                    </stock>
                  </item>
                </books>`.trim(),
  ],
])(
  "given the serivce class has been inialised with %s format",
  (format, testData) => {
    test("getBooksByAuthor sends the correct query params", async () => {
      let queryParams;

      const client = new BookignSearchService(format);

      apiSetupHelper(({ request }) => {
        const url = new URL(request.url);
        queryParams = {
          q: url.searchParams.get("q"),
          limit: url.searchParams.get("limit"),
          format: url.searchParams.get("format"),
        };

        return HttpResponse.text(testData);
      });

      await expect(
        client.getBooksByAuthor({ authorName: "Hemingway", limit: 10 }),
      ).resolves.not.toBeUndefined();

      expect(queryParams).toEqual({
        q: "Hemingway",
        limit: "10",
        format: format,
      });
    });

    test("getBooksByAuthor should return list of books by author", async () => {
      const client = new BookignSearchService(format);

      // assumption made on the stucture of the fake data
      apiSetupHelper(() => HttpResponse.text(testData));

      await expect(
        client.getBooksByAuthor({ authorName: "John Doe", limit: 10 }),
      ).resolves.toEqual([
        {
          title: fakeData.book.title,
          author: fakeData.book.author,
          isbn: fakeData.book.isbn,
          quantity: fakeData.stock.quantity,
          price: fakeData.stock.price,
        },
      ]);
    });

    test("getBooksByAuthor should handle http errors", async () => {
      const client = new BookignSearchService(format);

      apiSetupHelper(() =>
        HttpResponse.json({ error: "Not Found" }, { status: 404 }),
      );

      await expect(
        client.getBooksByAuthor({ authorName: "Unknown Author", limit: 5 }),
      ).rejects.toThrow("Request failed with status 404");
    });

    test("getBooksByAuthor should throw an error if the response is not in the expected format", async () => {
      const client = new BookignSearchService(format);

      apiSetupHelper(() => HttpResponse.text("Unexpected response format"));

      await expect(
        client.getBooksByAuthor({ authorName: "Unknown Author", limit: 5 }),
      ).rejects.toThrow();
    });
  },
);

function apiSetupHelper(handler: HttpResponseResolver) {
  server.use(
    http.get("http://api.book-seller-example.com/by-author*", handler),
  );
}
