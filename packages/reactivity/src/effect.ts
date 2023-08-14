import { createDep } from './dep'

// 目标对象容器
const targetMap = new WeakMap()
// 当前正在收集依赖的ReactiveEffect实例
// 因为JS是单线程, 所以能保证这个变量的唯一性
let activeEffect: any = null

class ReactiveEffect {
  private _fn: Function
  constructor(fn) {
    this._fn = fn
  }
  run() {
    // 把this赋值给全局变量activeEffect
    activeEffect = this
    // 执行用户传入的fn
    this._fn()
    // run之后进行一系列重置操作
    resetEffect()
  }
}

/**
 * effect函数
 * 1. 创建ReactiveEffect实例
 * 2. 执行run方法
 * @param fn 
 * @param options 
 */
export function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

/**
 * 依赖收集
 * 这里有三个关键概念: 目标对象容器depsMap, 依赖容器dep, 以及当前正在收集的依赖activeEffect
 * 首先要理解一个关系链: 要建立订阅发布, 首先需要一个key, value键值对, key是目标对象本身, value是依赖容器, 这个kv对象就是depsMap.
 * 而目标对象的每个属性(key)都可能存在多个依赖, 所以需要一个容器来存放依赖, 这个容器就是dep.
 * 为什么需要这个depsMap? 因为一个目标对象可以存在多个依赖容器. 比如{ a: 1, b: 2 }, 目标对象有多个key, a和b, 但是a和b的依赖容器是不一样的.
 * 举个例子: 
 * let xa1, xa2, xb
 * let target = reactive({ a: 1, b: 2 })
 * effect(() => { xa1 = target.a + 1 })
 * effect(() => { xa2 = target.a + 2 })
 * effect(() => { xb = target.b + 2 })
 * 那么对于target.a来说, 它的依赖容器里内容是() => { xa = target.a + 1 }, () => { xa = target.a + 2 }的实例, 即[ReactiveEffect, ReactiveEffect]
 * 当target.a发生变化时, 会通知这两个依赖容器, 依次执行run方法, 从而更新xa1, xa2的值
 * 那么最终depsMap是类似这样的结构(实际是个Map): { [Object]: { a: [ReactiveEffect, ReactiveEffect], b: [ReactiveEffect] } }
 * @param target 
 * @param key
 * 整体就是在形成 depsMap -> key -> dep -> activeEffect 的关系链
 */
export function track(target, key) {
  // 获取目标对象的容器
  let depsMap = targetMap.get(target)
  // 如果不存在目标对象容器, 则初始化
  if (!depsMap) {
    // 初始化依赖容器
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  // 获取到对应的依赖, 也就是用户传进来的fn
  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep()
    depsMap.set(key, dep)
  }

  trackEffects(dep)

  console.log('track-1', ...depsMap)
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
 * 整体思路就是: 找到对应的依赖容器dep, 然后遍历容器, 通过effect.run(), 执行dep中的依赖
 * 从而达到更新响应式对象的目标
 * @param target 
 * @param type 
 * @param key 
 */
export function trigger(target, key) {
  // 根据目标对象target获取对应的depsMap
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  // 根据key获取对应的依赖容器dep
  const dep = depsMap.get(key)
  // 依赖effect有多个, 所以需要一个数组来存放
  // 这里重新用一个新的数据变量来存放dep, 是因为在遍历的过程中, dep可能会发生变化, 会导致遍历出错
  const effects: Array<any> = []
  effects.push(...dep)

  triggerEffects(createDep(effects))
}

/**
 * 触发依赖执行effect.run
 * @param dep 
 */
export function triggerEffects(dep) {
  // 依赖可能有多个
  for (const effect of dep) {
    effect.run()
  }
}

/**
 * 重置effect
 */
export function resetEffect () {
  activeEffect = null
}