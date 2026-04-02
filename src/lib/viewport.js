export const PHONE_MAX_WIDTH = 767
export const PAD_MAX_WIDTH = 1180

export function getViewportInfo(width = 0, height = 0) {
  const safeWidth = Number.isFinite(width) ? width : 0
  const safeHeight = Number.isFinite(height) ? height : 0
  const isPhone = safeWidth <= PHONE_MAX_WIDTH
  const isPad = safeWidth > PHONE_MAX_WIDTH && safeWidth <= PAD_MAX_WIDTH
  const isDesktop = safeWidth > PAD_MAX_WIDTH
  const isPortrait = safeHeight >= safeWidth

  return {
    width: safeWidth,
    height: safeHeight,
    isPhone,
    isPad,
    isDesktop,
    isPortrait,
    shouldUseBottomTabs: isPhone,
    shouldStackPanels: isPhone || (isPad && isPortrait),
  }
}
