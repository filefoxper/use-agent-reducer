# Tutorial

## Intro

In this tutorial, we will build a searching page model, and show how this model works in react.

You can [download](https://github.com/filefoxper/use-agent-reducer/tree/master/example) our example, and run it as a local website app.

* [Search page model](/tutorial?id=search-page-model)
* [Use MiddleWare](/tutorial?id=use-middleware)
* [split model](/tutorial?id=split-model)
* [use take latest MiddleWare](/tutorial?id=use-take-latest-middleware)

## Search page model

We are going to build a todo list searching page model. Before start, let us list the model state:

1. search params
2. data source for a table
3. page infos

So, the model state should look like:
```typescript
// prior : normal, emergency
export enum PriorLevel {
    NORMAL,
    EMERGENCY
}

// data source model
export interface Todo {
    // what todo
    readonly content:string,
    readonly createTime:string,
    // prior
    readonly priorLevel:PriorLevel
}

// search params
export interface SearchParams {
    // for matching property 'content' 
    readonly content?:string,
    // for matching property 'priorLevel' 
    readonly priorLevel?:PriorLevel
}

// state should looks like
export interface State {
    // search params
    readonly searchParams: SearchParams,
    // data source
    readonly dataSource:Array<Todo>|null,
    // page infos
    readonly currentPage:number,
    readonly pageSize:number,
    readonly total:number,
}
```
Now, we can build a 'TodoList' model, see code below. It can change search params, data source, page infos. When the request of todo list responds, we can use method `changeDataSource` to change `state.dataSource`, and we also need method `changePageInfo` to change the page infos in state.

check [sourceCode](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/simpleSearch)

model:

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
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // set default state
    state = defaultState;

    // method for changing param 'searchParams.content'
    changeSearchContent(content?: string): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, content}};
    };

    // method for changing param 'searchParams.priorLevel'
    changeSearchPriorLevel(priorLevel?: PriorLevel): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, priorLevel}};
    }

    // method for changing page infos
    changePageInfo(currentPage: number, pageSize: number, total: number): State {
        return {...this.state, currentPage, pageSize, total};
    }

    // method for changing data source
    changeDataSource(dataSource: Array<Todo>): State {
        return {...this.state, dataSource};
    }

}
```

page:

```tsx
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

    // TODO problem 1: searchParams is part of model state,
    // when Pagination call it, state submit will be ignore,
    // every change about search params will participate in the page change searching.
    const search = useCallback(async (currentPage: number = 1, pageSize: number = 10) => {
        const {searchParams} = state;
        // TODO problem 2: fetchTodoList should be a part of model
        const {content, total} = await fetchTodoList({...searchParams, currentPage, pageSize});
        // TODO problem 3: change state twice is not good,
        // if we change state twice in a pure react event callback,
        // state may be override by the last change time.
        // Besides, it is not good for data change consistency.
        changeDataSource(content); // every change will cause a render...
        changePageInfo(currentPage, pageSize, total); // every change will cause a render...
    }, [state]);

    useEffect(() => {
        search(1, 10);
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    // there are two state change happens in search callback,
    // so, the console.log print twice after we call the search function
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

It can work, but still has problems:

1. The search params is a part of model, it makes state path too deep, when we want to change search params, we need to process state merge twice. And another problem is it skip the submit action which is very popular in a classify searching page design. 
2. The request function is called out of a model, it makes model reusing difficult. 
3. change state twice is not good. If we change state twice in a pure react event callback, state may be override by the last change time. Besides, it is not good for data change consistency.

We will recode this model to resolve these problems.

## Use MiddleWare

Now, let us resolve problem 2 and 3 first. We can use `MiddleWarePresets.takePromiseResolve` to make request function be called inside model.

check [sourceCode](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/useMiddleWare)

model:

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

/**
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // set default state
    state = defaultState;

    // method for changing param 'searchParams.content'
    changeSearchContent(content?: string): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, content}};
    };

    // method for changing param 'searchParams.priorLevel'
    changeSearchPriorLevel(priorLevel?: PriorLevel): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, priorLevel}};
    }

    // method for changing dataSource and page infos once
    // we can use 'MiddleWarePresets.takePromiseResolve' to reproduce a promise resolve data be next state,
    // so we can keep request function calling inside model
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async fetchDataSource(currentPage: number, pageSize: number) {
        const {searchParams} = this.state;
        // change searchParams to fetch params
        const fetchParams: FetchParams = {...searchParams, currentPage, pageSize};
        const {content, total} = await fetchTodoList(fetchParams);
        // change page infos, dataSource and searchParams once
        return {...this.state, dataSource: content, total, currentPage, pageSize};
    }

}
```

page:

```tsx
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

    // use MiddleWarePresets.takePromiseResolve,
    // we put fetching request inside the model,and make state change once,
    // it is good for keeping data consistency
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

    // there are one state change happens in search callback,
    // so, the console.log print once after we call the search function
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

We use api `middleWare` to add `MiddleWarePresets.takePromiseResolve()` for a promise state reproducing, and make the `fetchDataSource` method to be an `async` method, so we can set page info and data source into state together after request responding. 

It is better than the basic example, let us resolve another problem。

## split model

Before submit, search params in main model (`TodoList`) should not be changed, the only way to change main model (`TodoList`) search params is submit. And after every dataSource fetching happens, the search params in main model (`TodoList`) should be feed back to the search params model (`SearchParamsModel`), then users can check a correct search params with newest dataSource.

check [sourceCode](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/splitModel)

model:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList} from "@/service";

// split search params change out
export class SearchParamsModel implements OriginAgent<SearchParams> {

    state: SearchParams = {};

    // method for changing param 'content'
    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    // method for changing param priorLevel
    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    // method for accept search params from 'TodoList' model
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

/**
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // set default state
    state = defaultState;

    // the method fetchDataSource is a common method
    // middleWare only works with method which is called from 'Agent',
    // so, you should add middleWare directly on those methods,
    // which will be called directly from 'Agent'.
    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        // change searchParams to fetch params
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoList(fetchParams);
        // change page infos, dataSource and searchParams once.
        // copy searchParams can make state.searchParams change,
        // and the 'SearchParamComponent' can listen it for a feedback.
        return {searchParams:{...searchParams}, dataSource, currentPage, pageSize, total};
    }

    // split method fetchDataSource as a common method for changePageInfo and submit.
    // this method should works with a page navigation
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async changePage(currentPage: number, pageSize: number=10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams, currentPage, pageSize);
    }

    // this method should works with a search button
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param, 1, 10);
    }

}
```

page:

```tsx
import React, {memo, useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";

type SearchParamsProps = {
    // valid searchParams for searching from TodoList
    readonly searchParams: SearchParams,
    // submit current searchParams,
    // and make it valid for searching.
    readonly onSubmit: (data: SearchParams) => any
}

// we have split model SearchParamsModel out,
// so we can split the components about it out too.
const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    useEffect(() => {
        // after the dataSource updates by fetching request,
        // the valid searchParams in TodoList state,
        // should feedback, and clear the dirty changes.
        feedback(props.searchParams);
    }, [props.searchParams]);

    const handleSubmit = useCallback(() => {
        // submit current searchParams,
        // and make it valid for searching.
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

    // use MiddleWarePresets.takePromiseResolve,
    // we put fetching request inside the model,and make state change once,
    // it is good for keeping data consistency
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

Ok, at this time, our model can work well, let us add more things to make the models much better.

## use take latest MiddleWare

Sometimes, a remote fetching service may be delayed, this may causes the newest dataSource be override by an early dataSource fetching. And we will use `MiddleWarePresets.takeLatest` to resolve this problem.

check [sourceCode](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/takeLatest)

model:

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

/**
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // set default state
    state = defaultState;
    
    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        // make a 3000 ms delay when currentPage is 2,
        // so if you change page again during 3000 ms immediately,
        // dataSource of page 3 may be override by dataSource of page 2
        const {content: dataSource, total} = await fetchTodoListWithDelay(fetchParams, currentPage === 2 ? 3000 : 0);
        return {searchParams: {...searchParams}, dataSource, currentPage, pageSize, total};
    }

    // this method should works with a page navigation
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async changePage(currentPage: number, pageSize: number = 10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams, currentPage, pageSize);
    }

    // this method should works with a search button
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param, 1, 10);
    }

}
```

page:

```tsx
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
        // when currentPage is 2, we make a delay 3000 ms,
        // so if you quickly change page to 3 during 3000 ms,
        // the newest dataSource of page 3 should be covered by dataSource of page 2
        changePage
    } = agent;

    // MiddleWarePresets.takeLatest() has chained with a MiddleWares.takePromiseResolve()
    // useMiddleWare create a copy version from 'agent',
    // and its MiddleWare will cover MiddleWare from decorators in 'OriginAgent'.
    // when currentPage is 2, we make a delay 3000 ms,
    // so if you quickly change page to 3 during 3000 ms,
    // the newest dataSource of page 3 should be covered by dataSource of page 2,
    // but MiddleWarePresets.takeLatest can keep the newest dataSource of page 3.
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

## New features

We pass a valid search params object from main component to `SearchParamComponent`, and the `SearchParamComponent` watch it for updating, it is a conventional usage. But we can do this more easy.

There are some good feature from `agent-reducer@3.2.0`, we can use it to make a state updating synchronous model object, we can use it as a flexible redux.

check [sourceCode](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/newFeatures)

model:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList, fetchTodoListWithDelay} from "@/service";

const defaultSearchParams={};

export class SearchParamsModel implements OriginAgent<SearchParams> {
    // set default state
    state: SearchParams = defaultSearchParams;

    // method for changing param 'content'
    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    // method for changing param priorLevel
    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    // method for accept search params from 'TodoList' model
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

/**
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // set default state
    state = defaultState;

    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoList(fetchParams);
        // we do not copy searchParams here,
        // we can use new feature of 'agent-reducer@3.2.0' to update state synchronously in component.
        return {searchParams, dataSource, currentPage, pageSize, total};
    }

    // this method should works with a page navigation
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async changePage(currentPage: number, pageSize: number = 10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams, currentPage, pageSize);
    }

    // this method should works with a search button
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param, 1, 10);
    }

}
```

page:

```tsx
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
    // submit current searchParams,
    // and make it valid for searching.
    readonly onSubmit: (data: SearchParams) => any
}

// We can use new feature of 'agent-reducer@3.2.0' to update state synchronously.
// `Agents` based on a same model object can updating state synchronously.
const searchParamsModel = new SearchParamsModel();

const simpleTodoList = new SimpleTodoList();

const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel} = useAgentReducer(searchParamsModel);

    // `Agents` based on a same model object can updating state synchronously.
    const {search}=useAgentReducer(simpleTodoList);

    const handleSubmit = useCallback(() => {
        // submit current searchParams,
        // and make it valid for searching.
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

    const searchParamAgent = useAgentReducer(searchParamsModel);

    const agent = useAgentReducer(simpleTodoList);

    const {
        state,
        search,
    } = agent;

    const {changePage: changePageLatest} = useMiddleWare(agent, MiddleWarePresets.takeLatest());

    // submit
    const submit = useCallback(async (params: SearchParams) => {
        // `Agents` based on a same model object can updating state synchronously.
        searchParamAgent.feedback(params);
        try {
            await search(params);
        } catch (e) {
            alert(e.toString());
        }
    }, []);

    useEffect(() => {
        search();
    }, []);

    // handle page change
    const handleChangePage = useCallback(async (currentPage: number, pageSize: number = 10) => {
        // `Agents` based on a same model object can updating state synchronously.
        searchParamAgent.feedback(state.searchParams);
        await changePageLatest(currentPage, pageSize);
    }, [state]);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent onSubmit={submit}/>
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

`Agents` based on a same model object can updating state synchronously. Using this feature of `agent-reducer` can make your code more simple.

You can do more things to make a search page model better.