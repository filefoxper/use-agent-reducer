import {ClassifyQueryState, Form, Position, Record, RequestParams} from "./type";
import {OriginAgent} from "agent-reducer";
import {fetchData} from "./service";

const getDefaultClassifyQueryState = (): ClassifyQueryState => ({
    form: {
        name: '',
        position: Position.USER
    },
    loading: false,
    list: undefined,
    page: 1,
    total: 0
});

export class ClassifyQueryAgent implements OriginAgent<ClassifyQueryState> {

    effectiveForm: Form = getDefaultClassifyQueryState().form;

    state: ClassifyQueryState = getDefaultClassifyQueryState();

    private handleFormChange(formLike: { name?: string, position?: Position }) {
        const {form} = this.state;
        const newForm = {...form, ...formLike};
        return {...this.state, form: newForm};
    }

    private loadingBeforeQuery() {
        return {...this.state, loading: true};
    }

    //this function return a state, and it will dispatch a next state to change the state in store or something remains reducer state.
    public handleFormNameChange(name: string) {
        //before this.handleFormChange running, the agent has hold a parent dispatch function for it,
        // so this.handleFormChange here will not run dispatch. it just compute the next state for it's parent 'handleFormNameChange'
        this.handleFormChange({name});
    }

    public handleFormPositionChange(position: Position) {
        this.handleFormChange({position});
    }

    private handleResultChange(list: Array<Record>, page: number, total: number) {
        return {...this.state, loading: false, list, page, total};
    }

    //this function returns a promise, so it will not be a dispatch function, but it can deploy dispatch functions to change next state.
    public async handlePageChange(page: number) {
        this.loadingBeforeQuery();
        const requestParams: RequestParams = {...this.effectiveForm, page, size: 10};
        const {list, page: p, total} = await fetchData(requestParams);
        this.handleResultChange(list, p, total);
    }

    //takeLatest need a promise return function, so we should return result of handleQueryClick
    public handleQueryClick() {
        this.effectiveForm = this.state.form;
        return this.handlePageChange(1);
    }

}