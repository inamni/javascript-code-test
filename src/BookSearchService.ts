import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

export type SupportedFormats = "json" | "xml";

const BookResponseSchema = z.object({
  book: z.object({
    title: z.string(),
    author: z.string(),
    isbn: z.coerce.number(),
  }),
  stock: z.object({
    quantity: z.coerce.number(),
    price: z.coerce.number(),
  }),
});

type BookResponse = z.infer<typeof BookResponseSchema>;

export interface Book {
  title: BookResponse["book"]["title"];
  author: BookResponse["book"]["author"];
  isbn: BookResponse["book"]["isbn"];
  quantity: BookResponse["stock"]["quantity"];
  price: BookResponse["stock"]["price"];
}

export default class BookSearchService {
  domain = "http://api.book-seller-example.com";
  format: SupportedFormats;

  // future enhancement: should more formats require to be support will be good to remove logic from here and use a factory pattern
  // or a strategy pattern to handle different formats
  constructor(format: SupportedFormats) {
    if (format !== "json" && format !== "xml") {
      throw new Error(`Unsupported format: ${format}`);
    }

    this.format = format;
  }

  async getBooksByAuthor({
    authorName,
    limit,
  }: {
    authorName: string;
    // asumption: limit here is a required param - however this could be optional
    limit: number;
  }): Promise<Book[]> {
    const url = new URL(`${this.domain}/by-author`);

    url.searchParams.append("q", authorName);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("format", this.format);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const raw = await response.text();

    if (this.format === "json") {
      const json = JSON.parse(raw);
      const parsedData = z.array(BookResponseSchema).parse(json);

      return parsedData.map((item) => ({
        title: item.book.title,
        author: item.book.author,
        isbn: item.book.isbn,
        quantity: item.stock.quantity,
        price: item.stock.price,
      }));
    } else if (this.format === "xml") {
      const parser = new XMLParser({
        isArray: (name) => ["books", "item"].includes(name),
      });
      const rawXml = parser.parse(raw);

      const parsedData = z
        .object({
          books: z.array(
            z.object({
              item: z.array(BookResponseSchema),
            }),
          ),
        })
        .parse(rawXml);

      return parsedData.books.flatMap((bookItem) =>
        bookItem.item.map((item) => ({
          title: item.book.title,
          author: item.book.author,
          isbn: item.book.isbn,
          quantity: item.stock.quantity,
          price: item.stock.price,
        })),
      );
    } else {
      throw new Error(`Unsupported format: ${this.format}`);
    }
  }
}
