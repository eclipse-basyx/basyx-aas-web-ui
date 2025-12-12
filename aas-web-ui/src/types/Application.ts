export interface SnackbarType {
    status: boolean;
    timeout?: number;
    color?: string;
    btnColor?: string;
    text?: string;
    baseError?: string;
    extendedError?: string;
    actionText?: string;
    actionCallback?: () => void | Promise<void>;
}

export interface AutoSyncType {
    state: boolean;
    interval: number;
}

export interface StatusCheckType {
    state: boolean;
    interval: number;
}

export interface PlatformType {
    android: boolean;
    chrome: boolean;
    cordova: boolean;
    edge: boolean;
    electron: boolean;
    firefox: boolean;
    ios: boolean;
    linux: boolean;
    mac: boolean;
    opera: boolean;
    ssr: boolean;
    touch: boolean;
    win: boolean;
}

export interface PluginType {
    name: string;
    semanticId: string;
}
