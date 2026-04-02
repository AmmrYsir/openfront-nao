import "./style.css";

const baseUrl = import.meta.env.BASE_URL ?? "/";
const normalizedBase =
  baseUrl.endsWith("/") && baseUrl.length > 1 ? baseUrl.slice(0, -1) : baseUrl;
const classicPath = `${normalizedBase === "/" ? "" : normalizedBase}/classic/index.html`;
const targetUrl = `${classicPath}${window.location.search}${window.location.hash}`;

if (window.location.pathname !== classicPath) {
  window.location.replace(targetUrl);
}
