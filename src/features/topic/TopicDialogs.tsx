import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Schemas } from '@/lib/api/client'
import { STAGES, stageLabel } from '@/lib/stage'
import { cn } from '@/lib/utils'

export type EditTopicValues = {
  title: string
  description: string
  isOptional: boolean
}

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Dê um nome ao tópico')
    .max(160, 'No máximo 160 caracteres'),
  description: z.string().max(2000, 'No máximo 2000 caracteres'),
  isOptional: z.boolean(),
})

/** Editar título, descrição e se o tópico é opcional. */
export function EditTopicDialog({
  open,
  onOpenChange,
  initial,
  saving = false,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: EditTopicValues
  saving?: boolean
  error?: string | null
  onSave: (values: EditTopicValues) => void
}) {
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      onSave({
        ...value,
        title: value.title.trim(),
        description: value.description.trim(),
      }),
  })
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-[540px]">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar tópico</DialogTitle>
            <DialogDescription>
              A etapa muda pelas sessões; aqui você ajusta nome, descrição e se
              é opcional.
            </DialogDescription>
          </DialogHeader>
          <form.Field name="title">
            {(field) => {
              const err = field.state.meta.errors[0]?.message
              return (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="et-title">Título</Label>
                  <Input
                    id="et-title"
                    value={field.state.value}
                    maxLength={160}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? 'et-title-err' : undefined}
                  />
                  {err && (
                    <span id="et-title-err" className="text-sm text-danger">
                      {err}
                    </span>
                  )}
                </div>
              )
            }}
          </form.Field>
          <form.Field name="description">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="et-desc">Descrição (opcional)</Label>
                <Textarea
                  id="et-desc"
                  rows={3}
                  maxLength={2000}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="isOptional">
            {(field) => (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-3 py-2.5">
                <Label
                  htmlFor="et-opt"
                  className="flex flex-col items-start gap-0.5"
                >
                  <span>Tópico opcional</span>
                  <span className="text-xs font-normal text-ink-soft">
                    Não conta no progresso do módulo.
                  </span>
                </Label>
                <Switch
                  id="et-opt"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Voltar a etapa do tópico (ex.: de Concluído para Praticando), com confirmação. */
export function ReopenStageDialog({
  open,
  onOpenChange,
  current,
  saving = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: Schemas['Stage']
  saving?: boolean
  onConfirm: (stage: Schemas['Stage']) => void
}) {
  const earlier = STAGES.slice(0, STAGES.indexOf(current)).reverse()
  const [stage, setStage] = useState<Schemas['Stage'] | null>(null)
  const chosen = stage && earlier.includes(stage) ? stage : (earlier[0] ?? null)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir etapa</AlertDialogTitle>
          <AlertDialogDescription>
            O tópico está em <strong>{stageLabel[current]}</strong>. Para qual
            etapa ele volta? As sessões registradas continuam na linha do tempo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Etapa</legend>
          {earlier.map((s) => (
            <label
              key={s}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5',
                chosen === s ? 'border-ink' : 'border-line',
              )}
            >
              <input
                type="radio"
                name="reopen-stage"
                value={s}
                checked={chosen === s}
                onChange={() => setStage(s)}
                className="accent-ink"
              />
              {stageLabel[s]}
            </label>
          ))}
        </fieldset>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!chosen || saving}
            onClick={() => chosen && onConfirm(chosen)}
          >
            Voltar para {chosen ? stageLabel[chosen] : '…'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
