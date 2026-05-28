export const haptics = {
  tap: () => navigator.vibrate?.(10),
  success: () => navigator.vibrate?.([10, 50, 10]),
  heavy: () => navigator.vibrate?.(50),
  error: () => navigator.vibrate?.([50, 30, 50]),
}
