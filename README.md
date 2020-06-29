[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

[中文文档](https://github.com/filefoxper/use-agent-reducer/blob/master/README_ch.md)

# use-agent-reducer (stable)

# new changes
1. provide `Resolver` as the middleWare system in redux.
2. provide `useBranch` hook to do a special work with special mode like `takeLatest` in `redux-saga`. 

[See more about branch, Resolver, BranchResolvers, BranchApi](https://www.npmjs.com/package/agent-reducer)

recommend [use-redux-agent](https://www.npmjs.com/package/use-redux-agent), another react hook for enhance react-redux.

### reducer
reducer brings us a lot of benefits when we organize states. 
It provides a pure functional writing mode to make our state predictable. 
When we use keyword <strong>return</strong> to give out then next state, the rest logic can be negligible.

But it has some problems too. When we dispatch an action, we have to use `dispatch({type:'...',payload:{...}})` to tell 
reducer driver, we have put an action, please handle it, and give out the next state. 
We can not use it easily as deploy a function. 

So, we use [agent-reducer](https://www.npmjs.com/package/agent-reducer) to enhancer <strong>react hook useReducer</strong>.
### make useReducer a little better
workable [example](https://github.com/filefoxper/use-agent-reducer/tree/master/example)

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

function CounterComponent({initialCount}:{initialCount:number}) {
    
  const {state:count,addOne,add,addOneAfterOneSecond} = useAgent(new Counter(initialCount));
  
  return (
      <div>
        <button onClick={addOne}>count:{count}</button>
        <button onClick={()=>add(1)}>add</button>
        <button onClick={addOneAfterOneSecond}>addOneAfterOneSecond</button>
      </div>
  );
}
```
The code above gives us a new style to write a <strong>useReducer</strong>, 
and it using <strong>useReducer</strong> to maintain the state. 
The [agent-reducer](https://www.npmjs.com/package/agent-reducer) transform an <strong>agent class or object</strong> to reducer,
and provide a handler for usage. 

Let's analyze this code. 

The function `addOne` above returns a next state, like a true reducer, it will change the state in store. 
And when you deploy it from agent like `agent.addOne()`, it dispatch an action.
The current state can be retrieved from `agent.state` or `this.state`. So, We don't have to write a reducer like this now:

workable [example](https://github.com/filefoxper/use-agent-reducer/tree/master/example)
```typescript jsx
import {useReducer} from 'react';

const countReducer=(state:number,action)=>{
    if(action.type === 'ADD_ONE'){
        return state + 1;
    }
    if(action.type === 'ADD'){
        const {payload}=action;
        return state + payload;
    }
    return state;
};

function CounterComponent({initialCount}:{initialCount:number}) {
    
  const [count,dispatch] = useReducer(countReducer,initialCount);
  
  function addOneAfterOneSecond(){
      setTimeout(()=>dispatch({type:'ADD_ONE'}),1000);
  }
  
  return (
      <div>
        <button onClick={()=>dispatch({type:'ADD_ONE'})}>count:{count}</button>
        <button onClick={()=>dispatch({type:'ADD',payload:1})}>add</button>
        <button onClick={addOneAfterOneSecond}>addOneAfterOneSecond</button>
      </div>
  );
}
```
If you are using typescript, the type system will give you more infos to keep your code reliable.
There are some rules for you for using this tool better, and trust me, they are simple enough.

### rules
1 . The class or object to `useAgent` function is called <strong> originAgent</strong>. To be an <strong>originAgent</strong>, 
it must has a <strong>state</strong> property. Do not modify <strong>state</strong> manually. 
this.state preserve the current state, so you can compute a <strong>next state</strong> by this.state and params in an <strong>originAgent</strong> function.

2 . The object `useAgent(originAgent)` is called <strong>agent</strong>. 
And the function in your <strong>agent</strong> which returns an object <strong>not</strong> undefined or promise, 
will be an <strong>dispatch function</strong>, when you deploy it, an action contains next state will be dispatched to a true reducer.  
```
like agent.addOne, agent.add
```
3 . The function which returns <strong>undefined | promise</strong> is just a simple function,
which can deploy <strong>dispatch functions</strong> to change state.
```
like agent.addOneAfterOneSecond
```
4 . <strong>Do not use namespace property</strong> in your agent. 
The property '<strong>namespace</strong>' will be used by `useAgent` inside.
( We will try to remove this rule by next big version. )

### features
1. Do not worry about using <strong>this.xxx</strong>, when you use <strong>agent</strong> created by <strong>useAgent(originAgent)</strong>.
The <strong>agent</strong> has been rebuild by proxy and Object.defineProperties, the functions inside have bind <strong>this</strong> by using sourceFunction.apply(agentProxy,...args),
so you can use those functions by reassign to any other object, and <strong>this</strong> in this function is locked to the <strong>agent</strong> object.
2. The <strong>agent</strong> created by <strong>useAgent(originAgent)</strong> will lose effectiveness after your component unmount.
So, don't worry about dispatch an action after the component is unmount.
### api
useAgent(originAgent,e?:Env)
###### params
1. originAgent：a class or object with state property and functions, for replacing the reducer
2. e（Env）：agent running environment

e（Env）：

1 . strict：true|false       （force the agent update state by reducer driver）

defaults true. When true, the agent state will be updated exactly by reducer driver state changes. 
When false, the agent state will be updated quickly by the result invoked from the <strong>dispatch function</strong>.

###### return
agent （like function reducer(state:State,action:Action):State}）：

A proxy from originAgent, which can dispatch actions by deploy <strong>dispatch functions</strong>,
and retrieve current state by using agent.state.

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
### workable [example](https://github.com/filefoxper/use-agent-reducer/tree/master/example)
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
###### useBranch(agent:Agent,resolver:BranchResolver)
`useBranch` creates a copy object of your agent, every dispatch from branch will change the state of your agent too.
 You can not modify props in this copy object. It is designed for doing something like 'simple effects in redux-saga'. 
 When you created a branch with a <strong>BranchResolver</strong>, 
you can use <strong>branchApi</strong> to reject or rebuild this branch as you wish. If you reject it, Your branch can not dispatch any state to reducer.
If you rebuild it, The old branch will be rejected first, and then build a new branch instead. 

You can `import {BranchResolvers,BranchApi} from 'agent-reducer'`, the `agent-reducer` package will be installed auto in your `node_modules`.

[See more about BranchResolvers](https://www.npmjs.com/package/agent-reducer)

[example](https://github.com/filefoxper/use-agent-reducer/tree/master/example)
```typescript jsx
import React, {memo, useEffect} from 'react';
import {Button, Input, Pagination, Select, Table} from "antd";
import {useAgent,useBranch} from "use-agent-reducer";
import {ClassifyQueryAgent} from "@/module";
import {Position} from "./type";
import Column from "antd/lib/table/Column";
import {BranchResolvers} from "agent-reducer";

const Option = Select.Option;

export default memo(() => {

    const agent = useAgent(ClassifyQueryAgent);

    const {state, handleFormNameChange, handleFormPositionChange} = agent;

    //if the fetch promise of page 1 coming back later then page 2, the page 2 data may be covered by page1 data,
    //so we use useBranch make the search task working in takeLatest mode, then the page 1 data will not cover page 2.
    const {handleQueryClick, handlePageChange}=useBranch(agent,BranchResolvers.takeLatest());

    useEffect(() => {
        handleQueryClick();
    }, []);

    return (
        <div style={{padding: 12}}>
            <div style={{padding: '12px 0'}}>
                <label>name：</label>
                <Input style={{width: 160, marginRight: 8}} value={state.form.name}
                       onChange={(e) => handleFormNameChange(e.target.value)}/>
                <label>position：</label>
                <Select style={{width: 160, marginRight: 8}} value={state.form.position}
                        onChange={handleFormPositionChange}>
                    <Option value={Position.USER}>user</Option>
                    <Option value={Position.MASTER}>master</Option>
                    <Option value={Position.ADMIN}>admin</Option>
                </Select>
                <Button type="primary" onClick={handleQueryClick}>search</Button>
            </div>
            <Table dataSource={state.list} loading={state.loading} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id"/>
                <Column title="name" dataIndex="name"/>
                <Column title="position" dataIndex="position"/>
            </Table>
            <Pagination current={state.page} total={state.total} pageSize={10} onChange={handlePageChange}/>
        </div>
    );
});
```
#### suggest to using branch
A branch is considered to do just one special work with a resolver. It can be rejected or be rebuilt any time.
So, you'd better make sure the functions you deployed from a branch are doing the same thing.
For example: `change page and fetch data` and `click search button fetch data` are the same work.

# summary
This tool is designed for replacing <strong>useReducer in React Hook</strong>, so use it if you think a useReducer can be using.