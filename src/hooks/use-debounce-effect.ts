import { useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export function useDebounceEffect(
  effect: () => void,
  dependencies: unknown[],
  delay: number
) {
  const debouncedEffect = useDebouncedCallback(effect, delay)

  useEffect(() => {
    debouncedEffect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, debouncedEffect])
}
