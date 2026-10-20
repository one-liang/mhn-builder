/** One app-wide toast (rendered by AppToast in the layout), optionally with an undo. */
export interface Toast {
  id: number
  message: string
  undo?: () => void
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

  function show(message: string, undo?: () => void) {
    toast.value = { id: ++nextId, message, undo }
    if (timer) clearTimeout(timer)
    timer = setTimeout(dismiss, undo ? 5000 : 2400)
  }

  return { toast, show, dismiss }
}
