[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-agent-reducer (稳定版)

推荐 [use-redux-agent](https://github.com/filefoxper/use-redux-agent)

### reducer
为什么要reducer?reducer与其说是一个简单的数据处理器，更像是一个数据迭代描述器。它指明了下一步的数据该是什么样子的，
下一个数据和当前数据的区别是什么。而数据是怎么加工的，这是核心，并非重点。换句话说，reducer可以被看作是一个黑盒处理器，
处理逻辑可以写在reducer方法里也可以通过引用其他方法获取。reducer以return的方式指明下一个数据该是什么样的，这是个非常优秀的设计。
在一段复杂逻辑中，return可以大大减小我们的思维逻辑压力。（我们只要注意return出现在哪里，走到当前return需要经过哪些逻辑分支就行了，而不必关注return之后的逻辑代码）
另外reducer通常被写成幂等函数，入参不变结果不变，这大大提高了结果的可预测性。

纵然reducer有上述大量优点，但依然不能唤起更多人的喜爱，就因为dispatch模式。当我们需要通过reducer的下一个数据的时候，
我们通常要通过dispatch，事件分发的行为让它动起来。因为reducer需要于被维护的state联系起来，故选择了dispatch作为事件分发器。
但dispatch却限制了使用者的行为。比如：dispatch必须以action object作为参数，而大部分reducer只能通过接收state和action的方式来工作。
因为dispatch和reducer之间缺乏必然的联系，这让很多typescript类型系统使用者很心累。

为了解决上述问题，让reducer更贴近使用者，我们引入了 <strong>agent-reducer</strong>，reducer代理器。它让我们可以以近似class或object的写法来书写reducer。

### 换种写法
让我们这样使用useReducer：

可工作的 [例子](https://github.com/filefoxper/use-agent-reducer/tree/master/example)
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
以上代码是一段简单的计数器，我们依然通过 return 的形式来决定下一个state数据该是什么样子的。比如`addOne`、`add`方法。
我们通过直接调用方法的方式来dispatch一个参数松散的action，这些参数将被转成action的payload数据。而方法运行内容就是原来reducer的部分运行内容。
除了这种直接return普通object作为下一个state的方法外，这里还提供了return undefined|promise的方法来做dispatch方法集成。
比如`addOneAfterOneSecond`方法，它返回了一个void或者说是undefined对象，该方法不能直接决定下一个state的数据（简单说，它并没有直接dispatch），
但却可以通过调用`addOne`方法去影响下一个state数据（去dispatch action）。

让我们把它翻译成原始reducer的写法。
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
通过两种reducer在写法上的对比，我们可以发现useAgent写法更加自然，它保留了reducer关于return的优势及特性，同时又兼顾了自然方法传参。
但该写法并非一个纯粹的函数，需要依赖`createAgentReducer`方法进行代理测试。另外this.state扮演着reducer入参state，也就是当前state，
所以在需要依赖当前state进行reduce处理时，需要使用this.state。很多人都非常害怕js中的this，而在useAgent中可能会大量使用this关键字。

综合上述特性，如果觉得该工具将为你带来的优势大于原生reducer，那么请继续深入了解它。

### 使用须知
1 . 我们把useAgent(originAgent)的入参class或object称为<strong>originAgent</strong>（原代理）。而一个合法原代理需要一个可读写访问的state属性。
并且注意，不要人工修改state属性（这与reducer的state不期望被修改是同样的道理）。
```
如上例中：agent.state
```
2 . 我们把useAgent(originAgent)产生的对象称为<strong>agent</strong>代理，agent代理中的function如果返回的是一个非promise或undefined的对象，该对象将被作为下一个state更新到reducer维护器（如store）里去，
我们称这种function为（<strong>dispatch function</strong>），即能发起dispatch的function。
```
如上例中：agent.addOne,agent.sum
```
3 . agent代理中的function如果返回的是一个promise或undefined，那这个function不会自主发起dispatch，不会产生下一个state。
但它可以通过调用一个<strong>dispatch function</strong>来影响下一个state。
```
如上例中：agent.addOneAfterOneSecond，返回undefined但在setTimeout中调用了agent.addOne
```
4 . <strong>不要使用namespace属性</strong>，这个属性暂时会作为一个特殊关键字被useAgent捕获，做全局数据管理器区分数据块的标准。
比如redux。

### 特性
1. 不要担心this问题，当你使用useAgent(originAgent)获取代理时，你的agent代理方法已经通过fn.apply(proxy,...)以及闭包的形式强行锁定了this。
所以无论你是把agent的方法赋值给其他对象属性，还是通过call,apply重新绑定，该方法运行时的this始终都是agent。
为什么这么设计？因为我们不认为直接拿一个object的方法绑定到其他object上是一个好的设计，其中的隐晦太多了。
2. 不用担心在component unmount之后调用dispatch方法修改state的问题，因为useAgent会在unmount时让之后的dispatch方法全部失效。

### api
useAgent(originAgent,e?:Env)

通过class或object创建一个链接reducer的originAgent的代理对象。

参数：
1. originAgent：代理class或object
2. e:代理运行环境

agent代理原型环境e:Env解析:

1. strict：true|false   （agent是否严格与reducer维护器同步）

默认true，当这个参数为true时，agent.state将严格由reducer维护器或reducer.update进行更新，如果为false，
则每次agent dispatch function运行完成就立即更新agent.state数据。（注意：这里只是个选项，我们并不推荐你使用strict:false）

返回：

代理对象，拥有和原生被代理对象originAgent近乎一摸一样的属性，通过agent.state获取最新state数据，通过agent.xxx(function)
调用方法（dispatch function或非dispatch function）。

### 可工作的 [例子](https://github.com/filefoxper/use-agent-reducer/tree/master/example)
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
# 总结
如果喜欢它请给个小星星呗，么么哒（[给星地址](https://github.com/filefoxper/use-agent-reducer)）