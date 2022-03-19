# Tutorial

## Intro

In this tutorial, we will build a searching page model, and show how this model works in react.

You can [download](https://github.com/filefoxper/use-agent-reducer/tree/master/example) our example, and run it as a local website app.

* [Search page model](/tutorial?id=search-page-model)
* [Use MiddleWare](/tutorial?id=use-middleware)
* [Split model](/tutorial?id=split-model)
* [Use take latest MiddleWare](/tutorial?id=use-take-latest-middleware)
* [Use model sharing](/tutorial?id=use-model-sharing)

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

Now, we can build a `SimpleTodoList` model, see code below. It can change search params, data source, page infos. When the request of todo list responds, we can use method `changeDataSource` to change `state.dataSource`, and we also need method `changePageInfo` to change the page infos in state.

check [source code](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/simpleSearch)

model:

```typescript
import {Model} from "agent-reducer";
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
export default class SimpleTodoList implements Model<State> {
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

1. The request function is called out of a model, it makes model reusing difficult. 
2. change state twice is not good. If we change state twice in a pure react event callback, state may be override by the last change time. Besides, it is not good for data change consistency.
3. The search params is a part of model, it makes state path too deep, when we want to change search params, we need to process state merge twice. And another problem is it skip the submit action which is very popular in a classify searching page design. 

We will recode this model to resolve these problems.

## Use MiddleWare

Now, let us resolve problem 1 and 2 first. We can use `MiddleWarePresets.takePromiseResolve` to make request function be called inside model.

Check MiddleWare list from `agent-reducer` api [MiddleWares](https://filefoxper.github.io/agent-reducer/#/api?id=middlewares) and [MiddleWarePresets](https://filefoxper.github.io/agent-reducer/#/api?id=middlewarepresets).

check [source code](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/useMiddleWare)

model:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, Model} from "agent-reducer";
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
export default class SimpleTodoList implements Model<State> {
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

In the code above, we used `MiddleWarePresets.takePromiseResolve()` for taking a promise resolve data as a new state of `Agent`. 

It is better than the basic example, let us resolve another problem。

## Split model

Before click the submit button, search params for sending request should not be changed. So we need to split model `SimpleTodoList` into two parts, one for keeping search params from a newest submit action, and another for managing search params real time changes. 

check [source code](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/splitModel)

model:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, Model} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList} from "@/service";

// split search params change out
export class SearchParamsModel implements Model<SearchParams> {

    state: SearchParams = {};

    // method for changing param 'content'
    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    // method for changing param priorLevel
    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    // method for accept search params from 'SimpleTodoList' model
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
export default class SimpleTodoList implements Model<State> {
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
    // valid searchParams for searching from SimpleTodoList
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

Now, this searching page can work well, let us add more things to make the models much better.

## Use take latest MiddleWare

Sometimes, http request may be delayed, this may cause the newest dataSource be override by an early request response. We can use `MiddleWarePresets.takeLatest` to resolve this problem.

Check MiddleWare list from `agent-reducer` api [MiddleWares](https://filefoxper.github.io/agent-reducer/#/api?id=middlewares) and [MiddleWarePresets](https://filefoxper.github.io/agent-reducer/#/api?id=middlewarepresets).


check [sourceCode](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/takeLatest)


model:

```typescript
import {middleWare, MiddleWarePresets, MiddleWares, Model} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList, fetchTodoListWithDelay} from "@/service";

export class SearchParamsModel implements Model<SearchParams> {

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
export default class SimpleTodoList implements Model<State> {
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
        // when currentPage is 2, we make a delay 3000 ms,
        // so if you quickly change page to 3 during 3000 ms,
        // the newest dataSource of page 3 should be covered by dataSource of page 2
        changePage
    } = agent;

