import { useCallback, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type EntityTagInputProps = {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  id: string
}

export function EntityTagInput({
  values,
  onChange,
  placeholder,
  id,
}: EntityTagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const addValue = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      const next = [...values]
      if (next.includes(trimmed)) return
      next.push(trimmed)
      onChange(next)
      setInputValue("")
    },
    [values, onChange],
  )

  const removeValue = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index))
      if (editingIndex === index) {
        setEditingIndex(null)
        setEditingValue("")
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1)
      }
    },
    [values, onChange, editingIndex],
  )

  const updateValue = useCallback(
    (index: number, raw: string) => {
      const trimmed = raw.trim()
      const next = [...values]
      if (!trimmed) {
        next.splice(index, 1)
      } else if (next[index] !== trimmed) {
        next[index] = trimmed
      }
      onChange(next)
      setEditingIndex(null)
      setEditingValue("")
    },
    [values, onChange],
  )

  const startEditing = useCallback(
    (index: number) => {
      setEditingIndex(index)
      setEditingValue(values[index] ?? "")
      setTimeout(() => editInputRef.current?.focus(), 0)
    },
    [values],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addValue(inputValue)
      } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
        removeValue(values.length - 1)
      }
    },
    [inputValue, addValue, removeValue, values.length],
  )

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault()
        updateValue(index, editingValue)
      } else if (e.key === "Escape") {
        setEditingIndex(null)
        setEditingValue("")
        editInputRef.current?.blur()
      }
    },
    [editingValue, updateValue],
  )

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) addValue(inputValue)
  }, [inputValue, addValue])

  const handleEditBlur = useCallback(
    (index: number) => {
      updateValue(index, editingValue)
    },
    [editingValue, updateValue],
  )

  return (
    <div
      onClick={() => editingIndex === null && inputRef.current?.focus()}
      className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
    >
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="contents">
          {editingIndex === index ? (
            <Input
              ref={editInputRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, index)}
              onBlur={() => handleEditBlur(index)}
              onClick={(e) => e.stopPropagation()}
              className="h-8 min-w-[60px] max-w-[200px] shrink-0 px-2 py-1 text-sm"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation()
                startEditing(index)
              }}
              className="inline-flex cursor-text items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-muted/80"
            >
              {value}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 rounded p-0 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  removeValue(index)
                }}
                aria-label={`Remove ${value}`}
              >
                <X className="size-3" />
              </Button>
            </span>
          )}
        </span>
      ))}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={values.length === 0 ? placeholder : "Add..."}
        className="h-8 min-w-[80px] flex-1 shrink-0 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}

