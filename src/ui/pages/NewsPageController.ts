import { assetUrl } from "../../core/assets/assetUrl";

interface NewsPageControllerOptions {
  host: HTMLElement;
  onStatus?: (status: string) => void;
}

function trimNews(text: string): string {
  const lines = text
    .split(/\r?\n/g)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  return lines.slice(0, 80).join("\n");
}

export class NewsPageController {
  private readonly host: HTMLElement;
  private readonly onStatus?: (status: string) => void;
  private newsBody: HTMLElement | null = null;

  constructor(options: NewsPageControllerOptions) {
    this.host = options.host;
    this.onStatus = options.onStatus;
    this.render();
    this.newsBody = this.host.querySelector<HTMLElement>("[data-news-body]");
  }

  async hydrate(): Promise<void> {
    this.onStatus?.("Loading latest changelog...");

    try {
      const response = await fetch(assetUrl("legacy/resources/changelog.md"));
      if (!response.ok) {
        throw new Error(`Failed to load changelog: ${response.status}`);
      }
      const markdown = await response.text();
      if (this.newsBody) {
        this.newsBody.textContent = trimNews(markdown);
      }
      this.onStatus?.("Latest changelog loaded.");
    } catch {
      if (this.newsBody) {
        this.newsBody.textContent = "Unable to load changelog.";
      }
      this.onStatus?.("News feed unavailable.");
    }
  }

  dispose(): void {
    // no-op
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--news">
        <header class="panel-head">
          <h2>News</h2>
          <p class="panel-subtitle">Legacy changelog feed migrated from modal surface.</p>
        </header>
        <pre class="status-block" data-news-body>Loading changelog...</pre>
      </section>
    `;
  }
}
