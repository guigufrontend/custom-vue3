
// Reflect 封装了13个操作对象方法， 是更加健壮的方式
// 1. defineProperty 2. getPrototypeOf 3. setPrototypeOf 4. getOwnPropertyDescriptor
// 5. isExtensible 6. preventExtensions 7. apply 8. ownKeys
// 9. has 替换 in 操作符 10. deleteProperty 替换delete操作符 11. construct替换new
// 12. get 13. set
function isObject(v){
    return typeof v ==='object'&&v!==null
}
function reactive(obj){
    if(!isObject(obj)){
        return obj
    }
    return new Proxy(obj,{
        get(target, key){
            console.log('get', key)
            const res = Reflect.get(target, key)
            // 依赖收集
            track(target, key)
            return isObject(res)? reactive(res): res
        },
        set(target, key, value){
            console.log('set', key)
            const res = Reflect.set(target, key, value)
            triger(target, key)
            return res
        },
        deleteProperty(target, key){
            console.log('delete', key)
            const res = Reflect.deleteProperty(target, key)
            triger(target, key)
            return res
        },
    })
}
const effectStack = []
// 创建响应式数据和副作用函数之间的依赖关系
function effect(fn){
    const eff = function(){
        try{
            effectStack.push(eff)
            fn()
        }finally{
            effectStack.pop()
        }
    } 
    eff()
    return eff
}
const targetMap = new WeakMap()
//依赖收集
function track(target, key){
    const eff = effectStack[effectStack.length-1]
    if(eff){
        let depMap = targetMap.get(target)
        if(!depMap){
            depMap = new Map()
            targetMap.set(target, depMap)
        }
        let deps = depMap.get(key)
        if(!deps){
            deps = new Set()
            depMap.set(key, deps)
        }
        deps.add(eff)
    }
}
//依赖触发
function triger(target, key){
    const depMap = targetMap.get(target)
    if(depMap){
        const deps = depMap.get(key)
        if(deps){
            deps.forEach(dep=>dep())
        }
    }
}
// const state = reactive({a:1, child:{ key :1}})
// state.a
// state.a=2
// state.b=3
// state.child.key
// delete state.a
// const arr = reactive([1,2,3])
// arr[2]
// arr[4] = 5
const state = reactive({foo:111})
effect(()=>{
    console.log(state.foo)
})
state.foo=2222