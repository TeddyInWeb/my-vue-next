import { reactive } from "../src/reactive"
import { effect } from "../src/effect"

describe("effect", () => {
  it("should call only once", () => {
    const fnSpy = jest.fn(() => {})
    effect(fnSpy)
    // 1. 回调函数只能被执行一次
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })

  it("basic effect", () => {
    let dummy
    const counter = reactive({ count: 0 })
    effect(() => (dummy = counter.count + 1))

    expect(dummy).toBe(1)
    counter.count = 7
    expect(dummy).toBe(8)
  })

  it("mutiple effect", () => {
    let dummy
    const counter = reactive({ num1: 0, num2: 0, num3: 0 })
    effect(() => (dummy = counter.num1 + counter.num2 + counter.num3))

    expect(dummy).toBe(0)
    counter.num1 = 3
    counter.num2 = 4
    counter.num3 = 5
    expect(dummy).toBe(12)
  })

  it("one to many", () => {
    let a, b
    const counter = reactive({ num: 0 })
    effect(() => (a = counter.num))
    effect(() => (b = counter.num + 1))

    expect(a).toBe(0)
    expect(b).toBe(1)
    counter.num = 1
    expect(a).toBe(1)
    expect(b).toBe(2)
    counter.num++
    expect(a).toBe(2)
    expect(b).toBe(3)
  })

  it("deep effect", () => {
    let a
    const counter = reactive({ nested: { num: 0, total: 1 } })
    effect(() => (a = counter.nested.num + counter.nested.total))

    expect(a).toBe(1)
    counter.nested.num = 8
    counter.nested.total = 10
    expect(a).toBe(18)
  })

  it("function effect", () => {
    let a
    const counter = reactive({ num: 0, total: 1 })
    effect(() => (a = getNum()))

    function getNum() {
      return counter.num + counter.total
    }

    expect(a).toBe(1)
    counter.num = 2
    counter.total = 3
    expect(a).toBe(5)
  })
})
