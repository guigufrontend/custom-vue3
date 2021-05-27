const { onMounted, watch, computed } = Vue;

function useState(state){
    onMounted(()=>{
        console.log('mounted');
        state.value = 'init'
    })
    watch(state, (newValue, oldValue)=>{
        console.log(`newValue is ${newValue}`)
    })
    const computedState = computed(()=>state.value+' computed')
    return {state, computedState}
}