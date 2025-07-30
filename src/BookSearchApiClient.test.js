import { it, expect } from "vitest";
import BookSearchApiClient from "./BookSearchApiClient";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";

const fakeData = [
  {
    book: {
      title: "random title",
      author: "random author",
      isbn: "1234567890",
    },
    stock: {
      quantity: 10,
      price: 1000,
    },
  },
];

it("BookSearchApiClient.getBooksByAuthor sends the correct query params", async () => {
  let queryParams;

  const client = new BookSearchApiClient("json");

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

  await expect(client.getBooksByAuthor("Hemingway", 10)).resolves.toEqual([]); // Assuming you await or return a promise

  expect(queryParams).toEqual({
    q: "Hemingway",
    limit: "10",
    format: "json",
  });
});

it.each([["json"], ["xml"]])(
  "BookSearchApiClient.getBooksByAuthor should return list of books by author in %s format",
  async (format) => {
    const client = new BookSearchApiClient(format);

    // assumption made on the stucture of the fake data
    server.use(
      http.get(
        "http://api.book-seller-example.com/by-author*",
        ({ request }) => {
          const searchParms = new URL(request.url).searchParams;
          const format = searchParms.get("format");

          if (format === "xml") {
            const xml = `<books>${fakeData
              .map(
                (item) => `<item>
          <book>
            <title>${item.book.title}</title>
            <author>${item.book.author}</author>
            <isbn>${item.book.isbn}</isbn>
          </book>
          <stock>
            <quantity>${item.stock.quantity}</quantity>
            <price>${item.stock.price}</price>
          </stock>
        </item>`
              )
              .join("")}</books>`.trim();

            return HttpResponse.xml(xml);
          }

          return HttpResponse.json(fakeData);
        }
      )
    );

    await expect(client.getBooksByAuthor("John Doe", 10)).resolves.toEqual([
      {
        title: fakeData[0].book.title,
        author: fakeData[0].book.author,
        isbn: fakeData[0].book.isbn,
        quantity: fakeData[0].stock.quantity,
        price: fakeData[0].stock.price,
      },
    ]);
  }
);

it("BookSearchApiClient.getBooksByAuthor should handle errors", async () => {
  const client = new BookSearchApiClient("json");

  server.use(
    http.get("http://api.book-seller-example.com/by-author*", () => {
      return HttpResponse.json({ error: "Not Found" }, { status: 404 });
    })
  );

  await expect(client.getBooksByAuthor("Unknown Author", 5)).rejects.toThrow(
    "Request failed with status 404"
  );

  expect(window.alert).toHaveBeenCalledWith(
    "Request failed.  Returned status of 404"
  );
});
