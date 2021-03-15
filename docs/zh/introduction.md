# 介绍

该工具的主要功能就是将一个可重制 state 的模型转换成一个可修改 state 的代理对象。代理对象将当前模型的 state 替换成模型最新产生的数据，并触发渲染。模型 [Model](/zh/introduction?id=model) 和代理 [Agent](/zh/introduction?id=agent) 是当前工具中最为重要的两个概念。 

## 动机

核心库 [agent-reducer](https://www.npmjs.com/package/agent-reducer) 是一款非常强大的模型状态管理工具，它并不依赖于其他第三方库的支持，相当独立的，因此我们采用 react hook 设计了 `use-agent-reducer`， 并把它和 react 联系起来。

## 概念

之前的文档中曾提及了两个非常重要的概念，模型 `Model` 和代理 `Agent` 。我们会在这节重点介绍它们。

#### 模型 Model

模型 `Model` 是一个拥有 state 属性的 class 或普通 object 对象， state 属性用于存储需要持续维护的数据，而模型上的方法皆用于根据不同的业务场景重制 state 数据。

1. 属性 `state` 用于存储需要持续维护的数据，它的数据类型可以任意选择。
2. 方法 `method` 用于提供生成 state 数据的方案，其返回值可被认为是最新的 state 数据。
   
模型样例:

```typescript
import {OriginAgent} from 'agent-reducer';

// 模型
class CountAgent implements OriginAgent<number> {
    // 初始化 state 数据
    state = 0;

    // 用于生成新的 state 数据
    stepUp = (): number => this.state + 1;

    // 用于生成新的 state 数据
    stepDown(): number {
      // this.state 为当前最新的 state 数据
      return this.state - 1;
    }

    step(isUp: boolean): number {
      // 可通过调用内部其他方法来生成新的 state 数据
      return isUp ? this.stepUp() : this.stepDown();
    }

    // 方法传参的体验好过 dispatch(action) 的体验
    sum(...counts: number[]): number{
      return this.state + counts.reduce((r, c): number => r + c, 0);
    };
}
```

#### 模型代理 Agent

`Agent` 是模型的 Proxy 代理对象，它提供了最新的 state 数据以及可以确实修改 state 的模型映射方法。你可以通过调用 API 接口 useAgentReducer 来创建一个模型代理对象，如果你向该接口传入的是一个 ES6 class 模型，接口方法会先将其转换为该 class 的实例对象，然后再根据实例去生成代理对象。

模型代理 `Agent` 的 state 总是与其模型 `Model` 的 state 保持一致的。

```typescript
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

class CountAgent implements OriginAgent<number> {

    state = 0;

    stepUp = (): number => this.state + 1;

    stepDown(): number {
      return this.state - 1;
    }

    step(isUp: boolean): number {
      return isUp ? this.stepUp() : this.stepDown();
    }

    sum(...counts: number[]): number{
      return this.state + counts.reduce((r, c): number => r + c, 0);
    };
}

......

// 使用 API useAgentReducer 创建一个模型代理 `Agent`
const agent = useAgentReducer(CountAgent);
```

## 安装

`use-agent-reducer`长期发布于[npm](https://www.npmjs.com/get-npm)。如果想要安装最新的稳定版本，可以使用一下命令：

```
npm i use-agent-reducer
```

我们希望在使用当前工具的同时，也能将 `agent-reducer` 的最新版本加入您的 package.json 文件，这对您使用该核心包中的辅助 API，以及代码关联提示都是十分有利的。

## 快速开始

本节主要阐述如何创建一个模型，以及如何使用 `agent-reducer` 辅助功能。本节内容可以辅助您快速掌握 `use-agent-reducer` 工具库的基本用法。

#### 创建模型

我们知道模型是一个 ES6 class 或普通 object，包含了一个 state 属性与若干 state 生产方法。根据这条规则，我们可以创建两种形式不同的模型，如下：

普通 object 对象模型:

```typescript
import React from 'react';
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

interface Model extends OriginAgent<number>{
    state: number
}

const model: Model={

    state: 0, // 初始化 state 数据

    // 生产新 state 的方法
    increase():number {
        return this.state + 1;
    }

}

const MyComponent = () =>{
    // api useAgentReducer 是一个 react hook，
    // 所以我们应该在 react 组件或自定义 hook 中使用它
    const agent = useAgentReducer(model);
    // agent 方法可以被赋予其他对象,
    // 方法中的关键词 `this` 总是代表着模型 Model。
    const {state,increase} = agent;

    return (
        <div>
            <span>count: {state}</span>
            <button onClick={increase}>setName</button>
        </div>
    );

};

```

with class pattern:

```typescript
import React from 'react';
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

class Model implements OriginAgent<number>{

    state: number;

    constructor(){
        // 初始化 state 数据
        this.state = 0;
    }

    // 生产新 state 的方法
    increase():number {
        return this.state + 1;
    }

}

const MyComponent = () =>{
    // api useAgentReducer 是一个 react hook，
    // 所以我们应该在 react 组件或自定义 hook 中使用它
    const agent = useAgentReducer(model);
    // agent 方法可以被赋予其他对象,
    // 方法中的关键词 `this` 总是代表着模型 Model。
    const {state,increase} = agent;

    return (
        <div>
            <span>count: {state}</span>
            <button onClick={increase}>setName</button>
        </div>
    );

};
```

我们推荐使用 ES6 class 模型，这样我们可以使用 `ES6 decorator` 来简化 `agent-reducer` 提供的各种辅助功能。

#### 使用 agent-reducer 辅助功能

核心库 `agent-reducer` 提供来一些非常有用的 API ，比如 `middleWare` 、 `MiddleWarePresets` 。熟练使用这两个 API 可以让你事半功倍。 

MiddleWare system makes `Agent` methods more flexible. You can use MiddleWare to reproduce a new state which is returned from a method, or control the method calling feature ( like adding method debounce, and so on ).

The code below shows how to use MiddleWare, and we use `MiddleWarePresets.takePromiseResolve` for example.

``` typescript
import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('通过 API 来使用 MiddleWare ', () => {

    // 创建 User 数据管理模型
    class UserModel implements OriginAgent<User> {

        state: User;

        constructor() {
            // 初始化默认 state 数据
            this.state = {id: null, name: null, role: 'GUEST'};
            // 在 constructor 中，可使用 `agent-reducer` API `middleWare` 直接
            // 对指定方法添加 `MiddleWare`
            middleWare(this.changeUserRole, MiddleWarePresets.takeAssignable());
        }

        // 调用方法，产生的返回值可被认为是下一个最新的 state 数据
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): Partial<User> {
            return {role};
        }

        // 如果我们不对返回的 promise 值使用 MiddleWare,
        // 最新 state 将变成一个 promise 对象.
        // 我们可以通过 api `useAgentReducer`
        // 对其添加 MiddleWare 来解决这个问题
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('直接调用 `Agent` 代理的异步方法，会让 state 变成一个 promise 对象', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        const state: User & { then?: () => any } = agent.state;
        expect(typeof state.then).toBe('function');
    });

    it('使用 `useAgentReducer` 添加相应的 `MiddleWare` 可以把返回 promise 对象的 resolve 值变成最新 state', async () => {
        // 使用 `useAgentReducer` 添加相应的 `MiddleWare`，
        // `MiddleWarePresets.takePromiseResolve` 可以把返回 promise 对象的 resolve 值变成最新 state。
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

    it('在 constructor 中，可使用 `agent-reducer` API `middleWare` 直接对指定方法添加 `MiddleWare`', () => {
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
        });
        expect(agent.state).toEqual({id: null, name: null, role: 'MASTER'});
    });

    it('使用 API `useMiddleWare` 添加相应的 `MiddleWare` 可以把返回 promise 对象的 resolve 值变成最新 state', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));

        // 使用 `useAgentReducer` 添加相应的 `MiddleWare`，
        // `MiddleWarePresets.takePromiseResolve` 可以把返回 promise 对象的 resolve 值变成最新 state。
        const {result: resultCopy} = renderHook(() => useMiddleWare(result.current, MiddleWarePresets.takePromiseResolve()))
        const agent = result.current;
        const agentCopy = resultCopy.current;
        await act(async () => {
            await agentCopy.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});
```

如果您的项目中使用了 `Babel decorator plugin` ，你可以更容易，更显式得区分每个方法需要的 `MiddleWare` ，让代码功能更清晰更简单。

``` typescript
import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('使用 decorator 来添加 MiddleWare', () => {

    // 创建 User 数据管理模型
    class UserModel implements OriginAgent<User> {

        // 初始化默认 state 数据
        state: User = {id: null, name: null, role: 'GUEST'};

        // 调用方法，产生的返回值可被认为是下一个最新的 state 数据
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        // 如果我们不对返回的 promise 值使用 MiddleWare,
        // 最新 state 将变成一个 promise 对象.
        // 我们可以使用 `agent-reducer` api `middleWare` 的 decorator 形式
        // 对方法添加 `MiddleWarePresets.takeAssignable()` 来解决问题，
        // 这个 MiddleWare 可以将返回值与当前 state 数据合成最新的 state.
        @middleWare(MiddleWarePresets.takeAssignable())
        changeUserRole(role: Role): Partial<User> {
            return {role};
        }

        // 如果我们不对返回的 promise 值使用 MiddleWare,
        // 最新 state 将变成一个 promise 对象.
        // 我们可以使用 `agent-reducer` api `middleWare` 的 decorator 形式
        // 对方法添加 `MiddleWarePresets.takePromiseResolve()` 来解决问题，
        // 这个 MiddleWare 可以将 promise resolve 值转换成最新的 state.
        @middleWare(MiddleWarePresets.takePromiseResolve())
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('使用 `agent-reducer` api `middleWare` 的 decorator 形式添加 ``MiddleWarePresets.takeAssignable()`', () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act( () => {
            agent.changeUserRole('MASTER');
        });
        expect(agent.state).toEqual({id: null, name: null, role: 'MASTER'});
    });

    it('使用 `agent-reducer` api `middleWare` 的 decorator 形式添加 ``MiddleWarePresets.takePromiseResolve()`', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});
```

您可以查看我们的[单元测试源码](https://github.com/filefoxper/use-agent-reducer/blob/master/test/zh/basic.spec.tsx)进一步熟悉这种开发模式，也可以通过阅读 `agent-reducer`  [关于 MiddleWare 的文档](https://github.com/filefoxper/agent-reducer/blob/master/documents/zh/guides/about_middle_ware.md)了解更多 MiddleWare 知识。 你可以查看 `agent-reducer` 库自带的 MiddleWare [资源列表](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/api/middle_ware_presets.md)。
