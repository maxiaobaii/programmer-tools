export function createEditorResetState(value = '') {
  return {
    value,
    revision: 0,
  }
}

export function resetEditorWithValue(state, nextValue) {
  return {
    value: nextValue,
    revision: (state?.revision ?? 0) + 1,
  }
}
