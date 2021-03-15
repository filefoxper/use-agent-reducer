# 教程

## 说明

本教程将通过构建一个简单查询页面来模拟如何使用 `use-agent-reducer` 来解决开发中所遇到的问题。

你可以[下载](https://github.com/filefoxper/use-agent-reducer/tree/master/example)我们的例子在本地进行相关试验。

* [构建简单查询页面](/zh/tutorial?id=构建简单查询页面)
* [使用 MiddleWare](/zh/tutorial?id=使用-middleWare)
* [拆分模型](/zh/tutorial?id=拆分模型)
* [使用 take latest MiddleWare](/zh/tutorial?id=使用-take-latest-middleware)
* [使用模型共享](/zh/tutorial?id=使用模型共享)

## 构建简单查询页面

我们将创建一个 todo list 查询页面。但在开始前，我们应该先列出 todo list 查询页所需要的数据模型，作为页面模型 Model 的 state 。

1. 查询条件
2. 列表数据
3. 分页信息

数据模型设计如下:

```typescript
// TODO优先级
export enum PriorLevel {
    NORMAL,     // 普通
    EMERGENCY   // 紧急
}

// 列表单行数据模型
export interface Todo {
    // TODO内容
    readonly content:string,
    readonly createTime:string,
    // 优先级
    readonly priorLevel:PriorLevel
}

// 查询条件
export interface SearchParams {
    // 用于匹配单条内容 'content' 
    readonly content?:string,
    // 用于匹配单条优先级 'priorLevel' 
    readonly priorLevel?:PriorLevel
}

// 页面数据模型
export interface State {
    // 查询条件
    readonly searchParams: SearchParams,
    // 列表数据
    readonly dataSource:Array<Todo>|null,
    // 分页信息
    readonly currentPage:number, // 当前页码
    readonly pageSize:number,    // 每页条数
    readonly total:number,       // 总数据量
}
```

现在我们可以开始创建我们的查询页模型 `SimpleTodoList` 了。这个页面模型需要拥有修改查询条件、列表数据、分页信息的功能。当列表数据请求返回数据时，我们可以通过调用方法 `changeDataSource` 来修改 `state.dataSource` 数据，通过调用 `changePageInfo` 来修改 state 中的分页信息。

[源码位置](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/simpleSearch)

模型：

```typescript
import {OriginAgent} from "agent-reducer";
import {PriorLevel, State, Todo} from "@/type";

const defaultState: State = {
    searchParams: {},
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0
};

/**
 * 这是一个简单 TodoList 页面模型
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // 设置 state 初始值
    state = defaultState;

    // 修改查询条件中用于内容匹配的数据
    changeSearchContent(content?: string): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, content}};
    };

    // 修改查询条件中用于优先级匹配的数据
    changeSearchPriorLevel(priorLevel?: PriorLevel): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, priorLevel}};
    }

    // 修改分页信息
    changePageInfo(currentPage: number, pageSize: number, total: number): State {
        return {...this.state, currentPage, pageSize, total};
    }

    // 修改列表数据
    changeDataSource(dataSource: Array<Todo>): State {
        return {...this.state, dataSource};
    }

}
```

页面:

```typescript
import React, {useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel} from "@/type";

export default function SimpleSearch() {

    const {
        state,
        changeSearchContent,
        changeSearchPriorLevel,
        changeDataSource,
        changePageInfo
    } = useAgentReducer(SimpleTodoList);

    // 查询方法
    // TODO 问题 1: 在改变当前页码的时候，查询条件的实时修改数据会参与查询
    const search = useCallback(async (currentPage: number = 1, pageSize: number = 10) => {
        const {searchParams} = state;
        // TODO 问题 2: fetchTodoList 应该在模型方法中调用，是模型的一部分
        const {content, total} = await fetchTodoList({...searchParams, currentPage, pageSize});
        // TODO 问题 3: 在一个事件中多次修改 state 并不好，
        // 如果在 react 原派生事件中，多次修改将产生合并现象，导致覆盖效应。
        // 另外即便在非 react 原派生事件中，多次修改也不利于保持数据的一致性，
        // 这与 agent-reducer 以及 reducer 的设计初衷不符。
        changeDataSource(content); // 每次修改导致组件 render...
        changePageInfo(currentPage, pageSize, total); // 每次修改导致组件 render...
    }, [state]);

    useEffect(() => {
        search(1, 10);
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    // 每次查询修改两次数据，造成两次渲染。
    console.log('render...');
    return (
        <PageContent>
            <SearchContent>
                <label>content: </label>
                <ContentInput value={state.searchParams.content} onChange={changeSearchContent}/>
                <label>prior level: </label>
                <PriorLevelSelect value={state.searchParams.priorLevel} onChange={changeSearchPriorLevel}/>
                <Button type="primary" onClick={() => search(1, 10)}>submit</Button>
            </SearchContent>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination current={state.currentPage} total={state.total} pageSize={state.pageSize} onChange={search}/>
        </PageContent>
    );

}
```

目前这个页面已经可以工作起来了，但依然有些问题：

1. 请求方法在模型外部调用不利于模型的完整性，同时导致模型复用性差。
2. 多次连续修改 state 并不理想，不利于保持数据的一致性，同时导致组件性能变差。
3. 查询条件路径过深，因此设置需时要两次 assign 操作，而且每次修改查询条件即刻生效，不利于用户理解翻页查询功能。

让我们重构以上代码，解决这些问题。

## 使用 MiddleWare

首先让我们来解决问题 1 和 问题 2。`MiddleWarePresets.takePromiseResolve` 可以将一个异步方法返回 promise 的 resolve 值转换成新的 state ，我们可以利用它来把请求方法集成到模型方法中。

查看[MiddleWare 资源列表](https://github.com/filefoxper/agent-reducer/blob/master/documents/zh/api/middle_ware_presets.md)


[源码位置](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/useMiddleWare)

模型:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, State, Todo} from "@/type";
import {fetchTodoList} from "@/service";

const defaultState: State = {
    searchParams: {},
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0
};

export default class SimpleTodoList implements OriginAgent<State> {

    state = defaultState;

    changeSearchContent(content?: string): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, content}};
    };

    changeSearchPriorLevel(priorLevel?: PriorLevel): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, priorLevel}};
    }

    // 我们把修改列表数据和修改分页信息的方法合成到一个异步方法中，
    // 并通过'MiddleWarePresets.takePromiseResolve' 对 promise 的再加工特性
    // 将 promise 的 resolve 值变成最新的 state
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async fetchDataSource(currentPage: number, pageSize: number) {
        const {searchParams} = this.state;
        // 把查询条件转换成请求参数
        const fetchParams: FetchParams = {...searchParams, currentPage, pageSize};
        const {content, total} = await fetchTodoList(fetchParams);
        // 同时改变分页信息和列表数据
        return {...this.state, dataSource: content, total, currentPage, pageSize};
    }

}
```

页面:

```typescript
import React, {useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel} from "@/type";

