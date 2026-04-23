import { useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

interface ScrambleTextProps {
  text: string
  className?: string
  delay?: number
  onComplete?: () => void
}

export default function ScrambleText({ text, className = '', delay = 0, onComplete }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState('')
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      let iteration = 0
      const totalIterations = text.length * 3

      const animate = () => {
        let result = ''
        for (let i = 0; i < text.length; i++) {
          if (i < iteration / 3) {
            result += text[i]
          } else if (text[i] === ' ') {
            result += ' '
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)]
          }
        }

        setDisplayText(result)

        if (iteration < totalIterations) {
          iteration += 1
          frameRef.current = requestAnimationFrame(animate)
        } else {
          setDisplayText(text)
          onComplete?.()
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frameRef.current)
    }
  }, [text, delay, onComplete])

  return (
    <span className={className} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {displayText || text.split('').map(() => '\u00A0').join('')}
    </span>
  )
}