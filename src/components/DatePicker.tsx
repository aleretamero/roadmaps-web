import { CalendarDays, X } from 'lucide-react'
import { useState } from 'react'
import { ptBR } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatShort, parseISODate, toISODate } from '@/lib/date'
import { cn } from '@/lib/utils'

export type DatePickerProps = {
  /** yyyy-mm-dd ou vazio. */
  value: string
  onChange: (value: string) => void
  /** Nome acessível do botão (ex.: "Data prevista de Tópico 1"). */
  label: string
  placeholder?: string
  /** Discreto quando vazio (aparece forte ao passar o mouse/focar). */
  quiet?: boolean
  className?: string
  /** Último dia que dá para escolher (yyyy-mm-dd). */
  max?: string
  /** Alinhamento do calendário em relação ao botão. */
  align?: 'start' | 'end'
  /** Classes extras do botão. */
  buttonClassName?: string
}

/** Escolher uma data de calendário (Popover + Calendar do shadcn, em pt-BR). */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Data',
  quiet = false,
  className,
  max,
  align = 'end',
  buttonClassName,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISODate(value) : undefined
  return (
    <div className={cn('inline-flex items-center', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={value ? `${label}: ${formatShort(value)}` : label}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs whitespace-nowrap',
              value
                ? 'border-line-strong text-ink'
                : 'border-transparent text-ink-soft hover:border-line',
              quiet && !value && 'opacity-100',
              buttonClassName,
            )}
          >
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {value ? formatShort(value) : placeholder}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selected}
            defaultMonth={selected}
            disabled={max ? { after: parseISODate(max) } : undefined}
            onSelect={(d) => {
              onChange(d ? toISODate(d) : '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          aria-label={`Limpar ${label}`}
          onClick={() => onChange('')}
          className="grid size-6 place-items-center rounded text-ink-soft hover:text-ink"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
