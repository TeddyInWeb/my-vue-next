import { createDep } from './dep'

// 目标对象容器
const targetMap = new WeakMap()
// 当前正在收集依赖的ReactiveEffect实例
// 因为JS是单线程, 所以能保证这个变量的唯一性
let activeEffect = null

class ReactiveEffect {
  private _fn: Function
  constructor(fn) {
    this._fn = fn
  }
  run() {
    this._fn()
  }
}

export function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

/**
 * 依赖收集
 * @param target 
 * @param key
 * 1. 
 */
export function track(target, key) {
  // 获取目标对象的容器
  let depsMap = targetMap.get(target)
  // 如果不存在目标对象容器, 则初始化
  if (!depsMap) {
    // 初始化依赖容器
    depsMap = new WeakMap()
    targetMap.set(target, depsMap)
  }
  console.log('track', target, key)
  // 获取到对应的依赖, 也就是用户传进来的fn
  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep()
    depsMap.set(key, dep)
  }

  trackEffects(dep)

  console.log('track-1', targetMap)
  console.log('track-2', dep)
}

/**
 * 收集依赖到对应dep中
 * @param dep 
 */
export function trackEffects(dep) {
  // 已经收集的话，那么就不需要在收集一次了
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect) // 把ReacitveEffect实例收集到dep中
  }
}

/**
 * 触发依赖
 * @param target 
 * @param type 
 * @param key 
 */
export function trigger(target, type, key) {

}