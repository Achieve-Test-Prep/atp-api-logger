"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBrowserInfo = exports.Logger = exports.SupportedServerTypes = exports.SupportedProducts = void 0;
var SupportedProducts;
(function (SupportedProducts) {
    SupportedProducts["PREP_PORTAL"] = "1";
    SupportedProducts["INSTRUCTOR_PORTAL"] = "2";
    SupportedProducts["UNIFIED_CHECKOUT"] = "3";
    SupportedProducts["COLLEGE_BRIDGE"] = "4";
    SupportedProducts["LQ"] = "5";
    SupportedProducts["SWA"] = "6";
    SupportedProducts["SALES_PORTAL"] = "7";
})(SupportedProducts || (exports.SupportedProducts = SupportedProducts = {}));
var SupportedServerTypes;
(function (SupportedServerTypes) {
    SupportedServerTypes["PREP"] = "1";
    SupportedServerTypes["AOD"] = "2";
    SupportedServerTypes["INSTRUCTOR"] = "3";
    SupportedServerTypes["PAY"] = "4";
    SupportedServerTypes["SALES"] = "5";
    SupportedServerTypes["SWA"] = "6";
    SupportedServerTypes["COLLEGE_BRIDGE"] = "7";
})(SupportedServerTypes || (exports.SupportedServerTypes = SupportedServerTypes = {}));
class Logger {
    constructor(product, enabled = false) {
        this.responseMap = {};
        const browserInfo = extractBrowserInfo();
        this.product = product;
        this.browser = browserInfo
            ? `${browserInfo.browser}|${browserInfo.version}`
            : "";
        this.os = browserInfo.os || "";
        this.session_id = "";
        this.enabled = enabled;
        this.initSession();
    }
    static getInstance(product, enabled = false) {
        if (!Logger.instance) {
            Logger.instance = new Logger(product, enabled);
        }
        return Logger.instance;
    }
    // eslint-disable-next-line class-methods-use-this
    createUUID() {
        let dt = new Date().getTime();
        const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
        return uuid;
    }
    initSession() {
        const currentSessionId = localStorage.getItem(Logger.LOGGER_KEY);
        if (currentSessionId) {
            this.session_id = currentSessionId;
            return;
        }
        this.session_id = this.createUUID();
        localStorage.setItem(Logger.LOGGER_KEY, this.session_id);
    }
    clearSession() {
        localStorage.removeItem(Logger.LOGGER_KEY);
        this.session_id = "";
        this.customer_id = undefined;
        this.lead_id = undefined;
        this.responseMap = {};
    }
    setId({ customer_id, lead_id, }) {
        if (lead_id) {
            this.lead_id = lead_id;
        }
        if (customer_id) {
            this.customer_id = customer_id;
        }
    }
    enableLogging() {
        this.enabled = true;
    }
    disableLogging() {
        this.enabled = false;
    }
    trackPromise(promise, _a) {
        var { method, api_name } = _a, payload = __rest(_a, ["method", "api_name"]);
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled) {
                return;
            }
            this.initSession();
            const init_time = new Date();
            let apiName = `[${method.toUpperCase()}]${api_name.startsWith("/") ? api_name : `/${api_name}`}`;
            let status = -1;
            let responseData = undefined;
            try {
                const response = yield promise;
                if ("meta" in response) {
                    /*
                     * RTK Query response
                     * In case of RTK both success and error responses are returned as fulfilled promises
                     * In case of success the response object conains a "data" object
                     * In case of error the response object contains an "error" object
                     * */
                    status = response.meta.response.status;
                    responseData = response.data;
                }
                else {
                    // fetch
                    const responseClone = response.clone();
                    status = responseClone.status;
                    responseData = yield responseClone.json();
                }
            }
            catch (error) {
                responseData = null;
                status = error.status || 600; // 600 for CORS/NETWORK
            }
            if (responseData === null ||
                (responseData !== undefined &&
                    JSON.stringify(this.responseMap[apiName]) !==
                        JSON.stringify(responseData))) {
                this.track(Object.assign(Object.assign({}, payload), { api_name: apiName, init_time,
                    status, response_time: new Date().getTime() - init_time.getTime() }));
            }
            this.responseMap[apiName] = responseData;
        });
    }
    track(_a) {
        var { init_time } = _a, params = __rest(_a, ["init_time"]);
        if (!this.enabled) {
            return;
        }
        const init_time_stamp = init_time
            .toISOString()
            .replace("T", " ")
            .slice(0, 19);
        const payload = Object.assign(Object.assign({}, params), { product: this.product, browser: this.browser, os: this.os, fetched_from: window.location.pathname, session_id: this.session_id, customer_id: this.customer_id, lead_id: this.lead_id, init_time_stamp });
        fetch("https://mobileslog.com/api_log/api/log.php", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
exports.Logger = Logger;
Logger.LOGGER_KEY = "tracker_session_id";
Logger.instance = null;
function extractBrowserInfo() {
    const userAgent = window.navigator.userAgent;
    const browserInfo = {
        os: "",
        browser: "",
        version: "",
    };
    // Operating System
    if (userAgent.match(/Windows/i)) {
        browserInfo.os = "Windows";
    }
    else if (userAgent.match(/Android/i)) {
        browserInfo.os = "Android";
    }
    else if (userAgent.match(/iPhone/i)) {
        browserInfo.os = "iOS";
    }
    else if (userAgent.match(/iPad/i)) {
        browserInfo.os = "iOS";
    }
    else if (userAgent.match(/Mac/i)) {
        browserInfo.os = "macOS";
    }
    else if (userAgent.match(/Linux/i)) {
        browserInfo.os = "Linux";
    }
    else {
        browserInfo.os = "Unknown";
    }
    // Browser Name and Version
    if (userAgent.match(/MSIE/i) || userAgent.match(/Trident/i)) {
        browserInfo.browser = "Internet Explorer";
        const match = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/i);
        if (match) {
            browserInfo.version = match[1];
        }
    }
    else if (userAgent.match(/Edge/i)) {
        browserInfo.browser = "Microsoft Edge";
        const match = userAgent.match(/Edge\/(\d+(\.\d+)?)/i);
        if (match) {
            browserInfo.version = match[1];
        }
    }
    else if (userAgent.match(/Firefox/i)) {
        browserInfo.browser = "Mozilla Firefox";
        const match = userAgent.match(/Firefox\/(\d+(\.\d+)?)/i);
        if (match) {
            browserInfo.version = match[1];
        }
    }
    else if (userAgent.match(/Chrome/i)) {
        browserInfo.browser = "Google Chrome";
        const match = userAgent.match(/Chrome\/(\d+(\.\d+)?)/i);
        if (match) {
            browserInfo.version = match[1];
        }
    }
    else if (userAgent.match(/Safari/i)) {
        browserInfo.browser = "Safari";
        const match = userAgent.match(/Version\/(\d+(\.\d+)?)/i);
        if (match) {
            browserInfo.version = match[1];
        }
    }
    else {
        browserInfo.browser = "Unknown";
    }
    return browserInfo;
}
exports.extractBrowserInfo = extractBrowserInfo;
