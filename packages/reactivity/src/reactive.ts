import { track } from "./effect";
import { isObject } from "../../shared/src/index";

const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = "__v_isReadonly",
  RAW = "__v_raw",
}

const reactiveMap = new WeakMap()

export function reactive(target: Record<any, any>) {
  return createReactiveObject(target, reactiveMap, {
    get(target, key: string, receiver) {
      // 如果访问的是它的reactive FLAG, 那么就返回true, 标识是响应式对象
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true
      }
      // 如果访问的是它的RAW FLAG, 并且receiver和map中的target全等, 那么就直接返回原数据target
      if (key === ReactiveFlags.RAW && receiver === reactiveMap.get(target)) {
        return target
      } else if (isObject(target[key])) {
        return reactive(target[key])
      }

      const result = Reflect.get(target, key, receiver)

      // 依赖收集
      track(target, key)

      return result
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      return result
    }
  })
}

export function isReactive(target) {
  return !!target[ReactiveFlags.IS_REACTIVE]
}

/**
 * 把一个响应式对象转换成原始对象
 * 1. 如果不存在rawFlag, 说明是普通对象, 直接返回值
 * 2. 如果存在raw, 是响应式对象, 则走getter返回
 * @param target 
 * @returns 
 */
export function toRaw(target) {
  if (!target[ReactiveFlags.RAW]) {
    return target;
  }

  return target[ReactiveFlags.RAW];
}

/**
 * 创建响应式对象
 * 1. 如果在MAP中命中, 则直接返回存在的响应对象
 * 2. 如果没有命中, 则创建一个proxy对象, 并且存入MAP中
 * @param target 
 * @param proxyMap 
 * @param baseHandlers 
 * @returns 
 */
function createReactiveObject(target, proxyMap, baseHandlers) {
  // 核心就是 proxy
  // 目的是可以侦听到用户 get 或者 set 的动作

  // 如果命中的话就直接返回就好了
  // 使用缓存做的优化点
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  // 把创建好的 proxy 给存起来，
  proxyMap.set(target, proxy);
  return proxy;
}