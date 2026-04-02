import type { ServerResponse } from "node:http";

export function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  corsOrigin: string,
): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", corsOrigin);
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.end(JSON.stringify(payload));
}

export function handlePreflight(
  response: ServerResponse,
  corsOrigin: string,
): void {
  response.statusCode = 204;
  response.setHeader("Access-Control-Allow-Origin", corsOrigin);
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.end();
}
