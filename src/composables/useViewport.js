import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getViewportInfo } from '../lib/viewport.js'

export function useViewport() {
  const width = ref(typeof window === 'undefined' ? 0 : window.innerWidth)
  const height = ref(typeof window === 'undefined' ? 0 : window.innerHeight)

  function updateViewport() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    updateViewport()
    window.addEventListener('resize', updateViewport, { passive: true })
    window.addEventListener('orientationchange', updateViewport, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateViewport)
    window.removeEventListener('orientationchange', updateViewport)
  })

  const viewport = computed(() => getViewportInfo(width.value, height.value))

  return {
    width,
    height,
    viewport,
    isPhone: computed(() => viewport.value.isPhone),
    isPad: computed(() => viewport.value.isPad),
    isDesktop: computed(() => viewport.value.isDesktop),
    isPortrait: computed(() => viewport.value.isPortrait),
    shouldUseBottomTabs: computed(() => viewport.value.shouldUseBottomTabs),
    shouldStackPanels: computed(() => viewport.value.shouldStackPanels),
  }
}
