import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'

export type EditModuleValues = { title: string; description: string }

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Dê um nome ao módulo')
    .max(120, 'No máximo 120 caracteres'),
  description: z.string().max(500, 'No máximo 500 caracteres'),
})

/** Editar nome e descrição do módulo (TanStack Form + Zod). */
export function EditModuleDialog({
  open,
  onOpenChange,
  initial,
  saving = false,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: EditModuleValues
  saving?: boolean
  error?: string | null
  onSave: (values: EditModuleValues) => void
}) {
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      onSave({
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
      <DialogContent className="sm:max-w-[520px]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Editar módulo</DialogTitle>
            <DialogDescription>
              O nome aparece no mapa, na lista e na busca.
            </DialogDescription>
          </DialogHeader>
          <form.Field name="title">
            {(field) => {
              const err = field.state.meta.errors[0]?.message
              return (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="em-title">Nome</Label>
                  <Input
                    id="em-title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    maxLength={120}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? 'em-title-err' : undefined}
                  />
                  {err && (
                    <span id="em-title-err" className="text-sm text-danger">
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
                <Label htmlFor="em-desc">Descrição (opcional)</Label>
                <Textarea
                  id="em-desc"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  maxLength={500}
                  rows={3}
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