    // MiddleWarePresets.takeLatest() has chained with a MiddleWares.takePromiseResolve()
    // useMiddleWare create a copy version from 'agent',
    // and its MiddleWare will cover MiddleWare from decorators in 'Model'.
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

## Use model sharing 

Model sharing is a new feature from `agent-reducer@3.2.0`. It declares every `Agent` bases on a same model object shares state updating with each other. 

That means we can create `Agents` base on a same model object in different react components, and they can update state synchronously. It is similar with the subscribe system in redux.

With this feature we can rebuild `SearchParamComponent` without props for model communication. 

You can learn model sharing by following the [official document](https://filefoxper.github.io/agent-reducer/#/feature?id=model-sharing).

check [source code](https://github.com/filefoxper/use-agent-reducer/blob/master/example/src/newFeatures)

model:

```typescript
iimport {middleWare, MiddleWarePresets, MiddleWares, Model} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList, fetchTodoListWithDelay} from "@/service";

const defaultSearchParams={};

export class SearchParamsModel implements Model<SearchParams> {
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
export default class SimpleTodoList implements Model<State> {
    // set default state
    state = defaultState;

    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoList(fetchParams);
        // Copy searchParams here
        return {searchParams:{...searchParams}, dataSource, currentPage, pageSize, total};
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

```typescript
import React, {memo, useCallback, useEffect} from 'react';
import {RunEnv, useAgentReducer, useMiddleWare, useAgentMethods, useAgentSelector} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets, weakSharing} from "agent-reducer";

// every `Agent` bases on a same model object,
// shares state updating with each other.
// the model created by `agent-reducer` API `weakSharing`,
// often be reset back, if there is no living `Agent` built on it.
const searchParamsModel = weakSharing(() => SearchParamsModel);

const simpleTodoList = weakSharing(() => SimpleTodoList);

const SearchParamComponent = memo(() => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(searchParamsModel.current);

    // `Agent` bases on object simpleTodoList,
    // If we use class `SimpleTodoList` as a model,
    // `useAgentReducer` should create a private model object inside,
    // and then, no state updating can be shared now.
    // So, model sharing only works on 'Agents' base on a same model object.
    // API `useAgentMethods` can optimize our component,
    // it never leads its consumer (component) rerender.
    const {search} = useAgentMethods(simpleTodoList.current);

    // API `useAgentSelector` can optimize our component,
    // it only leads its consumer (component) rerender, when the extracted data changes.
    const searchParams = useAgentSelector(simpleTodoList.current, ({searchParams}) => searchParams);

    useEffect(() => {
        feedback(searchParams);
    }, [searchParams]);

    const handleSubmit = useCallback(async () => {
        // submit current searchParams with model object `simpleTodoList`
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

    // `Agent` bases on model `simpleTodoList`
    const agent = useAgentReducer(simpleTodoList.current);

    const {
        state,
        search,
    } = agent;

    const {changePage: changePageLatest} = useMiddleWare(agent, MiddleWarePresets.takeLatest());

    useEffect(() => {
        search();
    }, []);

    // handle page change
    const handleChangePage = useCallback(async (currentPage: number, pageSize: number = 10) => {
        // feedback searchParams with model object `searchParamsModel`.
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

`Agents` base on a same model object can update state synchronously. Using this feature of `agent-reducer` can make your code more simple. And use API [useAgentSelector](/api?id=useagentselector) and [useAgentMethods](/api?id=useagentmethods) can make your component render more less with `agent-reducer` model sharing.

You can do more things to make a search page model better.

## Use agent effect

If you need effect API of `agent-reducer` directly, you can refer to [document](https://filefoxper.github.io/agent-reducer/#/guides?id=effect), if you are more interest to [effect decorator](https://filefoxper.github.io/agent-reducer/#/guides?id=effect-decorator) you can take look at the guids of agent-reducer. But, here we just introduce API [useAgentEffect](/api?id=useagenteffect) .

how to add a agent effect to model in react?

```typescript
useAgentEffect((prevState, currentState, methodName)=>{
    // `prevState` is the model state before this change.
    // `currentState` is the model state right now.
    // `methodName` is the name of model or agent method
    // which leads this change.
    // If this effect is caused by effect mount,
    // param `methodName` is `null`.
    ......
    // return function destroy() {
    //   ......
    // }
    // if returns a function, 
    // this function will be called before effect callback triggered again. 
    // It is often used for clean or destroy something.
},model, ...methods);
```

We can use this API to try `SearchParamsModel.feedback`.

```typescript
import React, {memo, useCallback, useEffect} from 'react';
import {
    useAgentReducer,
    useMiddleWare,
    useAgentMethods,
    useAgentSelector,
    useModelProvider,
    useModel, useAgentEffect
} from "./ar";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {PriorLevel, SearchParams, State} from "@/type";

const SearchParamComponent = memo(() => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    const todoListModel = useModel(SimpleTodoList);

    const {search} = useAgentMethods(todoListModel);

    // In fact, only the `todoListModel.changePage` action
    // can lead the `feedback` happen.
    // So, we can use `useAgentEffect` to listen 
    // the `todoListModel.changePage` method, 
    // and call `feedback`.
    useAgentEffect<State>((prevState, currentState) => {
        feedback(currentState.searchParams);
    }, todoListModel, todoListModel.changePage);

    const handleSubmit = useCallback(async () => {
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

const Search = memo(()=>{
    const SearchProvider = useModelProvider(new SearchParamsModel());
    return (
        <SearchProvider>
            <SearchParamComponent/>
        </SearchProvider>
    );
})

export default function Effect() {

    const todoListModel = new SimpleTodoList();

    const agent = useAgentReducer(todoListModel);

    const TodoListProvider = useModelProvider(todoListModel);

    const {
        state,
        search,
        changePage
    } = agent;

    useEffect(() => {
        search();
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <TodoListProvider>
                <Search/>
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
            </TodoListProvider>
        </PageContent>
    );

}
```

useAgentEffect API 是为了解决一些 useEffect 难以解决问题而创造的，例如该接口提供了 `prevState`, `currentState` 对比机制，再如，useAgentEffect 可监听特定方法产生的 state 变化并做出反应。请悬着合适的时机使用该 API，切勿滥用。