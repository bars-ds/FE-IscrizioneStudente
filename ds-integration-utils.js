const APP_CONFIG = {
    oAuthServiceProviderDev: "https://account-d.docusign.com",
    oAuthServiceProviderProd: "https://account.docusign.com",
    userInfoPath: "/oauth/userinfo",
    eSignBase: "/restapi/v2.1",
    jwtUrlDev: "https://docusign-jwt-server-api.dev2.multiversity.click/jwt_service/access_token",
    jwtProd: "https://docusign-jwt-server-api.prod.multiversity.click/jwt_service/access_token",
    devEnvironment: "dev",
    prodEnvironment: "prod",
    oauthResponse: "oauthResponse",
    dsResponse: "dsResponse",
    roleStudent: "STUDENTE",
    documentsType: ['contratto_studente', 'dichiarazione_sostitutiva', 'doppia_iscrizione'],
    templateMapDev: [
        {
            acronymUni:"utm",
            templatesIdSpid: ["019d9c32-bdd8-4aaa-85dd-cf9a3d1bc130", "", ""],
            templatesIdVideo: ["58b77cd1-6813-4ed8-9090-aa37a4d2dc44", "", ""],
            baseUriGetDocs:"https://online-enrolment-api.dev2.mercatorum.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api.dev2.mercatorum.multiversity.click/docusign/save-document",
            baseUriUP:"https://online-enrolment-api.dev2.mercatorum.multiversity.click/docusign/online"
        },
        {
            acronymUni:"utp",
            templatesIdSpid: ["e5c4905c-b8b6-4460-b790-db2ed71a29c5", "", ""],
            templatesIdVideo: ["0b6b0f1c-dd8a-4a95-9f15-14a931813820", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/save-document",
            baseUriUP:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/online"

        },
        {
            acronymUni:"utsr",
            templatesIdSpid: ["9b7e88d4-4669-4257-9585-17b9dfc5ba4e", "", ""],
            templatesIdVideo: ["a01cd31e-a8f7-4d36-a168-dd812caba24e", "", ""],
            baseUriGetDocs:"https://online-enrolment-api.dev2.utsr.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api.dev2.utsr.multiversity.click/docusign/save-document",
            baseUriUP:"https://online-enrolment-api.dev2.utsr.multiversity.click/docusign/online"
        }
    ],
    templateMapProd: [
        {
            acronymUni:"utm",
            templatesIdSpid: ["4657dad8-cb81-42b7-8999-c188c8507c22", "", ""],
            templatesIdVideo: ["82813f5a-361c-41eb-a5c8-a24e3699c05c", "", ""],
            baseUriGetDocs:"https://online-enrolment-api.dev2.mercatorum.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api.dev2.mercatorum.multiversity.click/docusign/save-document",
            baseUriUP:"https://online-enrolment-api.dev2.mercatorum.multiversity.click/docusign/online"
        },
        {
            acronymUni:"utp",
            templatesIdSpid: ["f09c846d-2047-4bc9-9ac3-9ad085a8e7ed", "", ""],
            templatesIdVideo: ["48f9d9b1-8391-41ae-8fb6-30db494ae0c5", "", ""],
            baseUriGetDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/save-document",
            baseUriUP:"https://online-enrolment-api-v2.dev2.pegaso.multiversity.click/docusign/online"
        },
        {
            acronymUni:"utsr",
            templatesIdSpid: ["670bc9ce-7849-4377-939a-3f475b590c1c", "", ""],
            templatesIdVideo: ["c36ccf4e-3879-4683-9fec-f16cb31aa8cd", "", ""],
            baseUriGetDocs:"https://online-enrolment-api.dev2.utsr.multiversity.click/docusign/get-document",
            baseUriSendDocs:"https://online-enrolment-api.dev2.utsr.multiversity.click/docusign/save-document",
            baseUriUP:"https://online-enrolment-api.dev2.utsr.multiversity.click/docusign/online"
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
        this.signature_type = args.signature_type || "";
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