export default function UseMiddleWare() {

    const {
        state,
        changeSearchContent,
        changeSearchPriorLevel,
        fetchDataSource,
    } = useAgentReducer(SimpleTodoList);

    // 通过使用 MiddleWarePresets.takePromiseResolve,
    // 我们让分页信息和列表数据同时被修改，并将请求放入了模型方法内，
    // 这对保证数据的一致性和模型的完整性是非常有利的
    const search = useCallback(async (currentPage: number = 1, pageSize: number = 10) => {
        try {
            await fetchDataSource(currentPage, pageSize);
        }catch (e) {
            alert(e.toString());
        }
    }, [state]);

    useEffect(() => {
        search(1, 10);
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    // 每次查询值有一次数据改变，所以只会引起一次 render.
    console.log('render...');
    return (
        <PageContent>
            <SearchContent>
                <label>content: </label>
                <ContentInput value={state.searchParams.content} onChange={changeSearchContent}/>
                <label>prior level: </label>
                <PriorLevelSelect value={state.searchParams.priorLevel} onChange={changeSearchPriorLevel}/>
                <Button type="primary" onClick={() => search(1, 10)}>submit</Button>
            </SearchContent>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination current={state.currentPage} total={state.total} pageSize={state.pageSize} onChange={search}/>
        </PageContent>
    );

}
```

上述代码中，我们使用了 `MiddleWarePresets.takePromiseResolve()` 将方法返回的 promise 对象的 resolve 值转换成了新的 state 数据。

现在我们的页面已经比之前有了很大的进步，接下我们可以通过拆分模型的方式来解决另一个问题。

## 拆分模型

在点击 search 按钮之前发起查询之前，当前显示查询条件不应参与分页查询，否则会对用户造成困扰。根据这条设计准则，我们需要把原页面模型拆分成连个模型。一个用于基本页面，它使用最后一次有效提交的条件进行查询；另一个用于实时修改查询条件数据，作为查询条件的显式处理模型。

[查看源码](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/splitModel)

模型:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList} from "@/service";

// 拆分出的查询条件显式模型
export class SearchParamsModel implements OriginAgent<SearchParams> {

    state: SearchParams = {};

    // 修改查询条件 'content'
    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    // 修改查询条件 priorLevel
    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    // 接收来自 'SimpleTodoList' 模型的生效查询条件，回滚显示条件为生效条件，
    // 这可以让页面中显示的查询条件和列表数据保持正确性。
    feedback(searchParams: SearchParams): SearchParams {
        return searchParams;
    }

}

const defaultState: State = {
    searchParams: {},
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0
};

export default class SimpleTodoList implements OriginAgent<State> {

    state = defaultState;

    // 我们将原来的共用查询方法拆分成两个调用当前方法的接口，
    // 这有利于保证事件处理接口的明确性，同时兼顾代码共享。
    // 因此这个非直接调用的方法被设定为 private 私有方法。
    // 注意： MiddleWare 只对 Agent 外部直接调用方法生效，
    // 因此，我们没必要继续在当前方法上添加 MiddleWare 了。
    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoList(fetchParams);
        // 复制查询条件可以让生效查询条件必然发生改变，
        // 而查询条件显示组件 'SearchParamComponent' ，
        // 可以通过监听生效查询条件的变化来回滚显示条件。
        return {searchParams:{...searchParams}, dataSource, currentPage, pageSize, total};
    }

    // 在直接使用方法上使用 MiddleWare
    // 分页查询接口
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async changePage(currentPage: number, pageSize: number=10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams, currentPage, pageSize);
    }

    // 在直接使用方法上使用 MiddleWare
    // 点击查询接口
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param, 1, 10);
    }

}
```

页面:

```typescript
import React, {memo, useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";

type SearchParamsProps = {
    // 来自 SimpleTodoList 模型的生效查询条件
    readonly searchParams: SearchParams,
    // 提交当前查询条件接口
    readonly onSubmit: (data: SearchParams) => any
}

// 我们已经拆分了模型，那么同样我们也可以根据模型来拆分组件，
// 当前组件为查询条件显示修改组件。
const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    useEffect(() => {
        // 每次生效查询条件改变后，都会替换显示条件。
        feedback(props.searchParams);
    }, [props.searchParams]);

    const handleSubmit = useCallback(() => {
        // 提交当前显示条件，用于查询生效。
        props.onSubmit(state);
    }, [state]);

    return (
        <SearchContent>
            <label>content: </label>
            <ContentInput value={state.content} onChange={changeSearchContent}/>
            <label>prior level: </label>
            <PriorLevelSelect value={state.priorLevel} onChange={changeSearchPriorLevel}/>
            <Button type="primary" onClick={handleSubmit}>submit</Button>
        </SearchContent>
    );
});

export default function SplitModel() {

    const {
        state,
        search,
        changePage
    } = useAgentReducer(SimpleTodoList);

    const submit = useCallback(async (searchParams: SearchParams) => {
        try {
            await search(searchParams);
        } catch (e) {
            alert(e.toString());
        }
    }, [state]);

    useEffect(() => {
        search();
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent searchParams={state.searchParams} onSubmit={submit}/>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination
                current={state.currentPage}
                total={state.total}
                pageSize={state.pageSize}
                onChange={changePage}
            />
        </PageContent>
    );

}
```

我们的查询页面目前已经能很好得工作起来了，当依然有优化空间。

## 使用 take latest MiddleWare

数据请求伴随着许多不确定性，比如网络延时等特殊情况，这导致请求响应并非一定按请求发送前后顺序返回。那可能会导致最新数据被早期触发请求响应覆盖的问题。这时，我们需要使用 `MiddleWarePresets.takeLatest` 来保证返回数据的正确性。

[查看 MiddleWare 资源列表](https://github.com/filefoxper/agent-reducer/blob/master/documents/zh/api/middle_ware_presets.md)

[源码位置](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/takeLatest)


模型:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList, fetchTodoListWithDelay} from "@/service";

export class SearchParamsModel implements OriginAgent<SearchParams> {

    state: SearchParams = {};

    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    feedback(searchParams: SearchParams): SearchParams {
        return searchParams;
    }

}

const defaultState: State = {
    searchParams: {},
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0
};

export default class SimpleTodoList implements OriginAgent<State> {

    state = defaultState;
    
    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        // 当请求页码为第 2 页时，我们制造一个 3000 毫秒 的人为延时，
        // 在这段时间内，继续翻页，最新页的数据可能会被后响应的第 2 页数据覆盖。
        const {content: dataSource, total} = await fetchTodoListWithDelay(fetchParams, currentPage === 2 ? 3000 : 0);
        return {searchParams: {...searchParams}, dataSource, currentPage, pageSize, total};
    }

    @middleWare(MiddleWarePresets.takePromiseResolve())
    async changePage(currentPage: number, pageSize: number = 10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams, currentPage, pageSize);
    }

    @middleWare(MiddleWarePresets.takePromiseResolve())
    async search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param, 1, 10);
    }

}
```

页面:

```typescript
import React, {memo, useCallback, useEffect, useState} from 'react';
import {RunEnv, useAgentReducer, useMiddleWare} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets} from "agent-reducer";

