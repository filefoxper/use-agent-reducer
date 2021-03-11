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