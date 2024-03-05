export declare enum SupportedProducts {
    PREP_PORTAL = "1",
    INSTRUCTOR_PORTAL = "2",
    UNIFIED_CHECKOUT = "3",
    COLLEGE_BRIDGE = "4",
    LQ = "5",
    SWA = "6",
    SALES_PORTAL = "7"
}
export declare enum SupportedServerTypes {
    PREP = "1",
    AOD = "2",
    INSTRUCTOR = "3",
    PAY = "4",
    SALES = "5",
    SWA = "6",
    COLLEGE_BRIDGE = "7"
}
export type LogApiPayload = {
    api_name: string;
    product: string;
    fetched_from: string;
    server_type: SupportedServerTypes;
    session_id: string;
    browser: string;
    os: string;
    lead_id?: string;
    customer_id?: string;
    init_time_stamp: string;
    response_time: number;
    status: number;
};
export type TrackParams = Omit<LogApiPayload, "product" | "browser" | "os" | "fetched_from" | "session_id" | "init_time_stamp"> & {
    init_time: Date;
};
export type TrackPromiseParams = Pick<LogApiPayload, "api_name" | "server_type"> & {
    method: string;
    filterKeys?: string[];
    filterFunction?: (key: string, value: unknown) => unknown;
};
type RTKMETA = {
    data: unknown;
    meta: {
        request: Request;
        response: Response;
    };
};
type RTKResponseSuccess = RTKMETA & {
    data: {
        status: number;
        data: unknown;
    };
};
type RTKResponseError = RTKMETA & {
    error: {
        status: number;
        data: unknown;
    };
};
type RTKResponse = RTKResponseSuccess | RTKResponseError;
export type PromiseResponse = Response | RTKResponse;
export declare class Logger {
    private static LOGGER_KEY;
    private static instance;
    private responseMap;
    private product;
    private browser;
    private os;
    private session_id;
    private customer_id;
    private lead_id;
    private enabled;
    private constructor();
    static getInstance(product: SupportedProducts, enabled?: boolean): Logger;
    private createUUID;
    private initSession;
    clearSession(): void;
    setId({ customer_id, lead_id, }: {
        customer_id?: string;
        lead_id?: string;
    }): void;
    enableLogging(): void;
    disableLogging(): void;
    trackPromise(promise: Promise<PromiseResponse>, { filterKeys, filterFunction, method, api_name, ...payload }: TrackPromiseParams): Promise<void>;
    private track;
}
export declare function extractBrowserInfo(): {
    os: string;
    browser: string;
    version: string;
};
export {};
