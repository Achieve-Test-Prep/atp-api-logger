"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.SupportedServerTypes = exports.SupportedProducts = void 0;
/* eslint-disable no-bitwise */
const bowser_1 = __importDefault(require("bowser"));
var SupportedProducts;
(function (SupportedProducts) {
    SupportedProducts["PREP_PORTAL"] = "0";
    SupportedProducts["INSTRUCTOR_PORTAL"] = "1";
    SupportedProducts["UNIFIED_CHECKOUT"] = "2";
    SupportedProducts["COLLEGE_BRIDGE"] = "3";
    SupportedProducts["LQ"] = "4";
    SupportedProducts["SWA"] = "5";
    SupportedProducts["SALES_PORTAL"] = "6";
    SupportedProducts["MEET"] = "7";
})(SupportedProducts || (exports.SupportedProducts = SupportedProducts = {}));
var SupportedServerTypes;
(function (SupportedServerTypes) {
    SupportedServerTypes["PREP"] = "0";
    SupportedServerTypes["AOD"] = "1";
    SupportedServerTypes["INSTRUCTOR"] = "2";
    SupportedServerTypes["PAY"] = "3";
    SupportedServerTypes["SALES"] = "4";
    SupportedServerTypes["SWA"] = "5";
    SupportedServerTypes["MEET"] = "6";
    SupportedServerTypes["LQ"] = "7";
})(SupportedServerTypes || (exports.SupportedServerTypes = SupportedServerTypes = {}));
class Logger {
    constructor(product, enabled = false) {
        const browserInfo = bowser_1.default.parse(window.navigator.userAgent);
        this.product = product;
        this.browser = browserInfo
            ? `${browserInfo.browser.name} | ${browserInfo.browser.version}`
            : "";
        this.os = browserInfo.os.name || "";
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
        if (!this.enabled) {
            return;
        }
        this.initSession();
        const init_time = new Date();
        promise
            .then((response) => {
            let status = -1;
            if ("meta" in response) {
                /*
                 * RTK Query response
                 * In case of RTK both success and error responses are returned as fulfilled promises
                 * In case of success the response object conains a "data" object
                 * In case of error the response object contains an "error" object
                 * */
                status = response.meta.response.status;
            }
            else {
                // fetch
                status = response.status;
            }
            this.track(Object.assign(Object.assign({}, payload), { api_name: `[${method.toUpperCase()}]${api_name.startsWith("/") ? api_name : `/${api_name}`}`, init_time,
                status, response_time: new Date().getTime() - init_time.getTime() }));
        })
            .catch((error) => {
            this.track(Object.assign(Object.assign({}, payload), { api_name: `[${method.toUpperCase()}]${api_name}`, init_time, status: error.status || 600, response_time: new Date().getTime() - init_time.getTime() }));
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
