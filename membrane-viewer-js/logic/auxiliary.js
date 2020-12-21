
export function pad(num, level) {
   return ("0".repeat(level) + num).slice(-level)
}
