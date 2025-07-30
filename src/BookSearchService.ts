export type SupportedFormats = "json" | "xml";

export interface Book {
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  price: number;
}

export default class BookSearchService {
  domain = "http://api.book-seller-example.com";
  format: SupportedFormats;

  constructor(format: SupportedFormats) {
    this.format = format;
  }

  async getBooksByAuthor({
    authorName,
    limit,
  }: {
    authorName: string;
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

      return json.map((item: any) => ({
        title: item.book.title,
        author: item.book.author,
        isbn: item.book.isbn,
        quantity: item.stock.quantity,
        price: item.stock.price,
      }));
    } else if (this.format === "xml") {
      const parser = new DOMParser();
      const xml = parser.parseFromString(raw, "application/xml");

      // Note: will require some sort of schema validation in a real-world scenario
      return Array.from(xml.documentElement.children).map((item) => {
        const book = item.getElementsByTagName("book")[0];
        const stock = item.getElementsByTagName("stock")[0];

        return {
          title: book?.getElementsByTagName("title")[0]?.textContent,
          author: book?.getElementsByTagName("author")[0]?.textContent,
          isbn: book?.getElementsByTagName("isbn")[0]?.textContent,
          quantity: parseInt(
            stock?.getElementsByTagName("quantity")[0]?.textContent || "",
            10
          ),
          price: parseFloat(
            stock?.getElementsByTagName("price")[0]?.textContent || ""
          ),
        };
      }) as Book[];
    } else {
      throw new Error(`Unsupported format: ${this.format}`);
    }
  }
}
