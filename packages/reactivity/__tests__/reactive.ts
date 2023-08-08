import { reactive, isReactive, toRaw } from "../src/reactive";
describe("reactive", () => {
  test("simple reactive", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    // 1. 他们不是同一个对象
    expect(observed).not.toBe(original);
    // 2. observed是一个响应式对象
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    // 3. 值可以正常拿到
    expect(observed.foo).toBe(1);
    // 4. 有这个KEY
    expect("foo" in observed).toBe(true);
    // 5. 能够通过Object.keys取到值
    expect(Object.keys(observed)).toEqual(["foo"]);
  });

  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });

  // test("toRaw", () => {
  //   const original = { foo: 1 };
  //   const observed = reactive(original);
  //   expect(toRaw(observed)).toBe(original);
  //   expect(toRaw(original)).toBe(original);
  // });
});
