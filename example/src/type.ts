export enum Position {
    ADMIN = 'admin',
    MASTER = 'master',
    USER = 'user'
}

export interface Record {
    id: number,
    name: string,
    position: Position
}

export interface Form {
    name: string,
    position: Position
}

export interface ClassifyQueryState {
    form: Form,
    loading: boolean,
    list?: Array<Record>,
    page: number,
    size: number
}

export interface RequestParams extends Form {
    page: number,
    size: number
}

export interface RequestResult {
    list: Array<Record>,
    page: number,
    size: number
}