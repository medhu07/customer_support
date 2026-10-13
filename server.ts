import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { handleSupportRequest } from "./server/support-api.ts"

const dist = path.resolve("dist")

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
}

const server = createServer(async (req, res) => {
  const pathname = new URL(
    req.url || "/",
    "http://localhost",
  ).pathname

  if (pathname === "/api/support") {
    await handleSupportRequest(req, res)
    return
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405)
    res.end("Method not allowed")
    return
  }

  try {
    let filePath = path.resolve(
      dist,
      "." + decodeURIComponent(pathname),
    )

    
const resolvedDist = path.resolve(dist)

if (filePath === resolvedDist) {
  filePath = path.join(resolvedDist, "index.html")
}

if (!filePath.startsWith(resolvedDist + path.sep)) {
  res.writeHead(403)
  res.end("Forbidden")
  return
}


    try {
      if ((await stat(filePath)).isDirectory()) {
        filePath = path.join(filePath, "index.html")
      }
    } catch {
      filePath = path.join(dist, "index.html")
    }

    const content = await readFile(filePath)
    res.setHeader(
      "Content-Type",
      mimeTypes[path.extname(filePath)] || "application/octet-stream",
    )
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.end(req.method === "HEAD" ? undefined : content)
  } catch {
    res.writeHead(404)
    res.end("Not found")
  }
})

const port = Number(process.env.PORT || 10000)

server.listen(port, "0.0.0.0", () => {
  console.log(`Cheer server listening on port ${port}`)
})
