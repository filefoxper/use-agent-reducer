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