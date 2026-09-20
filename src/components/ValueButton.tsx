import type { ButtonHTMLAttributes } from 'react'

interface Props<T> extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'value' | 'type'
> {
  /** What the button stands for; it is handed back to `onPick` when the button is pressed. */
  value: T
  onPick: (value: T) => void
}

/** A button that reports its own value, so a list of them needs no inline handler per item. */
export function ValueButton<T>({ value, onPick, ...rest }: Props<T>) {
  function pick() {
    onPick(value)
  }
  return <button type="button" onClick={pick} {...rest} />
}
