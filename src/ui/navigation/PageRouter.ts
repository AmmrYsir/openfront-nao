export type PageChangeHandler = (pageId: string) => void;

export class PageRouter {
  private currentPageId: string;
  private readonly handlers = new Set<PageChangeHandler>();

  constructor(defaultPageId: string) {
    this.currentPageId = defaultPageId;
  }

  getCurrentPageId(): string {
    return this.currentPageId;
  }

  showPage(pageId: string): void {
    if (pageId === this.currentPageId) {
      return;
    }
    this.currentPageId = pageId;
    for (const handler of this.handlers) {
      handler(pageId);
    }
  }

  onChange(handler: PageChangeHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export function bindPageRouterToDom(
  router: PageRouter,
  root: ParentNode,
): () => void {
  const applyPage = (pageId: string): void => {
    const panels = root.querySelectorAll<HTMLElement>("[data-page-panel]");
    for (const panel of panels) {
      const targetPage = panel.dataset.pagePanel;
      const isActive = targetPage === pageId;
      panel.hidden = !isActive;
      panel.classList.toggle("active", isActive);
    }

    const navItems = root.querySelectorAll<HTMLElement>(".nav-menu-item[data-page]");
    for (const item of navItems) {
      const isActive = item.dataset.page === pageId;
      item.classList.toggle("active", isActive);
    }
  };

  applyPage(router.getCurrentPageId());
  const detach = router.onChange(applyPage);
  return detach;
}
