export type SSEEvent = { event: string; data: string }

/**
 * Read a text/event-stream response body and call onEvent for each complete event.
 * Used for POST streams, which EventSource cannot do.
 */
export async function readSSE(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const flush = (block: string) => {
    let event = "message"
    const data: string[] = []
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim()
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""))
    }
    if (data.length) onEvent({ event, data: data.join("\n") })
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n")
    let sep: number
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      flush(buffer.slice(0, sep))
      buffer = buffer.slice(sep + 2)
    }
  }
  buffer += decoder.decode()
  if (buffer.trim()) flush(buffer)
}
