'use client'

export default function GlobalError({ reset }: { error: Error, reset: () => void }) {
  return (
    <html>
      <body>
        <h2>Error occurred</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}