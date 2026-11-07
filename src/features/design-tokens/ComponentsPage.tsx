import { MoreHorizontal, Pause, Play, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { IconButton } from '@/components/IconButton'
import { InfoTooltip } from '@/components/InfoTooltip'
import { StageChip } from '@/components/StageChip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STAGES } from '@/lib/stage'

export function ComponentsPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Componentes base</h1>

      <section className="flex flex-wrap items-center gap-3">
        <Button>
          <Plus /> Adicionar tópicos
        </Button>
        <Button variant="outline">Editar módulo</Button>
        <Button variant="ghost">Cancelar</Button>
        <Button variant="destructive">Apagar</Button>
        <IconButton label="Iniciar" variant="outline" round>
          <Play />
        </IconButton>
        <IconButton label="Pausar" variant="outline" round>
          <Pause />
        </IconButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="Ações de Índices">
              <MoreHorizontal />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Registrar sessão</DropdownMenuItem>
            <DropdownMenuItem>Editar tópico</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <InfoTooltip label="Atalhos do editor">
          Use # para título, - para lista e Ctrl+Enter para publicar.
        </InfoTooltip>
      </section>

      <section className="flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <StageChip key={s} stage={s} />
        ))}
        <Badge variant="outline">Opcional</Badge>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Formulário</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Ex.: Verbos no passado" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="opt" />
            <Label htmlFor="opt">Opcional</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="rem" />
            <Label htmlFor="rem">Lembrete diário</Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">Tópicos</TabsTrigger>
          <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
        </TabsList>
        <TabsContent value="topics">Lista de tópicos</TabsContent>
        <TabsContent value="timeline">Linha do tempo</TabsContent>
        <TabsContent value="notes">Anotações</TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar sessão</DialogTitle>
              <DialogDescription>Verbos no passado</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => toast('Sessão registrada')}>
          Mostrar toast
        </Button>
      </div>
    </main>
  )
}
