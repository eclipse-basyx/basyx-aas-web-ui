export type LangString = {
    language?: string;
    text?: string;
};

export type SubmodelElementLike = {
    id?: string;
    idShort?: string;
    path?: string;
    modelType?: string;
    description?: unknown;
    contentType?: string;
    value?: unknown;
    [key: string]: unknown;
};

export type DocumentLike = SubmodelElementLike & {
    documentIds?: SubmodelElementLike[];
    documentVersionInfo?: SubmodelElementLike[];
};

export type FileTab = 'preview' | 'digital';
