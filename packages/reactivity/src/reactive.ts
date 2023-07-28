export function reactive(target) {
  let proxy = new Proxy(target, {})
  return target
}

export function isReactive(target) {
  return true
}

export function toRaw(target) {
  return target
}