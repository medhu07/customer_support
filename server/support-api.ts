import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"

type ChatRole = "user" | "assistant"

type ChatMessage = {
  role: ChatRole
  content: string
}

type SupportRequest = {
  messages?: unknown
}

type SupportApiConfig = {
  apiKey?: string
  model?: string
  baseUrl?: string
}

const SYSTEM_INSTRUCTION = `You are Cheer Support Guide, a patient customer support specialist for Cheer.io.

Your audience is non-technical. Use plain language, short paragraphs, and a calm, respectful tone.

Behavior:
- Understand the user's actual question and use the full conversation for context.
- Ask one focused follow-up question when important information is missing.
- Give issue-specific guidance. Use clearly numbered steps when instructions are appropriate.
- After giving a solution, ask whether it worked.
- If the user says a solution failed, acknowledge that and offer a meaningfully different next step or ask for the detail needed to choose one.
- Offer human support when the issue remains unresolved, confidence is low, or the topic involves security, privacy, billing disputes, account ownership, or other high-risk actions.
- Do not ask for passwords, API keys, authentication codes, payment card details, or other secrets.
- Never claim that you fixed an issue, changed an account, or submitted a support ticket.

Accuracy:
- No verified Cheer.io documentation is connected to this assistant. Do not invent product features, menu names, settings, limits, or product-specific procedures.
- When official product details are needed, clearly say that you cannot verify them. Ask a clarifying question or provide only qualified, general troubleshooting advice.
- For questions unrelated to using Cheer.io, politely explain that you can help with Cheer.io support and ask how the product is involved.

Keep most answers under 220 words unless the user asks for more detail.`

const MAX_BODY_BYTES = 64_000
const MAX_MESSAGES = 40
const MAX_MESSAGE_LENGTH = 4_000
const REQUESTS_PER_MINUTE = 20
const requestLog = new Map<string, number[]>()

function sendJson(res: ServerResponse, status: number, body: object) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error("REQUEST_TOO_LARGE")
    }
    chunks.push(buffer)
  }

  const body = Buffer.concat(chunks).toString("utf8")
  return body ? JSON.parse(body) : {}
}

function validateMessages(value: unknown): ChatMessage[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_MESSAGES
  ) {
    return null
  }

  const messages: ChatMessage[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") return null
    const role = "role" in item ? item.role : undefined
    const content = "content" in item ? item.content : undefined

    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > MAX_MESSAGE_LENGTH
    ) {
      return null
    }

    messages.push({ role, content: content.trim() })
  }

  if (messages.at(-1)?.role !== "user") return null
  return messages
}

function isRateLimited(req: IncomingMessage) {
  const forwarded = req.headers["x-forwarded-for"]
  const ip =
    (Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(",")[0]
    )?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  const now = Date.now()
  const recent = (requestLog.get(ip) || []).filter(
    (time) => now - time < 60_000,
  )
  recent.push(now)
  requestLog.set(ip, recent)
  return recent.length > REQUESTS_PER_MINUTE
}

async function requestAssistant(
  messages: ChatMessage[],
  config: SupportApiConfig = {},
) {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY
  const model = config.model || process.env.OPENAI_MODEL || "gpt-4o-mini"
  const baseUrl = (
    config.baseUrl ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/+$/, "")

  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 35_000)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...messages,
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
  const details = await response.text()

  console.error(
    "[Cheer AI Error]",
    response.status,
    details.slice(0, 1000)
  )

  throw new Error(`AI_UPSTREAM_${response.status}`)
}

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error("AI_EMPTY_RESPONSE")
    }

    return { content, model }
  } finally {
    clearTimeout(timeout)
  }
}

export async function handleSupportRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: SupportApiConfig = {},
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    sendJson(res, 405, { error: "Method not allowed." })
    return
  }

  if (isRateLimited(req)) {
    sendJson(res, 429, {
      error: "Too many requests. Please wait a moment and try again.",
    })
    return
  }

  try {
    const body = (await readJson(req)) as SupportRequest
    const messages = validateMessages(body.messages)

    if (!messages) {
      sendJson(res, 400, {
        error: "A valid conversation ending with a user message is required.",
      })
      return
    }

    const answer = await requestAssistant(messages, config)
    sendJson(res, 200, { message: answer.content, model: answer.model })
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN"
    console.error("[Support API Error]", code)

    if (code === "REQUEST_TOO_LARGE") {
      sendJson(res, 413, { error: "The conversation is too large to process." })
      return
    }

    if (code === "AI_NOT_CONFIGURED") {
      sendJson(res, 503, {
        error:
          "AI support is not configured. Add OPENAI_API_KEY to the server environment.",
      })
      return
    }

    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: "The request body must be valid JSON." })
      return
    }

    sendJson(res, 502, {
      error:
        "The AI assistant could not respond right now. Please try again or contact support.",
    })
  }
}

export function supportApiPlugin(config: SupportApiConfig = {}): Plugin {
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const pathname = req.url?.split("?")[0]
    if (!pathname?.endsWith("/api/support")) {
      next()
      return
    }

    void handleSupportRequest(req, res, config)
  }

  return {
    name: "cheer-support-api",
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
