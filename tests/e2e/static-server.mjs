import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = fileURLToPath(new URL("../../", import.meta.url));
const distDirectory = resolve(rootDirectory, "dist");
const host = "127.0.0.1";
const port = Number.parseInt(process.env.PLAYWRIGHT_PORT ?? "4179", 10);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function rewrittenPath(pathname) {
  if (pathname === "/quiz" || pathname === "/quiz/") return "/quiz.html";
  if (pathname === "/privacy" || pathname === "/privacy/") {
    return "/privacy.html";
  }
  if (
    /^\/(?:sign-in|coach\/sign-in|account\/(?:setup|confirm|reset)|onboarding|dashboard|portal|admin)(?:\/.*)?$/.test(
      pathname
    )
  ) {
    return "/app.html";
  }
  if (pathname === "/") return "/index.html";
  return pathname;
}

function safeFilePath(pathname) {
  const relativePath = normalize(rewrittenPath(pathname)).replace(
    /^(\.\.(\/|\\|$))+|^[\/\\]+/,
    ""
  );
  const filePath = resolve(join(distDirectory, relativePath));
  if (
    filePath !== distDirectory &&
    !filePath.startsWith(`${distDirectory}${sep}`)
  ) {
    return null;
  }
  return filePath;
}

if (!existsSync(join(distDirectory, "index.html"))) {
  throw new Error(
    "dist is missing. Run `pnpm build` before starting the E2E server."
  );
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url ?? "/", `http://${host}:${port}`).pathname
    );
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const filePath = safeFilePath(pathname);
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type":
      contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  process.stdout.write(`E2E server listening at http://${host}:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
