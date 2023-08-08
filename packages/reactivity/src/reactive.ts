
const enum ReactiveFlags {
  IS_REACTIVE = '__isReactive',
}

export function reactive(target: Record<any, any>) {
  let proxy = new Proxy(target, {
    get(target, key, receiver) {

      if (key === ReactiveFlags.IS_REACTIVE) {
        return true
      }

      const result = Reflect.get(target, key, receiver)
      return result
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      return result
    }
  })
  return proxy
}

export function isReactive(target) {
  return !!target[ReactiveFlags.IS_REACTIVE]
}

export function toRaw(target) {
  return target
}