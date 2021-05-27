function reactive(obj){
    return new Proxy(obj,{
        get(target, key){
            console.log('get', key)
            track(target, key)
            return Reflect.get(target, key)
        },
        set(target, key, value){
            console.log('set', key)
            const res = Reflect.set(target, key, value)
            trigger(target, key, value)
            return res
        },
        deleteProperty(target, key){
            console.log('delete', key)
            const res = Reflect.deleteProperty(target, key)
            trigger(target, key, value)
            return res
        }
    })
}
const effectStack = []
function effect(fn){
    effectStack.push(fn)
    fn()
    effectStack.pop()
    return fn
}
// [target:[key:[eff]]]
const targetMap = new WeakMap();
function track(target, key) { 
    const eff = effectStack[effectStack.length-1]
    let depMap = targetMap.get(target)
    if(!depMap){
        depMap = new Map();
        targetMap.set(target, depMap)
    }
    let deps = depMap.get(key)
    if(!deps){
        deps = new Set()
        depMap.set(key, deps)
    }
    deps.add(eff)
 }
 function trigger(target, key, value){
    const depMap = targetMap.get(target)
    if(depMap){
        const deps = depMap.get(key)
        if(deps){
            deps.forEach(eff=>eff())
        }
    }
 }
// const state = reactive({a:1})
// state.a
// state.a = 5
// delete state.a