import { reactive } from "../src/reactive";
import { effect } from "../src/effect";

describe("effect", () => {
  it("should call only once", () => {
    const fnSpy = jest.fn(() => {});
    effect(fnSpy);
    // 1. 回调函数只能被执行一次
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("basic effect", () => {
    let dummy;
    const counter = reactive({ count: 0 });
    effect(() => (dummy = counter.count + 1));

    expect(dummy).toBe(1);
    counter.count = 7;
    expect(dummy).toBe(8);
  });

  // it("能监听多个属性的变化", () => {
  //   let dummy;
  //   const counter = reactive({ num1: 0, num2: 0 });
  //   effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));

  //   expect(dummy).toBe(0);
  //   counter.num1 = counter.num2 = 7;
  //   expect(dummy).toBe(21);
  // });
  // it("支持多对一", () => {
  //   let dummy1, dummy2;
  //   const counter = reactive({ num: 0 });
  //   effect(() => (dummy1 = counter.num));
  //   effect(() => (dummy2 = counter.num));

  //   expect(dummy1).toBe(0);
  //   expect(dummy2).toBe(0);
  //   counter.num++;
  //   expect(dummy1).toBe(1);
  //   expect(dummy2).toBe(1);
  // });

  // it("支持深度监听", () => {
  //   let dummy;
  //   const counter = reactive({ nested: { num: 0 } });
  //   effect(() => (dummy = counter.nested.num));

  //   expect(dummy).toBe(0);
  //   counter.nested.num = 8;
  //   expect(dummy).toBe(8);
  // });

  // it("支持函数内变量的监听", () => {
  //   let dummy;
  //   const counter = reactive({ num: 0 });
  //   effect(() => (dummy = getNum()));

  //   function getNum() {
  //     return counter.num;
  //   }

  //   expect(dummy).toBe(0);
  //   counter.num = 2;
  //   expect(dummy).toBe(2);
  // });
});
