import { it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import BookignSearchService, {
  type SupportedFormats,
} from "./BookSearchService";

const fakeData = {
  book: {
    title: "random title",
    author: "random author",
    isbn: "1234567890",
  },
  stock: {
    quantity: 10,
    price: 1000,
  },
};

it("BookignSearchService.getBooksByAuthor sends the correct query params", async () => {
  let queryParams;

  const client = new BookignSearchService("json");

  server.use(
    http.get("http://api.book-seller-example.com/by-author*", ({ request }) => {
      const url = new URL(request.url);
      queryParams = {
        q: url.searchParams.get("q"),
        limit: url.searchParams.get("limit"),
        format: url.searchParams.get("format"),
      };

      return HttpResponse.json([]);
    })
  );

  await expect(
    client.getBooksByAuthor({ authorName: "Hemingway", limit: 10 })
  ).resolves.toEqual([]); // Assuming you await or return a promise

  expect(queryParams).toEqual({
    q: "Hemingway",
    limit: "10",
    format: "json",
  });
});

it.each([["json"], ["xml"]])(
  "BookignSearchService.getBooksByAuthor should return list of books by author in %s format",
  async (format) => {
    const client = new BookignSearchService(format as SupportedFormats);

    // assumption made on the stucture of the fake data
    server.use(
      http.get(
        "http://api.book-seller-example.com/by-author*",
        ({ request }) => {
          const searchParms = new URL(request.url).searchParams;
          const format = searchParms.get("format");

          if (format === "xml") {
            const xml = `<books>
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
            </books>`.trim();

            return HttpResponse.xml(xml);
          }

          return HttpResponse.json([fakeData]);
        }
      )
    );

    await expect(
      client.getBooksByAuthor({ authorName: "John Doe", limit: 10 })
    ).resolves.toEqual([
      {
        title: fakeData.book.title,
        author: fakeData.book.author,
        isbn: fakeData.book.isbn,
        quantity: fakeData.stock.quantity,
        price: fakeData.stock.price,
      },
    ]);
  }
);

it("BookignSearchService.getBooksByAuthor should handle errors", async () => {
  const client = new BookignSearchService("json");

  server.use(
    http.get("http://api.book-seller-example.com/by-author*", () => {
      return HttpResponse.json({ error: "Not Found" }, { status: 404 });
    })
  );

  await expect(
    client.getBooksByAuthor({ authorName: "Unknown Author", limit: 5 })
  ).rejects.toThrow("Request failed with status 404");
});
