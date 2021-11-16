[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-agent-reducer

 other language: [中文](https://github.com/filefoxper/use-agent-reducer/blob/master/README_zh.md)

 [Document](https://filefoxper.github.io/use-agent-reducer/#/)

[agent-reducer](https://www.npmjs.com/package/agent-reducer) is a very powerful tool, it converts a model object (`OriginAgent`) to be a state changeable object (`Agent`). It is designed on the reducer running base. Every thing returned from an `Agent` method will be a next state.

`use-agent-reducer` is designed for using `agent-reducer` in react hooks environment。

We can compare a classify reducer with `agent-reducer` model.

```typescript
import {OriginAgent} from "agent-reducer";

    interface Action {
        type?: 'stepUp' | 'stepDown' | 'step' | 'sum',
        payload?: number[] | boolean
    }

    /**
     * classify reducer
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
     * agent-reducer model
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

The code below is designed for a count change model, we can call method from `CountAgent` instance, and make every return to be a next state, this running mode is similar with reducer working mode, but more simple.


use `useAgentReducer` to replace `useReducer`.

```typescript
import React,{memo} from 'react';
import {OriginAgent} from "agent-reducer";
import {useAgentReducer} from 'use-agent-reducer';

/**
 * model class
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    // increase state by 1
    stepUp(): number{ 
        return this.state + 1;
    }

    // decrease state by 1
    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum(...counts: number[]): number {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

}

export const Counter = memo(() => {
    // useAgentReducer returns an `Agent` object,
    // which is the agent of model CountAgent.
    // we can get state and other property values from it.
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

The code below shows how to use API `useAgentReducer` with `OriginAgent` model, there are some concepts and designs about `agent-reducer` you should know first, you can learn these from [agent-reducer](https://filefoxper.github.io/agent-reducer/#/), then you will know what can be a model and why after reassign `Agent` method (`stepUp`) into another object, keyword `this` still represent `Agent` when the method is running.

As `agent-reducer` is designed by taking a next state from an `Agent` method return, we can not take a promise resolve data to be next state, but we can use `MiddleWare` in `agent-reducer` to reproduce a promise object, and take its resolve data as next state.

```typescript
import React,{memo,useEffect} from 'react';
import {middleWare,MiddleWarePresets, OriginAgent} from "agent-reducer";
import {useAgent} from 'use-agent-reducer';

/**
 * model
 */
class CountAgent implements OriginAgent<number> {

    state = 0;
        
    stepUp = (): number => this.state + 1;

    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum = (...counts: number[]): number => {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

    // return promise will change the state to be a promise object,
    // use MiddleWarePresets.takePromiseResolve(),
    // can take the promise resolve value to be next state
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async requestAdditions(){
        const args = await Promise.resolve([1,2,3]);
        return this.sum(...args);
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
If you want to know more about `useAgentReducer`, check [document](https://filefoxper.github.io/use-agent-reducer/#/) here.