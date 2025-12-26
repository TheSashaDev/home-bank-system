// Haptic feedback utility for touch interactions
// Uses the Vibration API when available

export const haptics = {
  // Light tap - for button presses, selections
  tap: () => {
    if (navigator.vibrate) navigator.vibrate(10)
  },
  
  // Medium tap - for confirmations, menu selections
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(20)
  },
  
  // Success - for successful operations
  success: () => {
    if (navigator.vibrate) navigator.vibrate(100)
  },
  
  // Error - pattern vibration for errors
  error: () => {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50])
  },
  
  // Warning - double pulse
  warning: () => {
    if (navigator.vibrate) navigator.vibrate([30, 30, 30])
  },
  
  // Custom pattern
  pattern: (pattern: number | number[]) => {
    if (navigator.vibrate) navigator.vibrate(pattern)
  },
}
