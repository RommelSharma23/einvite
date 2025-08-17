'use client'

export default function GlobalError({ reset }: { error: Error, reset: () => void }) {
  return (
    <html>
      <body>
        <h2>Error</h2>
        <button onClick={reset}>Retry</button>
      </body>
    </html>
  )
}