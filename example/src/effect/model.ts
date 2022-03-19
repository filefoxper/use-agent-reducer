import {effect, middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
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

class SimpleTodoList implements OriginAgent<State> {

    state:State = defaultState;

    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoList(fetchParams);
        return {searchParams:{...searchParams}, dataSource, currentPage, pageSize, total};
    }

    @middleWare(MiddleWarePresets.takeLatest())
    changePage(currentPage: number, pageSize: number = 10): Promise<State> {
        const {searchParams} = this.state;
        return this.fetchDataSource(searchParams,currentPage,pageSize);
    }

    @middleWare(MiddleWarePresets.takeLatest())
    search(searchParams?: SearchParams): Promise<State> {
        const param = searchParams || this.state.searchParams;
        return this.fetchDataSource(param,1,10);
    }

}

export default SimpleTodoList;