type SearchParamsProps = {
    readonly searchParams: SearchParams,
    readonly onSubmit: (data: SearchParams) => any
}

const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    useEffect(() => {
        feedback(props.searchParams);
    }, [props.searchParams]);

    const handleSubmit = useCallback(() => {
        props.onSubmit(state);
    }, [state]);

    return (
        <SearchContent>
            <label>content: </label>
            <ContentInput value={state.content} onChange={changeSearchContent}/>
            <label>prior level: </label>
            <PriorLevelSelect value={state.priorLevel} onChange={changeSearchPriorLevel}/>
            <Button type="primary" onClick={handleSubmit}>submit</Button>
        </SearchContent>
    );
});

export default function TakeLatest() {

    const agent = useAgentReducer(SimpleTodoList);

    const {
        state,
        search,
        // 直接调用翻页，可能出现最新数据被早期触发页面覆盖的现象
        changePage
    } = agent;

    // 通过使用 useMiddleWare 可在一个`Agent`复制版上添加 MiddleWarePresets.takeLatest()，
    // 这个 MiddleWare 集成了 MiddleWares.takePromiseResolve()，
    // 并可以保证最后一次触发产生的修改，不被早期触发产生的延迟修改覆盖掉。
    // 所以在使用当前 MiddleWare 后，第 2 页的延迟响应将不再能影响当前 state 数据。
    const {changePage:changePageLatest} = useMiddleWare(agent,MiddleWarePresets.takeLatest());

    // submit for searching
    const submit = useCallback(async (searchParams: SearchParams) => {
        try {
            await search(searchParams);
        } catch (e) {
            alert(e.toString());
        }
    }, [state]);

    useEffect(() => {
        search();
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent searchParams={state.searchParams} onSubmit={submit}/>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination
                current={state.currentPage}
                total={state.total}
                pageSize={state.pageSize}
                onChange={changePageLatest}
            />
        </PageContent>
    );

}
```

## 使用模型共享 

模型共享特性是 `agent-reducer@3.2.0` 新加入的特性。该特性声明为所有建立在同一`对象模型`上的 `Agent` 代理共享 state 数据更新。

也就是说，不同组件中的`Agent`只要使用了同一个`对象化的模型`，那么它们的数据更改与相关的组件渲染就是同步的。这与 redux 的 subscribe 行为非常类似。

通过利用这条特性，我们可以让组件更干净，更简单。我们将通过模型共享原则去除 `SearchParamComponent` 中用于数据传递的 props 属性。

[源码位置](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/newFeatures)

模型:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList, fetchTodoListWithDelay} from "@/service";

const defaultSearchParams={};

export class SearchParamsModel implements OriginAgent<SearchParams> {

    state: SearchParams = defaultSearchParams;

    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    feedback(searchParams: SearchParams): SearchParams {
        return searchParams;
    }

}

const defaultState: State = {
    searchParams: defaultSearchParams,
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0
};

export default class SimpleTodoList implements OriginAgent<State> {

    state = defaultState;

    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoList(fetchParams);
        // 我们不再使用监听生效查询条件改变的方式来回滚显示查询条件，
        // 利用模型共享也可以获取更好的开发体验。
        return {searchParams, dataSource, currentPage, pageSize, total};
    }

    @middleWare(MiddleWarePresets.takePromiseResolve())
    async changePage(currentPage: number, pageSize: number = 10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams, currentPage, pageSize);
    }

    @middleWare(MiddleWarePresets.takePromiseResolve())
    async search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param, 1, 10);
    }

}
```

页面:

```typescript
import React, {memo, useCallback, useEffect, useState} from 'react';
import {RunEnv, useAgentReducer, useMiddleWare} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets} from "agent-reducer";

// 查询条件共享模型，必须是 object
const searchParamsModel = new SearchParamsModel();

// 页面共享模型，必须是 object
const simpleTodoList = new SimpleTodoList();

const SearchParamComponent = memo(() => {

    const {state, changeSearchContent, changeSearchPriorLevel,feedback} = useAgentReducer(searchParamsModel);

    // 通过模型共享我们可以直接在查询条件显示组件中创建一个页面模型代理
    const {search} = useAgentReducer(simpleTodoList);

    const handleSubmit = useCallback(async () => {
        // 通过模型共享，
        // 我们可以在查询条件组件中调用 search 方法更新页面 `Agent` 的 state 数据，
        // 这样，我们就不必再使用 props 传入一个 onSubmit 方法了
        search(state);
    }, [state]);

    return (
        <SearchContent>
            <label>content: </label>
            <ContentInput value={state.content} onChange={changeSearchContent}/>
            <label>prior level: </label>
            <PriorLevelSelect value={state.priorLevel} onChange={changeSearchPriorLevel}/>
            <Button type="primary" onClick={handleSubmit}>submit</Button>
        </SearchContent>
    );
});

export default function NewFeatures() {

    // 模型共享
    const {feedback} = useAgentReducer(searchParamsModel);

    // 模型共享
    const agent = useAgentReducer(simpleTodoList);

    const {
        state,
        search,
    } = agent;

    const {changePage: changePageLatest} = useMiddleWare(agent, MiddleWarePresets.takeLatest());

    useEffect(() => {
        search();
    }, []);

    // 翻页处理
    const handleChangePage = useCallback(async (currentPage: number, pageSize: number = 10) => {
        // 当前生效查询条件对显示查询条件的回滚通常发生在翻页等，非点击查询按钮的查询行为中，
        // 通过模型共享，直接调用共享 `Agent` 代理的方法就可以了
        feedback(state.searchParams);
        await changePageLatest(currentPage, pageSize);
    }, [state]);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent/>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination
                current={state.currentPage}
                total={state.total}
                pageSize={state.pageSize}
                onChange={handleChangePage}
            />
        </PageContent>
    );

}
```

利用好`模型共享`特性可以让我们的代码更简单更清晰。