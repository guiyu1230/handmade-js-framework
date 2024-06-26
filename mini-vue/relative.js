const isObject = val => val !== null && typeof val === 'object';

const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

// activeEffect表示当前正在走的effect;
let activeEffect = null;
export function effect(callback) {
    activeEffect = callback;
    callback();
    activeEffect = null;
}

export function reactive(target) {
        
    if(!isObject(target)) return target;

    const handler = {
        get(target, key, receiver) {
            console.log(`获取对象属性${key}值`)

            track(target, key)
            const result = Reflect.get(target, key, receiver);
            // 递归判断的关键 如果发现子元素存在引用类型, 递归处理
            if(isObject(result)) {
                return reactive(result);
            }
            return result;
        },
        set(target, key, value, receiver) {
            console.log(`设置对象属性${key}值`);

            // 首先先获取旧值
            const oldValue = Reflect.get(target, key, receiver);
            // set需要返回boolean值
            let result = true;
            // 判断新值和旧值是否一样来决定更新setter
            if(oldValue !== value) {
                result = Reflect.set(target, key, value, receiver);
                trigger(target, key);
            }
            return result;
        },
        deleteProperty(target, key) {
            console.log(`删除对象属性${key}值`)

            // 先判断是否有key
            const hadKey = hasOwn(target, key);
            const result = Reflect.deleteProperty(target, key);

            if(hadKey && result) {
                //更新操作 等下再补
                trigger(target, key)
            }

            return result;
        }
    }
    return new Proxy(target, handler);
}

// targetMap表里每个key都是一个普通对象 对应他们的depsMap
let targetMap = new WeakMap();
// 收集跟踪
export function track(target, key) {
    // 如果当前没有effect就不执行追踪
    if(!activeEffect) return;
    // 获取当前对象的依赖图
    let depsMap = targetMap.get(target);
    //不存在就新建
    if(!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }

    // 根据key从依赖图里获取effect集合
    let dep = depsMap.get(key)
    //不存在就新建
    if(!dep) {
        depsMap.set(key, (dep = new Set()))
    }

    // 如果当前effect不存在, 才注册到dep里
    if(!dep.has(activeEffect)) {
        dep.add(activeEffect);
    }
}

//  trigger响应式触发
export function trigger(target, key) {
    //拿到依赖图
    const depsMap = targetMap.get(target);

    if(!depsMap) return;

    //拿到了视图渲染effect就可以进行排队更新effect
    const dep = depsMap.get(key);

    dep && dep.forEach(effect  => {
        effect();
    });
}

// 判断是否是一个对象,是就用reactive来代理
const convert = val => (isObject(val)) ? reactive(val) : val;

class RefImpl {
    constructor(_rawValue) {
        this._rawValue = _rawValue;
        this.__v_isRef = true;
        // 判断_rawValue是否是一个对象
        // 如果是对象调用reactive使用 proxy代理
        // 不是返回 _rawValue 本身
        this._value = convert(_rawValue);
    }
    // 使用get/set 存取器, 来进行追踪和触发
    get value() {
        // 追踪依赖
        track(this, 'value');
        // 当然get 得返回 this._value
        return this._value;
    }
    set value(newValue) {
        // 判断旧值和新值是否一样
        if(newValue !== this._value) {
            this._rawValue = newValue;
            // 设置新值的时候也得使用convert处理一下,判断新值是否是对象
            this._value = convert(this._rawValue);
            // 触发依赖
            trigger(this, 'value');
        }
    }
}

export function ref(rawValue) {
    // __v_isRef 用来表示是否是一个ref 如果是直接返回, 不用再转
    if(isObject(rawValue) && rawValue.__v_isRef) return;

    return new RefImpl(rawValue);
}

class ObjectRefImpl {
    constructor(proxy, _key) {
        this._proxy = proxy;
        this._key = _key;
        // __v_isRef 用来标识是否是 一个ref
        this.__v_isRef = true;
    }
    get value() {
        // 这里不用收集依赖
        // this._proxy 就是响应式对象, 当访问[this._key]时, this._proxy里面会自动收集依赖
        return this._proxy[this._key];
    }
    set value(newValue) {
        // 这里不用收集依赖
        // this._proxy 响应式对象, 会在this._proxy里面set去调用trigger
        this._proxy[this._key] = newValue;
    }
}

// 暴露出去的方法
export function toRef(proxy, key) {
    return new ObjectRefImpl(proxy, key);
}

export function toRefs(proxy) {
    // 判断 当前 proxy 是 proxy 数组, 还是 proxy对象
    const ret = proxy instanceof Array ? new Array(proxy.length) : {};

    for(const key in proxy) {
        // 内部还是调用 toRef 进行转为 响应式
        ret[key] = toRef(proxy, key)
    }

    return ret;
}
