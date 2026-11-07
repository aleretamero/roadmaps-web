import { Check, OctagonX } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

/**
 * Toasts do produto: pílula escura embaixo, no centro, como no protótipo.
 * Para confirmações curtas use `toast.success('Sessão registrada')` do `sonner`.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={28}
      mobileOffset={16}
      duration={2400}
      icons={{
        success: (
          <Check className="size-3.5 text-toast-icon" strokeWidth={2.5} />
        ),
        error: <OctagonX className="size-4 text-toast-icon" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-max max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-xl bg-toast px-[18px] py-3 text-toast-fg shadow-dialog mx-auto left-0 right-0',
          title: 'text-sm font-medium',
          description: 'text-sm opacity-80',
        },
      }}
    />
  )
}
