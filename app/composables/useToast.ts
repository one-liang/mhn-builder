/** One app-wide toast (rendered by AppToast in the layout), optionally with an undo or another action. */
export interface ToastAction {
  label: string
  run: () => void
  icon?: 'undo' | 'download'
}

export interface Toast {
  id: number
  message: string
  action?: ToastAction
}

let timer: ReturnType<typeof setTimeout> | null = null
let nextId = 0

export function useToast() {
  const toast = useState<Toast | null>('app-toast', () => null)

  function dismiss() {
    toast.value = null
    if (timer) clearTimeout(timer)
    timer = null
  }

  function showAction(message: string, action?: ToastAction) {
    toast.value = { id: ++nextId, message, action }
    if (timer) clearTimeout(timer)
    timer = setTimeout(dismiss, action ? 5000 : 2400)
  }

  /** A message, with 復原 when `undo` is given. */
  function show(message: string, undo?: () => void) {
    showAction(message, undo ? { label: '復原', run: undo, icon: 'undo' } : undefined)
  }

  return { toast, show, showAction, dismiss }
}
