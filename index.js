const targetMap = new Map();

function track(obj, prop, effect) {
  const depMap = targetMap.get(obj) || new Map();
  const deps = depMap.get(prop) || new Set();

  depMap.set(prop, deps.add(effect));
  targetMap.set(obj, depMap);
}

function trigger(obj, prop) {
  const depMap = targetMap.get(obj);
  if (!depMap) return;

  const deps = depMap.get(prop);
  if (deps?.size) {
    for (const effect of deps) {
      effect();
    }
  }
}

let activeEffect = null;
function watchEffect(cb) {
  activeEffect = cb;
  cb();
  activeEffect = null;
}

function reactive(obj) {
  const proxiedObj = new Proxy(obj, {
    get(target, prop, reciever) {
      if (activeEffect) {
        if (typeof target[prop] === "object") {
          target[prop] = reactive(obj[prop]);
        }
        track(target, prop, activeEffect);
      }
      return Reflect.get(...arguments);
    },
    set(target, prop, newVal, reciever) {
      const res = Reflect.set(...arguments);
      if (res) {
        trigger(target, prop);
      }
      return res;
    },
  });
  return proxiedObj;
}

(function runTest() {
  const reactiveObj1 = reactive({ a: 1, b: 2 });
  let reactiveObj2 = reactive({ c: { d: 5, e: 6 } });

  let target1;
  function test1() {
    console.log('test1')
    target1 = reactiveObj1.a + 1;
  }

  let target2;
  function test2() {
    console.log('test2')
    target2 = reactiveObj1.a + reactiveObj2.c.e;
  }

  watchEffect(test1);
  watchEffect(test2);

  console.log(target1); // 2
  console.log(target2); // 7
  reactiveObj1.a = 2;
  console.log(target1); // 3
  console.log(target2); // 8

  reactiveObj2.c.e = 7;
  console.log(target1); // 3
  console.log(target2); // 9
  reactiveObj1.a = 3;
  console.log(target1); // 4
  console.log(target2); // 10
})();
