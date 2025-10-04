// Custom hook for scroll-based animations using Intersection Observer
'use client'

import { useEffect, useRef, useState } from 'react'

export interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  delay?: number
  duration?: number
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    delay = 0,
    duration = 1000
  } = options

  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, delay, isVisible])

  return {
    ref: elementRef,
    isVisible,
    style: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.5)',
      transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`
    }
  }
}

export function useIconAnimation(options: ScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    delay = 0,
    duration = 1000
  } = options

  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, delay, isVisible])

  return {
    ref: elementRef,
    isVisible,
    style: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(45deg)',
      transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`
    }
  }
}
