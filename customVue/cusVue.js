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
    if(eff){
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

 }
 function trigger(target, key){
    const depMap = targetMap.get(target)
    if(depMap){
        const deps = depMap.get(key)
        if(deps){
            deps.forEach(dep=>dep())
        }
    }
 }
const Vue = {
    createApp(options){
        const renderer = Vue.creatRenderer({
            querySelector(selector){
                return document.querySelector(selector)
            },
            insert(child, parent, anchor){
                parent.insertBefore(child, anchor||null)
            }
        })
        return renderer.createApp(options);
    },
    creatRenderer({querySelector, insert}){
        return {
            createApp(options){
                return {
                    mount(selector){
                        const parent = querySelector(selector)
                        if(!options.render){
                            options.render = this.compile(parent.innerHTML)
                        }
                        if(options.data){
                            this.dataState = options.data()
                        }
                        if(options.setup){
                            this.setupState = options.setup()
                        }
                        this.proxy = new Proxy(this, {
                            get(target, key){
                                if(key in target.setupState){
                                    return target.setupState[key];
                                }else{
                                    return target.data[key]
                                }
                            },
                            set(target, key, value){
                                if(key in target.setupState){
                                    target.setupState[key] = value;
                                }else{
                                    target.data[key] = value;
                                }
                            }
                        })
                        this.update = effect(()=>{
                            // 获取dom节点
                            const el = options.render.call(this.proxy)
                            // 追加节点到宿主元素
                            parent.innerHTML="";
                            // parent.appendChild(el);
                            insert(el, parent)
                        })
                    },
                    compile(template){
                        return function render(oldVNode, newVNode){
                            const h3 = document.createElement('h3')
                            h3.textContent = this.title
                            return h3; 
                        }
                    }
                }
            }
        }
    }
}