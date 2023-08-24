import { createDep } from './dep'

// 目标对象容器
const targetMap = new WeakMap()
// 当前正在收集依赖的ReactiveEffect实例
// 因为JS是单线程, 所以能保证这个变量的唯一性
let activeEffect: any = null

class ReactiveEffect {
  private active = true
  private fn: Function
  /* 
    deps 在 ReactiveEffect 类中的作用是用于存储 effect 所依赖的响应式依赖项，
    并在相关的依赖项发生变化时重新运行 effect。
    这样能够实现 Vue 3 的响应式机制，确保只重新运行与数据变化相关的 effect，提高性能和效率。
  */
  private deps: Array<any> = []
  public onStop?: () => void

  constructor(fn) {
    this.fn = fn
  }
  run() {
    // 把this赋值给全局变量activeEffect
    activeEffect = this
    console.log('run', activeEffect)
    // 执行用户传入的fn
    const result = this.fn()
    // run之后进行一系列重置操作
    resetEffect()

    return result
  }
  stop() {
    if (this.active) {
      // 如果第一次执行 stop 后 active 就 false 了
      // 这是为了防止重复的调用，执行 stop 逻辑
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
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
  // 这里很重要! 如果当前有正在收集的依赖, activeEffect不为null, 则不要收集依赖, 否则会造成依赖冗余
  if (!isTracking()) {
    return
  }
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

}

/**
 * 收集依赖到对应dep中
 * @param dep 
 */ 
export function trackEffects(dep) {
  // console.log('trackEffects', dep)
  // 已经收集的话，那么就不需要在收集一次了
  console.log('trackEffects-1', dep.has(activeEffect))
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect) // 把ReacitveEffect实例收集到dep中
    activeEffect.deps.push(dep) // 把dep收集到activeEffect中的deps里
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
  console.log('triggerEffects', dep)
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

/**
 * 对外停止响应式调用方法
 * @param effect 
 */
export function stop(runner) {
  runner.effect.stop();
}

export function isTracking() {
  return !!activeEffect
}

/**
 * 清除effect
 * @param effect 
 */
function cleanupEffect(effect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里面把 effect 给删除掉
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  effect.deps.length = 0;
}