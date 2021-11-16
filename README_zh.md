[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-agent-reducer

[文档地址](https://filefoxper.github.io/use-agent-reducer/#/zh/)

[agent-reducer](https://www.npmjs.com/package/agent-reducer) 是一款非常不错的 reducer 模型化工具，它没有过于复杂的结构，且并不直接依赖于 react、 redux 等外部运行环境。为了可以在 react 环境中使用它，我们开发了 `use-agent-reducer` 。这是一款用于支持 `agent-reducer` 的 react hook 工具，为此，你需要准备一套版本大于 `16.8.0` 的 react 开发环境来使用它。 

以下代码对比了经典 reducer 用法，你会发现 agent-reducer 的优势所在。

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
        
        stepUp(): number {
            return this.state + 1;
        } 

        stepDown = (): number => this.state - 1;

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        sum(...counts: number[]): number {
            return this.state + counts.reduce((r, c): number => r + c, 0);
        };

    }
```

以上代码是一段简单的计数器模型，通过调用`CountAgent`实例方法来生成新的 state 数据比 reducer 纯函数计算更简单更明确。但这种工作方式又与经典 reducer 很像，都是通过返回值来确定下一个 state 数据。

使用`useAgentReducer`来代替 react hook 中的 `useReducer`。

```typescript
import React,{memo} from 'react';
import {OriginAgent} from "agent-reducer";
import {useAgentReducer} from 'use-agent-reducer';

/**
 * 建立模型
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    // 每次调用都让state+1
    stepUp(): number {
        return this.state + 1;
    } 

    // 每次调用都让state-1
    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum(...counts: number[]): number {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

}

export const Counter = memo(() => {
    // 使用 useAgentReducer 可以把 CountAgent 模型
    // 转换成一个通过调用方法来修改 state 数据的实例对象
    const {state,stepUp,stepDown} = useAgentReducer(CountAgent);

    return (
        <div>
            <button onClick={stepUp}>stepUp</button>
            <span>{state}</span>
            <button onClick={stepDown}>stepDown</button>
        </div>
    );
});
```
以上代码是一个简单的例子，通过点击 stepUp 按钮可以让当前 state 自动加 1，点击 stepDown 按钮则减 1。useAgentReducer 方法返回的对象是当前模型的代理对象，通过调用代理对象方法可以修改当前 state 数据，并触使页面渲染。

这里涉及到一些 [agent-reducer](https://filefoxper.github.io/agent-reducer/#/zh/) 的基本概念，比如 OriginAgent 模型、 Agent 代理，以及 Agent 代理方法中 this 的安全性等（比如：stepUp 方法中的 this，在赋值给 onClick 后依然安全指向模型实例对象）

关于 Promise 等特殊返回数据，可通过 `MiddleWare` 进行 state 再加工。如下：

```typescript
import React,{memo,useEffect} from 'react';
import {middleWare,MiddleWarePresets, OriginAgent} from "agent-reducer";
import {useAgentReducer} from 'use-agent-reducer';

/**
 * 建立模型
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    stepUp(): number {
        this.state + 1;
    }

    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum(...counts: number[]): number {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

    // return promise，如果不加任何MiddleWare再处理，
    // 那 state 将会变成一个 promise 对象
    // 使用 MiddleWare 后，promise resolve 值将变成下一个 state
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async requestAdditions(){
        const args = await Promise.resolve([1,2,3]);
        return this.sum(...args);
    }

}

export const Counter = memo(() => {

    const {state,stepUp,stepDown,requestAdditions} = useAgentReducer(CountAgent);

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

如果您想要了解更多关于 `use-agent-reducer` 的信息，可查看我们的[文档](https://filefoxper.github.io/use-agent-reducer/#/zh/)。