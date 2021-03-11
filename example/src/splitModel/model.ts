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