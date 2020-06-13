[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-agent-reducer (stable)

recommend [use-redux-agent](https://github.com/filefoxper/use-redux-agent)

### reducer
Reducer brings us a lot of benefits when we organize states in our code. 
It provides a pure functional writing mode to make our state predictable, 
and simplify the logic what state flows by keyword <strong>return</strong>.

But it has some problems too. When we dispatch an action, we have to use `dispatch({type:'...',payload:{...}})` to tell 
reducer driver, we have put an action, please handle it, and give out the next state. 
We can not find out which branch in reducer has invoked easily. 

So, we use [agent-reducer](https://www.npmjs.com/package/agent-reducer) to enhancer <strong>react hook useReducer</strong>.
### make useReducer a little better
workable [example](https://github.com/filefoxper/use-agent/tree/master/example)

Now, let's write a reducer like this:
```typescript jsx
import {useAgent, OriginAgent} from "use-agent-reducer";

class Counter implements OriginAgent<number> {

    state = 0;

    constructor(state: number) {
        this.state = state;
    }

    public addOne() {
        return this.state + 1;
    }
    
    public add(addition:number) {
        return this.state + addition;
    }

    public addOneAfterOneSecond() {
        setTimeout(()=>this.addOne(),1000);
    }

}

function CounterComponent({count}:{count:number}) {
    
  const agent = useAgent(new Counter(count));
  
  return (
      <div>
        <button onClick={agent.addOne}>count:{agent.state}</button>
        <button onClick={()=>agent.add(1)}>add</button>
        <button onClick={agent.addOneAfterOneSecond}>addOneAfterOneSecond</button>
      </div>
  );
}
```
The code above gives us a new style to write a <strong>useReducer</strong>, 
and it using <strong>useReducer</strong> to maintain the state. 
The [agent-reducer](https://www.npmjs.com/package/agent-reducer) transform an <strong>agent class or object</strong> to reducer,
and provide a handler for usage. 

Let's analyze this code. 

The function `addOne` and `add` returns a next state, like a true reducer, it will change the state as what useReducer do.
So, it like a dispatch, but can set arguments more friendly, and do not need a type string as a notifier, 
because it is a function. The current state can be retrieve from this.state. So, We don't have to write a reducer like this now:
```typescript
const countReducer=(state:number,action)=>{
    if(action.type === 'ADD_ONE'){
        return state + 1;
    }
    if(action.type === 'ADD'){
        const {payload}=action;
        return payload.state + payload.addition;
    }
    return state;
};

function addOneAfterOneSecond(){
    setTimeout(()=>dispatch({type:'ADD_ONE'}),1000);
}
```
If you are using typescript, the type system will give you more infos to keep your code reliable.
There are some rules for you for using this tool better, and trust me, they are simple enough.

### rules
1 . The class or object which will replace reducer call <strong>agent</strong> here. To be an <strong>agent</strong>, 
it must has a <strong>state</strong> property, and do not modify <strong>state</strong> manually. 
this.state preserve the current state, so you can compute a <strong>next state</strong> by this.state and arguments from an <strong>agent</strong> function.
```
like agent.state
```
2 . The function in your <strong>agent</strong> which returns an object <strong>not</strong> undefined or promise, 
will be an <strong>dispatch function</strong>, when you deploy, it like dispatch an action to reducer. 
when this function invoke, it like a branch in a reducer function. 
```
like agent.addOne, agent.add
```
3 . The function which returns <strong>undefined | promise | void</strong> is just a simple function,
which can deploy <strong>dispatch functions</strong> to change state.
```
like agent.addOneAfterOneSecond
```
4 . <strong>Do not use namespace property</strong> in your agent. 
The property '<strong>namespace</strong>' will be used to connect with global state like combined reducers mapping state in redux.
( We will try to remove this rule by next version. )

### features
1. Do not afraid about using <strong>this.xxx</strong>, when you are using <strong>useAgent(agent:OriginAgent)</strong>.
The <strong>result useAgent</strong> return is rebuild by proxy and Object.defineProperties, and the functions in it have bind <strong>this</strong> by using sourceFunction.apply(agentProxy,...args),
so you can use those functions by reassign to any other object, and <strong>this</strong> in this function is locked to the <strong>result useAgent</strong> return.

### api
```typescript
/**
* 
* @param originAgent agent class or object
* @param e Env set how to run the dispatch and how to update state
* 
* @return agent which you will use to deploy, state for render, and functions for dispatch or effect
*/
declare function useAgent<S, T extends OriginAgent<S>>(originAgent: T | { new(): T }, e?: Env): T

/**
* the agent plays like a classify reducer, which must has a state. Be careful about namespace
*/
interface OriginAgent<S = any> {
  state: S,
  namespace?: string
}

interface Env {
  strict?: boolean           //default true, set strict false will make this.state change immediately before an dispatch has done.
                             //It is useful sometimes ( like consecutive dispatch in react ). But, we do not recommend doing this.
}
```
### example (you can retrieve a true example from [example](https://github.com/filefoxper/use-agent/tree/master/example))
```typescript jsx
import {useAgent,OriginAgent} from 'use-agent-reducer';

const getDefaultClassifyQueryState = (): ClassifyQueryState => ({
    form: {
        name: '',
        position: Position.USER
    },
    loading: false,
    list: null,
    page: 1,
    size: 3
});

class ClassifyQueryAgent implements OriginAgent<ClassifyQueryState> {

    effectiveForm: Form = getDefaultClassifyQueryState().form;

    state: ClassifyQueryState = getDefaultClassifyQueryState();

    private handleFormChange(formLike: { name?: string, position?: Position }) {
        const {form} = this.state;
        const newForm = {...form, ...formLike};
        return {...this.state, form: newForm};
    }

    private loadingBeforeQuery() {
        return {...this.state, loading: true};
    }

    //this function return a state, and it will dispatch a next state to change the state in store or something remains reducer state.
    public handleFormNameChange(name: string) {
        //before this.handleFormChange running, the agent has hold a parent dispatch function for it,
        // so this.handleFormChange here will not run dispatch. it just compute the next state for it's parent 'handleFormNameChange'
        this.handleFormChange({name});
    }

    public handleFormPositionChange(position: Position) {
        this.handleFormChange({position});
    }

    private handleResultChange(list: Array<Record>, page: number, size: number) {
        return {...this.state, loading: false, list, page, size};
    }

    //this function returns a promise, so it will not be a dispatch function, but it can deploy dispatch functions to change next state.
    public async handlePageChange(page: number, size: number) {
        this.loadingBeforeQuery();
        const requestParams: RequestParams = {...this.effectiveForm, page, size};
        const {list, page: p, size: s} = await fetchData(requestParams);
        this.handleResultChange(list, p, s);
    }

    //this function returns void, so it will not be a dispatch function, but it can deploy dispatch functions or other functions to change next state.
    public handleQueryClick() {
        this.effectiveForm = this.state.form;
        this.handlePageChange(1, 10);
    }

}

const MyComponent=()=>{
    const {
        state,
        handleFormNameChange,
        handleFormPositionChange,
        handleQueryClick,
        handlePageChange
    }=useAgent(ClassifyQueryAgent);
    return (
        <div>
            <div>
                <input value={state.form.name} onChange={(e)=>handleFormNameChange(e.target.value)}/>
                <select value={state.form.position} onChange={handleFormPositionChange}>
                    <option>...</option>
                    ...
                </select>
                <button onClick={handleQueryClick}>search</button>
            </div>
            <Table loading={state.loading} datasource={state.list}>...</Table>
            <Pager page={state.page} pageSize={state.size} onChange={handlePageChange}/>
        </div>
    );
};
```
# summary
This tool is designed for replacing <strong>useReducer in React Hook</strong>, so please use it as what useReducer use in your component.