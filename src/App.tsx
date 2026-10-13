import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"

type Screen = "home" | "chat" | "escalation"
type Role = "user" | "assistant"
type Message = { id: string; role: Role; content: string }
type Feedback = "resolved" | "unresolved" | null
type IconName = "arrow-left" | "arrow-right" | "check" | "chevron-right" | "clock" | "headset" | "home" | "message" | "plus" | "refresh" | "search" | "send" | "sparkles" | "warning"

const suggestions = [
  {
    title: "I cannot log in",
    description: "Get help accessing your account safely.",
    icon: "warning" as IconName,
  },
  {
    title: "I cannot find a feature",
    description: "Explain what you want to do and we will help locate it.",
    icon: "search" as IconName,
  },
  {
    title: "My workflow is failing",
    description: "Work through the problem with specific follow-up questions.",
    icon: "refresh" as IconName,
  },
]

const SUPPORT_API_URL = `${import.meta.env.BASE_URL}api/support`

function createMessage(role: Role, content: string): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  }
}
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-left": <path d="m15 18-6-6 6-6" />,
    "arrow-right": <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    headset: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M18 19c0 1.1-.9 2-2 2h-3" />
        <path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 9a7 7 0 0 1 11.7-2.6L20 12M4 12l2.2 5.6A7 7 0 0 0 17.9 15" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.1 2.9A5 5 0 0 1 8 8.8L5 10l3 1.1a5 5 0 0 1 2.9 2.9l1.1 3 1.1-3a5 5 0 0 1 2.9-2.9l3-1.1-3-1.2a5 5 0 0 1-2.9-2.9L12 3Z" />
        <path d="m19 16-.5 1.3a2 2 0 0 1-1.2 1.2L16 19l1.3.5a2 2 0 0 1 1.2 1.2L19 22l.5-1.3a2 2 0 0 1 1.2-1.2L22 19l-1.3-.5a2 2 0 0 1-1.2-1.2L19 16Z" />
      </>
    ),
    warning: (
      <>
        <path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "primary",
  icon,
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost"
  icon?: IconName
  className?: string
  type?: "button" | "submit"
  onClick?: () => void
  disabled?: boolean
}) {
  const variants = {
    primary:
      "bg-brand text-white shadow-button hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-button-hover",
    secondary:
      "border border-border-strong bg-white text-ink hover:border-brand-soft hover:bg-brand-pale",
    ghost: "text-ink-muted hover:bg-surface hover:text-ink",
  }

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

function TextButton({
  children,
  onClick,
  icon,
}: {
  children: ReactNode
  onClick: () => void
  icon?: IconName
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-brand transition-colors hover:bg-brand-pale focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
      onClick={onClick}
      type="button"
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  )
}

function AssistantBadge({ loading = false }: { loading?: boolean }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-button ${
        loading ? "animate-pulse" : ""
      }`}
    >
      <Icon name="sparkles" size={17} />
    </span>
  )
}

function Shell({
  children,
  screen,
  onHome,
  onNewConversation,
  onEscalate,
}: {
  children: ReactNode
  screen: Screen
  onHome: () => void
  onNewConversation: () => void
  onEscalate: () => void
}) {
  return (
    <div className="app-shell min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-frame items-center justify-between px-10">
          <button
            aria-label="Return to support home"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
            onClick={onHome}
            type="button"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-white shadow-button">
              <Icon name="sparkles" size={19} />
            </span>
            <span className="text-left">
              <span className="block text-base font-bold tracking-tight text-ink">
                Cheer
              </span>
              <span className="block text-xs font-medium text-ink-faint">
                Support Guide
              </span>
            </span>
          </button>
          <nav
            aria-label="Support navigation"
            className="flex items-center gap-3"
          >
            {screen !== "home" && (
              <>
                <Button
                  icon="plus"
                  onClick={onNewConversation}
                  variant="secondary"
                >
                  New conversation
                </Button>
                <span aria-hidden="true" className="h-5 w-px bg-border" />
              </>
            )}
            <TextButton icon="headset" onClick={onEscalate}>
              Contact support
            </TextButton>
          </nav>
        </div>
      </header>
      {screen !== "home" && (
        <div className="relative z-10 border-b border-border bg-white/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-conversation items-center justify-between px-8 py-3">
            <TextButton icon="arrow-left" onClick={onHome}>
              Support home
            </TextButton>
            <span className="flex items-center gap-2 text-xs font-semibold text-ink-faint">
              <span className="size-2 rounded-full bg-success" />
              AI assistant available
            </span>
          </div>
        </div>
      )}
      <main>{children}</main>
      <footer className="mx-auto flex max-w-frame items-center justify-between px-10 py-6 text-xs text-ink-faint">
        <span>Cheer Support Guide</span>
        <span>AI can make mistakes. Review important information.</span>
      </footer>
    </div>
  )
}

function Home({
  question,
  setQuestion,
  onSubmit,
  onSuggestion,
  onEscalate,
  error,
}: {
  question: string
  setQuestion: (value: string) => void
  onSubmit: (event: FormEvent) => void
  onSuggestion: (value: string) => void
  onEscalate: () => void
  error: string
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => inputRef.current?.focus(), [])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="mx-auto max-w-content px-8 pb-14 pt-16">
      <section className="mx-auto max-w-hero text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-pale px-3.5 py-1.5 text-xs font-semibold text-brand">
          <Icon name="sparkles" size={15} />
          AI-powered support, in plain language
        </div>
        <h1 className="text-balance text-5xl font-bold leading-tight tracking-title text-ink">
          How can we help you today?
        </h1>
        <p className="mx-auto mt-5 max-w-copy text-lg leading-8 text-ink-muted">
          Describe what is happening. Cheer Support Guide will ask questions,
          remember the conversation, and help you find a path forward.
        </p>
      </section>

      <form
        className="composer mx-auto mt-9 max-w-search rounded-card border border-border-strong bg-white p-3 shadow-card"
        onSubmit={onSubmit}
      >
        <label className="sr-only" htmlFor="support-question">
          Describe your problem
        </label>
        <div className="flex items-center gap-2 px-4 pt-2 text-xs font-bold uppercase tracking-eyebrow text-brand">
          <Icon name="sparkles" size={14} />
          Ask Cheer
        </div>
        <div className="flex items-end gap-3">
          <textarea
            aria-describedby={error ? "question-error" : "question-help"}
            aria-invalid={Boolean(error)}
            className="min-h-20 flex-1 resize-none rounded-xl border-0 bg-transparent px-4 py-3 text-base leading-7 text-ink outline-none placeholder:text-ink-faint"
            id="support-question"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your problem in your own words"
            ref={inputRef}
            value={question}
          />
          <Button
            className="mb-1 mr-1 min-w-28"
            disabled={!question.trim()}
            icon="send"
            type="submit"
          >
            Send
          </Button>
        </div>
        {error ? (
          <div
            className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-danger-pale px-3 py-2 text-sm text-danger"
            id="question-error"
            role="alert"
          >
            <Icon name="warning" size={16} />
            {error}
          </div>
        ) : (
          <p className="mx-4 mb-2 text-xs text-ink-faint" id="question-help">
            Press Enter to send · Shift + Enter for a new line
          </p>
        )}
      </form>

      <section aria-labelledby="common-questions" className="mt-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-eyebrow text-brand">
              Common starting points
            </p>
            <h2
              className="mt-2 text-2xl font-bold tracking-tight text-ink"
              id="common-questions"
            >
              Start a conversation
            </h2>
          </div>
          <p className="text-sm text-ink-muted">
            Each answer is based on your specific situation
          </p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {suggestions.map((suggestion) => (
            <button
              className="group flex min-h-suggestion flex-col rounded-card border border-border bg-white p-6 text-left shadow-card-subtle transition-all hover:-translate-y-1 hover:border-brand-border hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
              key={suggestion.title}
              onClick={() => onSuggestion(suggestion.title)}
              type="button"
            >
              <span className="mb-5 grid size-11 place-items-center rounded-xl bg-brand-pale text-brand">
                <Icon name={suggestion.icon} size={21} />
              </span>
              <span className="text-lg font-bold tracking-tight text-ink">
                {suggestion.title}
              </span>
              <span className="mt-2 block flex-1 text-sm leading-6 text-ink-muted">
                {suggestion.description}
              </span>
              <span className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-bold text-brand">
                Ask about this
                <span className="grid size-8 place-items-center rounded-full bg-brand-pale transition-all group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white">
                  <Icon name="arrow-right" size={16} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-9 flex items-center justify-center gap-3 rounded-card border border-border bg-white/70 px-6 py-5 shadow-card-subtle">
        <span className="grid size-9 place-items-center rounded-full bg-white text-brand shadow-card-subtle">
          <Icon name="headset" size={18} />
        </span>
        <span className="text-sm text-ink-muted">
          Prefer to speak with a person?
        </span>
        <TextButton onClick={onEscalate}>Contact support</TextButton>
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n")

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/)
        if (numbered) {
          return (
            <div className="flex gap-3 py-1" key={`${index}-${line}`}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-pale text-xs font-bold text-brand">
                {numbered[1]}
              </span>
              <span className="pt-0.5">{numbered[2]}</span>
            </div>
          )
        }

        if (!line.trim()) return <div className="h-1" key={index} />
        return <p key={`${index}-${line}`}>{line}</p>
      })}
    </div>
  )
}

function Chat({
  messages,
  humanMode,
  draft,
  setDraft,
  onSend,
  loading,
  error,
  onRetry,
  feedback,
  onResolved,
  onUnresolved,
  onEscalate,
}: {
  messages: Message[]
  humanMode: boolean
  draft: string
  setDraft: (value: string) => void
  onSend: (value: string) => void
  loading: boolean
  error: string
  onRetry: () => void
  feedback: Feedback
  onResolved: () => void
  onUnresolved: () => void
  onEscalate: () => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading, error])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || loading) return
    onSend(draft)
    setDraft("")
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const canShowFeedback =
    !loading && !error && messages.at(-1)?.role === "assistant"

  return (
    <div className="mx-auto max-w-conversation px-8 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-eyebrow text-brand">
            Support conversation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Tell us what is happening
          </h1>
        </div>
        <p className="max-w-message text-right text-xs leading-5 text-ink-faint">
          For your safety, do not share passwords, security codes, payment
          details, or API keys.
        </p>
      </div>

      <section
        aria-label="Conversation with Cheer Support Guide"
        className="overflow-hidden rounded-card border border-border bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border bg-white px-7 py-4">
          <div className="flex items-center gap-3">
            <AssistantBadge />
            <div>
              
<p className="text-sm font-bold text-ink">
  {humanMode ? "Alex · Human Support Agent" : "Cheer Assistant"}
</p>

<p className="flex items-center gap-1.5 text-xs text-success">
  <span className="size-1.5 rounded-full bg-success" />
  {humanMode ? "Human agent connected" : "Ready to help"}
</p>

            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Icon name="message" size={14} />
            Remembers this conversation
          </span>
        </div>

        <div
          aria-live="polite"
          className="conversation-canvas max-h-conversation min-h-chat overflow-y-auto px-10 py-10"
        >
          <div className="space-y-9">
            {messages.map((message) =>
              message.role === "user" ? (
                <div className="ml-auto max-w-message" key={message.id}>
                  <p className="mb-2 text-right text-xs font-semibold text-ink-faint">
                    You
                  </p>
                  <div className="rounded-message-user bg-brand px-5 py-4 text-message leading-6 text-white shadow-message">
                    <MessageContent content={message.content} />
                  </div>
                </div>
              ) : (
                <div
                  className="flex max-w-assistant items-start gap-3"
                  key={message.id}
                >
                  <AssistantBadge />
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-xs font-semibold text-ink-faint">
                      Cheer Assistant
                    </p>
                    <div className="rounded-message-assistant border border-border bg-white px-5 py-4 text-message leading-6 text-ink shadow-card-subtle">
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex max-w-assistant items-start gap-3">
                <AssistantBadge loading />
                <div>
                  <p className="mb-2 text-xs font-semibold text-ink-faint">
                     {humanMode ? "Alex · Support Agent" : "Cheer Assistant"}
                  </p>
                  <div className="inline-flex items-center gap-3 rounded-message-assistant border border-border bg-white px-5 py-4 text-sm text-ink-muted shadow-card-subtle">
                    <span className="typing-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    Thinking about your question…
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className="rounded-xl border border-danger-border bg-danger-pale p-4"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-danger">
                    <Icon name="warning" size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-danger">
                      The assistant could not respond
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {error}
                    </p>
                  </div>
                  <Button icon="refresh" onClick={onRetry} variant="secondary">
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {canShowFeedback && (
              <div className="ml-12 rounded-xl border border-border bg-white p-4 shadow-card-subtle">
                {feedback === "resolved" ? (
                  <div className="flex items-center gap-3 text-sm font-semibold text-success">
                    <span className="grid size-8 place-items-center rounded-full bg-success-pale">
                      <Icon name="check" size={16} />
                    </span>
                    Thanks for letting us know. We’re glad you found a path
                    forward.
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-ink">
                        Did this resolve your issue?
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        Your answer helps guide the next step.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        icon="check"
                        onClick={onResolved}
                        variant="secondary"
                      >
                        Yes, resolved
                      </Button>
                      <Button
                        disabled={feedback === "unresolved"}
                        onClick={onUnresolved}
                        variant="secondary"
                      >
                        No, try something else
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form className="border-t border-border bg-white p-5" onSubmit={submit}>
          <label className="sr-only" htmlFor="chat-message">
            Type your message
          </label>
          <div className="flex items-end gap-3 rounded-xl border border-border-strong bg-surface p-2 transition-colors focus-within:border-brand-soft focus-within:bg-white focus-within:ring-4 focus-within:ring-focus">
            <textarea
              className="min-h-14 max-h-input flex-1 resize-none border-0 bg-transparent px-3 py-3 text-sm leading-6 text-ink outline-none placeholder:text-ink-faint"
              disabled={loading}
              id="chat-message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question or add more detail…"
              ref={inputRef}
              rows={1}
              value={draft}
            />
            <Button
              className="min-w-24"
              disabled={!draft.trim() || loading}
              icon="send"
              type="submit"
            >
              Send
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-xs text-ink-faint">
              Enter to send · Shift + Enter for a new line
            </span>
            <TextButton icon="headset" onClick={onEscalate}>
              Contact support
            </TextButton>
          </div>
        </form>
      </section>
    </div>
  )
}

function Escalation({
  messages,
  onReturn,
}: {
  messages: Message[]
  onReturn: () => void
}) {
  const [contacted, setContacted] = useState(false)
  const firstQuestion =
    messages.find((message) => message.role === "user")?.content ||
    "I would like help with Cheer."
  const conversationCount = messages.filter(
    (message) => message.role === "user",
  ).length

  return (
    <div className="mx-auto max-w-content px-8 py-12">
      <div className="grid grid-cols-escalation gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-eyebrow text-brand">
            Human support
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Let’s get you the right help
          </h1>
          <p className="mt-4 max-w-copy text-base leading-7 text-ink-muted">
            We’ve organized the conversation so you can review what happened
            before choosing how to contact support.
          </p>

          <div className="mt-8 overflow-hidden rounded-card border border-border bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-border bg-surface px-7 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-pale text-brand">
                  <Icon name="message" size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">
                    Conversation summary
                  </p>
                  <p className="text-xs text-ink-faint">
                    Ready for your review
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-brand-pale px-3 py-1 text-xs font-bold text-brand">
                {conversationCount} user{" "}
                {conversationCount === 1 ? "message" : "messages"}
              </span>
            </div>
            <div className="p-7">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-ink-faint">
                Original question
              </p>
              <p className="mt-3 text-base font-semibold leading-7 text-ink">
                {firstQuestion}
              </p>
              <div className="my-6 h-px bg-border" />
              <p className="text-xs font-bold uppercase tracking-eyebrow text-ink-faint">
                What will be shared
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                The messages in this conversation can be included so a support
                agent has context. Review them first and do not include
                passwords or other sensitive information.
              </p>
            </div>
          </div>
        </div>

        <aside className="self-start overflow-hidden rounded-card border border-border bg-white shadow-card">
          <div className="bg-article px-7 py-6 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-white/15">
              <Icon name="headset" size={21} />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-eyebrow text-white/60">
              Next step
            </p>
            <p className="mt-1 text-lg font-bold">Connect with support</p>
          </div>
          <div className="p-7">
            {!contacted ? (
              <>
                <h2 className="text-xl font-bold tracking-tight">
                  Continue with a person
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Open the contact options, then review and confirm your request
                  through an available support channel.
                </p>
                <div className="my-6 rounded-xl bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Icon name="clock" size={17} />
                    Nothing has been submitted
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">
                    You will have a chance to review your details before sending
                    a request.
                  </p>
                </div>
                <Button
                  className="w-full"
                  icon="headset"
                  onClick={() => setContacted(true)}
                >
                  Contact a support agent
                </Button>
              </>
            ) : (
              <div className="animate-in">
                <div className="grid size-11 place-items-center rounded-full bg-success-pale text-success">
                  <Icon name="check" size={21} />
                </div>
                <h2 className="mt-5 text-xl font-bold tracking-tight">
                  Choose a contact option
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  In the full product, available chat or email options would
                  appear here. This prototype has not submitted a ticket.
                </p>
                <div className="mt-6 rounded-xl border border-dashed border-border-strong bg-surface px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-ink">
                    Support channels placeholder
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Prototype demonstration only
                  </p>
                </div>
                <Button
                  className="mt-5 w-full"
                  onClick={() => setContacted(false)}
                  variant="secondary"
                >
                  Back
                </Button>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <TextButton icon="arrow-left" onClick={onReturn}>
                Return to conversation
              </TextButton>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const [question, setQuestion] = useState("")
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [homeError, setHomeError] = useState("")
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [humanMode, setHumanMode] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const navigate = (next: Screen) => {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const requestAssistant = async (conversation: Message[]) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError("")
    setFeedback(null)

    try {
      const response = await fetch(SUPPORT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: controller.signal,
      })
      const data = (await response.json().catch(() => ({}))) as {
        message?: string
        error?: string
      }

      if (!response.ok || !data.message) {
        throw new Error(
          data.error ||
            "The support service is temporarily unavailable. Please try again.",
        )
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", data.message!),
      ])
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The support service is temporarily unavailable. Please try again.",
      )
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }

  const startConversation = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      setHomeError("Please tell us a little about what is happening.")
      return
    }

    const conversation = [createMessage("user", trimmed)]
    setMessages(conversation)
    setQuestion("")
    setHomeError("")
    navigate("chat")
    void requestAssistant(conversation)
  }

  const sendMessage = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const conversation = [...messages, createMessage("user", trimmed)]
    setMessages(conversation)
    void requestAssistant(conversation)
  }

  const newConversation = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setQuestion("")
    setDraft("")
    setLoading(false)
    setError("")
    setHomeError("")
    setFeedback(null)
    navigate("home")
  }

  const retry = () => {
    if (messages.at(-1)?.role === "user") {
      void requestAssistant(messages)
    }
  }

  const submitHome = (event: FormEvent) => {
    event.preventDefault()
    startConversation(question)
  }

  const markUnresolved = () => {
    setFeedback("unresolved")
    sendMessage(
      "That did not resolve my issue. Please suggest a different approach or ask me for the information you need.",
    )
  }

  return (
    <Shell
      onEscalate={() => {
  setHumanMode(true)
  setError("")
  setFeedback(null)
  navigate("chat")
  if (!messages.some((m) => m.content === "Hi! I'm Alex, your human support agent. I've received your conversation and I'm here to help."))
  {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hi! I'm Alex, your human support agent. I've received your conversation and I'm here to help.",
      },
    ])
  }
}}
      onHome={() => navigate("home")}
      onNewConversation={newConversation}
      screen={screen}
    >
      {screen === "home" && (
        <Home
          error={homeError}
          onEscalate={() => navigate("escalation")}
          onSubmit={submitHome}
          onSuggestion={startConversation}
          question={question}
          setQuestion={setQuestion}
        />
      )}
      {screen === "chat" && (
        <Chat
          humanMode={humanMode}
          draft={draft}
          error={error}
          feedback={feedback}
          loading={loading}
          messages={messages}
          onEscalate={() => navigate("escalation")}
          onResolved={() => setFeedback("resolved")}
          onRetry={retry}
          onSend={sendMessage}
          onUnresolved={markUnresolved}
          setDraft={setDraft}
        />
      )}
      {screen === "escalation" && (
        <Escalation
          messages={messages}
          onReturn={() => navigate(messages.length ? "chat" : "home")}
        />
      )}
    </Shell>
  )
}
