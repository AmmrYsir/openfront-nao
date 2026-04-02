import { AppUiRoot } from "../../ui/AppUiRoot";
import { ClassicPageController } from "../../ui/pages";

export interface GameApp {
  start: () => void;
  stop: () => void;
}

export function createGameApp(host: HTMLElement): GameApp {
  const uiRoot = new AppUiRoot(host);
  const classicPageController = new ClassicPageController({
    host: uiRoot.getClassicPanelHost(),
    onStatus: (status) => uiRoot.setClassicStatus(status),
  });

  let disposed = false;

  return {
    start: () => {
      uiRoot.setStatus("Booting classic gameplay UI...");
      void classicPageController.hydrate().then(() => {
        uiRoot.setStatus("Classic gameplay UI ready.");
      }).catch(() => {
        uiRoot.setStatus("Classic gameplay startup failed.");
        uiRoot.setClassicStatus(
          "Classic UI service error. Run `npm run classic:build` and retry.",
        );
      });
    },
    stop: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      classicPageController.dispose();
      uiRoot.dispose();
    },
  };
}
