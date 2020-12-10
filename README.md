[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-agent-reducer

reducer可以持续有效的管理数据变更，让数据处理模式变的井井有条，所以react开发了userReducer hook工具，但reducer也有自己的一些麻烦事。
为了让reducer变得更容易使用，这里引入了 [agent-reducer](https://www.npmjs.com/package/agent-reducer) 工具，
以便使用者可以利用class方法调用的形式来完成一个reducer的工作，该工具结合了reducer的return即修改的特性，
同时又使用更自然的方法调用代替了reducer复杂的dispatch系统，算的上是函数式编程和面向对象编程模式的完美结合了。

该工具可以用来作为react中类似 MVVM 设计的框架使用，当然因为它的侵入性小，所以把它定义成一个 MVVM 工具更加合理。

### 换种写法
```typescript
import {OriginAgent} from "agent-reducer";

    interface Action {
        type?: 'stepUp' | 'stepDown' | 'step' | 'sum',
        payload?: number[] | boolean
    }

    /**
     * 经典reducer
     * @param state
     * @param action
     */
    const countReducer = (state: number = 0, action: Action = {}): number => {
        switch (action.type) {
            case "stepDown":
                return state - 1;
            case "stepUp":
                return state + 1;
            case "step":
                return state + (action.payload ? 1 : -1);
            case "sum":
                return state + (Array.isArray(action.payload) ?
                    action.payload : []).reduce((r, c): number => r + c, 0);
            default:
                return state;
        }
    }

    /**
     * class写法
     */
    class CountAgent implements OriginAgent<number> {

        state = 0;
        
        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        sum = (...counts: number[]): number => {
            return this.state + counts.reduce((r, c): number => r + c, 0);
        };

    }
```
以上代码是一段简单的计数器，`CountAgent`通过调用对象属性方法的形式来完成一个`reducer action`分支，
`return`值作为计算完后的`this.state`数据（这里并未涉及state维护器，所以先当作有这么一个黑盒工具）。
有点像reducer，但省去了action的复杂结构（action为了兼容多个分支的不同需求所以很难以普通传参方式来工作）。

用`useAgent`来代替`useReducer`

```tsx
import React,{memo} from 'react';
import {OriginAgent} from "agent-reducer";
import {useAgent} from 'use-agent-reducer';

/**
 * class写法
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    //每次调用都让state+1
    stepUp = (): number => this.state + 1;

    //每次调用都让state-1
    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum = (...counts: number[]): number => {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

}

export const Counter = memo(() => {
    const {state,stepUp,stepDown}=useAgent(CountAgent);
    return (
        <div>
            <button onClick={stepUp}>stepUp</button>
            <span>{state}</span>
            <button onClick={stepDown}>stepDown</button>
        </div>
    );
});
```
以上代码是一个简单的例子，`useAgent`返回的是一个`CountAgent`实例代理对象。
通过调用这个实例代理对象的属性方法就可以`dispatch`一个`action`了，
当`dispatch`完成后，`this.state`就变成调用方法`return`的数据（但并非所有`return`数据都会成为下一个`this.state`）。

关于`reduce-action`和`middle-action`的定义，使用者可以查看 [agent-reducer](https://www.npmjs.com/package/agent-reducer)

这里做个简单说明，受`agent-reducer`使用的默认`MiddleWare`影响，
agent属性方法的返回值如果是`undefined`或`promise`，该方法自身就不会`dispatch`任何`action`。
这些方法通常需要调用能够`dispatch action`的其他属性方法来修改`this.state`。如下：
```tsx
import React,{memo,useEffect} from 'react';
import {OriginAgent} from "agent-reducer";
import {useAgent} from 'use-agent-reducer';

/**
 * class写法
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    stepUp = (): number => this.state + 1;

    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum = (...counts: number[]): number => {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

    //return promise，所以是 middle-action
    //middle-action 本身调用不会触发dispatch，需要调用其他 reduce-action 来修改this.state
    async requestAdditions(){
        const args = await Promise.resolve([1,2,3]);
        this.sum(...args);
    }

}

export const Counter = memo(() => {
    const {state,stepUp,stepDown,requestActions}=useAgent(CountAgent);

    useEffect(()=>{
        requestActions();
    },[]);

    return (
        <div>
            <button onClick={stepUp}>stepUp</button>
            <span>{state}</span>
            <button onClick={stepDown}>stepDown</button>
        </div>
    );
});
```
[更多例子](https://github.com/filefoxper/use-agent-reducer/blob/master/test/spec/basic.spec.tsx) 

关于其他 [agent-reducer](https://www.npmjs.com/package/agent-reducer) 知识，可以进入 `agent-reducer`的readme文件查看获知。
这是一个比较有意思的工具。

### API

1 . useAgent

用来创建一个稳定的agent对象，可用于代替`useState`、`useReducer`等工具获取更好的MVVM设计体验。

```
OriginAgent : class | new class();

MiddleWare : 见 agent-reducer

env : {reduceOnly?:boolean,strict?:boolean}

const agent = useAgent(OriginAgent, MiddleWare? | env?, env?);
```
关于参数含义可参考：[agent-reducer](https://www.npmjs.com/package/agent-reducer)

2 . useReduceAgent ( >=2.0.0 )

用来创建一个稳定的agent对象，可用于代替`useState`、`useReducer`等工具获取更好的MVVM设计体验。
与 `useAgent` 不同的是，`useReduceAgent`的`env.reduceOnly`必然为`true`，
这意味这`agent`模型`class`只做`reducer`使用，`defaultMiddleWare`不再判断返回值是否为`undefined`或`promise`，
所有返回数据都将成为`this.state`，而且层层代理dispatch也将失效。

```
OriginAgent : class | new class();

MiddleWare : 见 agent-reducer

env : {strict?:boolean}

const agent = useReduceAgent(OriginAgent, MiddleWare? | env?, env?);
```

关于参数含义可参考：[agent-reducer](https://www.npmjs.com/package/agent-reducer)

如果需要`middle-actions`，可以与`useMiddleActions`联合使用。如：
```tsx
import React,{memo,useEffect} from 'react';
import {MiddleActions, OriginAgent} from "agent-reducer";
import {useReduceAgent,useMiddleActions} from 'use-agent-reducer';

/**
 * class写法
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    //每次调用都让state+1
    stepUp = (): number => this.state + 1;

    //每次调用都让state-1
    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum = (...counts: number[]): number => {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

}

//'middle-actions' 可以统一写在一个继承MiddleActions的类里
class CountMiddles extends MiddleActions<CountAgent>{

    async requestAdditions(){
        const args = await Promise.resolve([1,2,3]);
        //该类默认的constructor会把useMiddleActions入参中的agent集成到当前类的agent属性上，以供使用。
        this.agent.sum(...args);
    }

}

export const Counter = memo(() => {

    const agent=useReduceAgent(CountAgent);

    const {state,stepUp,stepDown}=agent;
    //使用useMiddleActions调用'middle-action'
    const {requestAdditions}=useMiddleActions(agent,CountMiddles);

    useEffect(()=>{
        requestAdditions();
    },[]);

    return (
        <div>
            <button onClick={stepUp}>stepUp</button>
            <span>{state}</span>
            <button onClick={stepDown}>stepDown</button>
        </div>
    );
});
```
3 . useMiddleActions ( >=2.0.0 )

配合`useAgent`或`useReduceAgent`使用，可以自定义`middle-action`集合，用于异步请求后`dispatch`或做其他任何事情。

```
class Middles extends MiddleActions<OriginAgent>{
    ......middle-actions
}

MiddleWare 见 agent-reducer
LifecycleMiddleWare 见 agent-reducer

const agent=useReduceAgent(OriginAgent);
const middles = useMiddleActions(agent,Middles,MiddleWare?|LifecycleMiddleWare);
```
关于参数含义可参考：[agent-reducer](https://www.npmjs.com/package/agent-reducer)

4 . useMiddleWare ( >=2.0.0 ) ~~useBranch ( <2.0.0 )~~

复制一个`agent`成拥有可控生命周期的`agent`，有点类似git的分支概念。可通过附加`MiddleWare`或`LifecycleMiddleWare`控制复制版`agent`的特性。
可使用`agent-reducer`提供的`LifecycleMiddleWares`做到类似`redux-saga`的`takeLatest`这样的功能。

```
const agent=useAgent(OriginAgent);
const branch=useMiddleWare(agent, MiddleWare | LifecycleMiddleWare);
```
关于参数含义和`LifecycleMiddleWares`可参考：[agent-reducer](https://www.npmjs.com/package/agent-reducer)

5 . AgentProvider

`use-agent-reducer`提供的一个`react` Context.Provider组件，可为当前范围内所有需要使用已有`agent`的子组件提供Context便利。

```
const agent=useAgent(OriginAgent);

return (
    <AgentProvider value={agent}>
        {children}
   </AgentProvider>
)
```

6 . useAgentContext ( >=2.0.0 ) ~~useParent ( <2.0.0 )~~

配合`AgentProvider`使用，直接读取最近一层AgentProvider传入的agent对象。

```
const agent=useAgentContext();
```
[更多例子](https://github.com/filefoxper/use-agent-reducer/blob/master/test/spec/basic.spec.tsx) 

# 总结
如果喜欢它请给个小星星呗，么么哒（[给星地址](https://github.com/filefoxper/use-agent-reducer)）