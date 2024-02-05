export enum SupportedProducts {
  PREP_PORTAL = "0",
  INSTRUCTOR_PORTAL = "1",
  UNIFIED_CHECKOUT = "2",
  COLLEGE_BRIDGE = "3",
  LQ = "4",
  SWA = "5",
  SALES_PORTAL = "6",
  MEET = "7",
}

export enum SupportedServerTypes {
  PREP = "0",
  AOD = "1",
  INSTRUCTOR = "2",
  PAY = "3",
  SALES = "4",
  SWA = "5",
  MEET = "6",
  AJAXHANDLER = "7",
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

export type TrackParams = Omit<
  LogApiPayload,
  | "product"
  | "browser"
  | "os"
  | "fetched_from"
  | "session_id"
  | "init_time_stamp"
> & {
  init_time: Date;
};

export type TrackPromiseParams = Pick<
  LogApiPayload,
  "api_name" | "server_type"
> & {
  method: string;
};

type RTKMETA = {
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

export class Logger {
  private static LOGGER_KEY = "tracker_session_id";

  private static instance: Logger | null = null;

  private product: SupportedProducts;

  private browser: string;

  private os: string;

  private session_id: string;

  private customer_id: string | undefined;

  private lead_id: string | undefined;

  private enabled: boolean;

  private constructor(product: SupportedProducts, enabled = false) {
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

  public static getInstance(
    product: SupportedProducts,
    enabled = false
  ): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(product, enabled);
    }
    return Logger.instance;
  }

  // eslint-disable-next-line class-methods-use-this
  private createUUID() {
    let dt = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }

  private initSession() {
    const currentSessionId = localStorage.getItem(Logger.LOGGER_KEY);
    if (currentSessionId) {
      this.session_id = currentSessionId;
      return;
    }

    this.session_id = this.createUUID();
    localStorage.setItem(Logger.LOGGER_KEY, this.session_id);
  }

  public clearSession() {
    localStorage.removeItem(Logger.LOGGER_KEY);
    this.session_id = "";
    this.customer_id = undefined;
    this.lead_id = undefined;
  }

  public setId({
    customer_id,
    lead_id,
  }: {
    customer_id?: string;
    lead_id?: string;
  }) {
    if (lead_id) {
      this.lead_id = lead_id;
    }
    if (customer_id) {
      this.customer_id = customer_id;
    }
  }

  public enableLogging() {
    this.enabled = true;
  }

  public disableLogging() {
    this.enabled = false;
  }

  public trackPromise(
    promise: Promise<PromiseResponse>,
    { method, api_name, ...payload }: TrackPromiseParams
  ) {
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
        } else {
          // fetch
          status = response.status;
        }
        this.track({
          ...payload,
          api_name: `[${method.toUpperCase()}]${
            api_name.startsWith("/") ? api_name : `/${api_name}`
          }`,
          init_time,
          status,
          response_time: new Date().getTime() - init_time.getTime(),
        });
      })
      .catch((error) => {
        this.track({
          ...payload,
          api_name: `[${method.toUpperCase()}]${api_name}`,
          init_time,
          status: error.status || 600, // 600 for CORS/NETWORK
          response_time: new Date().getTime() - init_time.getTime(),
        });
      });
  }

  private track({ init_time, ...params }: TrackParams) {
    if (!this.enabled) {
      return;
    }
    const init_time_stamp = init_time
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    const payload: LogApiPayload = {
      ...params,
      product: this.product,
      browser: this.browser,
      os: this.os,
      fetched_from: window.location.pathname,
      session_id: this.session_id,
      customer_id: this.customer_id,
      lead_id: this.lead_id,
      init_time_stamp,
    };

    fetch("https://mobileslog.com/api_log/api/log.php", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export function extractBrowserInfo(): {
  os: string;
  browser: string;
  version: string;
} {
  const userAgent = window.navigator.userAgent;
  const browserInfo: { os: string; browser: string; version: string } = {
    os: "",
    browser: "",
    version: "",
  };

  // Operating System
  if (userAgent.match(/Windows/i)) {
    browserInfo.os = "Windows";
  } else if (userAgent.match(/Mac/i)) {
    browserInfo.os = "macOS";
  } else if (userAgent.match(/Linux/i)) {
    browserInfo.os = "Linux";
  } else if (userAgent.match(/Android/i)) {
    browserInfo.os = "Android";
  } else if (userAgent.match(/iOS/i)) {
    browserInfo.os = "iOS";
  } else {
    browserInfo.os = "Unknown";
  }

  // Browser Name and Version
  if (userAgent.match(/MSIE/i) || userAgent.match(/Trident/i)) {
    browserInfo.browser = "Internet Explorer";
    const match = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/i);
    if (match) {
      browserInfo.version = match[1];
    }
  } else if (userAgent.match(/Edge/i)) {
    browserInfo.browser = "Microsoft Edge";
    const match = userAgent.match(/Edge\/(\d+(\.\d+)?)/i);
    if (match) {
      browserInfo.version = match[1];
    }
  } else if (userAgent.match(/Firefox/i)) {
    browserInfo.browser = "Mozilla Firefox";
    const match = userAgent.match(/Firefox\/(\d+(\.\d+)?)/i);
    if (match) {
      browserInfo.version = match[1];
    }
  } else if (userAgent.match(/Chrome/i)) {
    browserInfo.browser = "Google Chrome";
    const match = userAgent.match(/Chrome\/(\d+(\.\d+)?)/i);
    if (match) {
      browserInfo.version = match[1];
    }
  } else if (userAgent.match(/Safari/i)) {
    browserInfo.browser = "Safari";
    const match = userAgent.match(/Version\/(\d+(\.\d+)?)/i);
    if (match) {
      browserInfo.version = match[1];
    }
  } else {
    browserInfo.browser = "Unknown";
  }

  return browserInfo;
}
