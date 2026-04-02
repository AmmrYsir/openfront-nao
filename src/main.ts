import { createGameApp } from "./core/app/createGameApp";
import "./style.css";

const host = document.querySelector<HTMLDivElement>("#app");
if (host === null) {
  throw new Error("Missing #app root element.");
}

const gameApp = createGameApp(host);
gameApp.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    gameApp.stop();
  });
}
