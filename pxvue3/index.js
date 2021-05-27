const effectStack = []
const targetMap = new WeakMap()

const Vue={
    createApp(options){
        const renderer = Vue.createRenderer({
            querySelector(selector){
                return document.querySelector(selector)
            }, 
            insert(child, parent, anchor){
                parent.insertBefore(child, anchor||null)
            }
        })
        return renderer.createApp(options)
    },
    createRenderer({querySelector, insert}){
        return {
            createApp(options){
                return {
                    mount(selector){
                        const parent = querySelector(selector);
                        
                        //获取渲染函数、 通常是编译的结果
                        if(!options.render){
                            options.render = this.compile(parent.innerHTML)
                        }
                        
                        if(options.setup){
                            this.setupState = options.setup();
                        }else{
                            this.data = options.data();
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
                        this.update = Vue.effect(()=>{
                            // 获取dom节点
                            const el = options.render.call(this.proxy)
                            // 追加节点到宿主元素
                            parent.innerHTML="";
                            // parent.appendChild(el);
                            insert(el, parent)
                        })
                        
                    },
                    compile(template){
                        // 解析template 生成render函数
                        return function render(){
                            const h3 = document.createElement('h3')
                            // 希望渲染app中data返回的title
                            h3.textContent = this.title;
                            return h3
                        }
                    }
                    
                }
            }
        }
    },
    isObject(v){
        return typeof v ==='object'&&v!==null
    },
    reactive(obj){
        if(!Vue.isObject(obj)){
            return obj
        }
        return new Proxy(obj,{
            get(target, key){
                console.log('get', key)
                const res = Reflect.get(target, key)
                // 依赖收集
                Vue.track(target, key)
                return Vue.isObject(res)? reactive(res): res
            },
            set(target, key, value){
                console.log('set', key)
                const res = Reflect.set(target, key, value)
                Vue.triger(target, key)
                return res
            },
            deleteProperty(target, key){
                console.log('delete', key)
                const res = Reflect.deleteProperty(target, key)
                Vue.triger(target, key)
                return res
            },
        })
    },
    
    // 创建响应式数据和副作用函数之间的依赖关系
    effect(fn){
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
    },
    //依赖收集
    track(target, key){
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
    },
    //依赖触发
    triger(target, key){
        const depMap = targetMap.get(target)
        if(depMap){
            const deps = depMap.get(key)
            if(deps){
                deps.forEach(dep=>dep())
            }
        }
    }
}