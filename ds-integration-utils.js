const APP_CONFIG = {
    oAuthServiceProviderDev: "https://account-d.docusign.com",
    oAuthServiceProviderProd: "https://account.docusign.com",
    userInfoPath: "/oauth/userinfo",
    eSignBase: "/restapi/v2.1",
    jwtUrlDev: "https://ar.barsystems.it/mv_ds_token/",
    jwtProd: "https://ambiente.prod.it",
    devEnvironment: "dev",
    prodEnvironment: "prod",
    oauthResponse: "oauthResponse",
    dsResponse: "dsResponse",
    roleStudent: "STUDENTE",
    documentsType: ['contratto_studente', 'dichiarazione_sostitutiva', 'doppia_iscrizione'],
    templateMapDev: [
        {
            acronymUni:"utm",
            templates: ["bf7a3abf-7d8b-4412-ba0f-925ea31b8dba", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.mercatorum.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.mercatorum.multiversity.click/docusign/save-document"
        },
        {
            acronymUni:"utp",
            templates: ["a7f24ceb-ba0b-4e8e-95de-a90706ca36be", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/save-document"
        },
        {
            acronymUni:"utsr",
            templates: ["9f397aab-aefd-4eab-9946-52b2cfdd3e3a", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.utsr.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.utsr.multiversity.click/docusign/save-document"
        }
    ],
    templateMapProd: [
        {
            acronymUni:"utm",
            templates: ["bf7a3abf-7d8b-4412-ba0f-925ea31b8dba", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.mercatorum.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.mercatorum.multiversity.click/docusign/save-document"
        },
        {
            acronymUni:"utp",
            templates: ["a7f24ceb-ba0b-4e8e-95de-a90706ca36be", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/save-document"
        },
        {
            acronymUni:"utsr",
            templates: ["9f397aab-aefd-4eab-9946-52b2cfdd3e3a", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.utsr.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.utsr.multiversity.click/docusign/save-document"
        }
    ]
}
const APP_MESSAGES = {
    errors: {
        genericError: "Si è verificato un errore durante il processo di firma. Riprova più tardi",
    },
    signatureStatus: {
        signed: "firmato",
        complete: "signing_complete",
        decline: "decline",
        pending: "pending"
    },
    signatureText: {
        complete: "Processo di firma completato",
        decline: "Documento non firmato",
        pending: "Documento in attesa di firma"
    },
    emailText:{
        subject: "Contratto Studente",
        body: "prendi visione e firma Contratto",
        lang:"it"
    }
};

const HTTP_METHODS = {
    get: "GET",
    post: "POST",
    put: "PUT",
    delete: "DELETE"
};

const FETCH_MODES = {
    cors: "cors",
    no_cors: "no-cors",
    same_origin: "same-origin",
};

const CONTENT_TYPES = {
    json: "application/json",
    pdf: "application/pdf",
    text: "text/plain",
};

class ImplicitGrant {
    constructor(args) {
        this.inputParams = args.inputParams || {};
        this.oauthResponse = APP_CONFIG.oauthResponse;
        this.dsResponse = APP_CONFIG.dsResponse;
        this.roleStudent = APP_CONFIG.roleStudent;
        this.documentsType = APP_CONFIG.documentsType;
        this.accessToken = null;
    }

    async login() {

        this.accessToken = "eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwAAgmTfV9PdSAgAAOooQWDT3UgCAGaByQ1R_cpFnbxyBYdF31sVAAEAAAAYAAMAAAAdAAAABQAAAAEBAAANACQAAAA3ZDA1ZDEzOC01MjdmLTQ3YzUtOTFkYi0yNmMwOGYzNGE2YTAiACQAAAA3ZDA1ZDEzOC01MjdmLTQ3YzUtOTFkYi0yNmMwOGYzNGE2YTASAAEAAAAGAAAAand0X2JyIwAkAAAAN2QwNWQxMzgtNTI3Zi00N2M1LTkxZGItMjZjMDhmMzRhNmEw.XdKKQjWzZdsNc4Mh9zqgaA-S8epaUyq1bqNeWkFiZ7XyDrtE52vQ_RLOnbMVhQBhLU1PyMmAWsjISnGTlz_gH7LcdanLW_RmdRoCf-qgiBcPRREfPCmtCCAFNY8vdYC6ufG1PJFkioZWEw77iRFkaei_r6c2486QawGK8kbb3ICmYs57OhA20EccGw3BoFgslCmxroJ2-qoAy3zywOZJE3Rv7tZoV2QRrD2Q-qj05DBwGPMpKsDPhk_pQRFq9ozyFOXJs_m_TuC6xvKaLWRgM9OM3BQTLx8RU1f9ggVE_NzPNrdz77DvzkY3DfXORbRlH96NHoiCnOUGpH_vVIdC6g";

        try {
            const response = await fetch(
                `${this.inputParams.platform}`.toLocaleLowerCase() == APP_CONFIG.devEnvironment ?
                    APP_CONFIG.jwtUrlDev :
                    APP_CONFIG.jwtProd,
                {
                    method: HTTP_METHODS.get
                });
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }

            const token = await response.text();

            if (token) {
                this.accessToken = token;
                if (this.oauthResponse) {
                    window.postMessage({
                        source: this.oauthResponse,
                    }, "*");
                }
            } else {
                alert(APP_MESSAGES.errors.genericError);
            }
        } catch (error) {
            alert(APP_MESSAGES.errors.genericError);
            throw error;
        }
    }


    handleMessage(data) {
        if (!data || data.source !== this.oauthResponse) {
            return false;
        }
        return true;
    }
}

class UserInfo {
    constructor(args) {
        this.accessToken = args.accessToken;
        this.envelopeId = args.envelopeId || null;
        this.oAuthServiceProvider = args.platform == APP_CONFIG.prodEnvironment ? APP_CONFIG.oAuthServiceProviderProd : APP_CONFIG.oAuthServiceProviderDev;
        this.userInfoPath = APP_CONFIG.userInfoPath;
        this.eSignBase = APP_CONFIG.eSignBase;

        this.name = null;
        this.userId = null;
        this.email = null;
        this.defaultAccount = null;
        this.defaultAccountName = null;
        this.defaultBaseUrl = null;
        this.userInfoResponse = null;
        this.accounts = [];

        this.templateMap = args.templateMap;


    }

    async getUserInfo() {
        try {
            const userInfo = await this.fetchUserInfo();

            this.userInfoResponse = userInfo;
            this.name = userInfo.name;
            this.userId = userInfo.sub;
            this.email = userInfo.email;
            this.accounts = userInfo.accounts.map(a => ({
                accountId: a.account_id,
                accountExternalId: null,
                accountName: a.account_name,
                accountIsDefault: a.is_default,
                accountBaseUrl: a.base_uri + this.eSignBase,
                corsError: false
            }));

            this.defaultAccountIndex = this.accounts.findIndex(a => a.accountIsDefault);
            if (this.defaultAccountIndex === -1) {
                this.defaultAccountIndex = 0;
            }
            const defaultAccount = this.accounts[this.defaultAccountIndex];
            this.defaultAccount = defaultAccount.accountId;
            this.defaultAccountName = defaultAccount.accountName;
            this.defaultBaseUrl = defaultAccount.accountBaseUrl;
            return true;
        } catch (error) {
            console.log(`Problem while completing login. Error: ${error.message}`);
            throw error;
        }
    }

    async fetchUserInfo() {
        const url = `${this.oAuthServiceProvider}${this.userInfoPath}`;
        try {
            const response = await fetch(url, {
                mode: FETCH_MODES.cors,
                headers: new Headers({
                    Authorization: `Bearer ${this.accessToken}`,
                    Accept: CONTENT_TYPES.json,
                }),
            });

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(APP_MESSAGES.errors.genericError);
        }
    }
}

class StudentInfo{
    constructor(args) {
        this.practiceId = args.practiceId || "";
        this.university = args.university || "";
        this.enrollment_type = args.enrollment_type || "";
        const student = args.student_data || {};
        this.token = student.token || "";
        this.fullName = student.fullName || "";
        this.email = student.email || "";
        this.documents = null;
    }
}

class CallApi {
    constructor(args) {
        this.accessToken = args.accessToken;
        this.apiBaseUrl = args.apiBaseUrl;
    }


    async callApiJson({ apiMethod, httpMethod, req, qp, headers = [], studentToken = null }) {
        let body = null;

        if ([HTTP_METHODS.post, HTTP_METHODS.put].includes(httpMethod)) {
            body = JSON.stringify(req, null, 4);
        }

        let url = `${studentToken ? "" : this.apiBaseUrl}${apiMethod}`;
        if (qp) {
            url += "?" + new URLSearchParams(qp).toString();
        }

        const headersReq = {
            Accept: CONTENT_TYPES.json,
            Authorization: `Bearer ${studentToken || this.accessToken}`,
        };

        if (body) {
            headersReq["Content-Type"] = CONTENT_TYPES.json;
        }

        headers.forEach(header => {
            headersReq[header.h] = header.v;
        });


        try {
            const response = await fetch(url, {
                method: httpMethod,
                mode: FETCH_MODES.cors,
                headers: headersReq,
                body: body
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API call failed [${httpMethod} ${url}]: ${response.status} ${response.statusText} - ${errorText}`);
                throw new Error(APP_MESSAGES.errors.genericError);
            }

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes(CONTENT_TYPES.json)) {
                return await response.json();
            } else if (contentType.includes(CONTENT_TYPES.pdf)) {
                return await response.blob();
            } else {
                return await response.text();
            }

        } catch (e) {
            console.error(`API call error [${httpMethod} ${url}]: ${e.message}`);
            throw new Error(APP_MESSAGES.errors.genericError);
        }
    }
}

export { CallApi, ImplicitGrant, UserInfo, StudentInfo, APP_CONFIG, APP_MESSAGES, HTTP_METHODS};

