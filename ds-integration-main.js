
import {
    CallApi,
    ImplicitGrant,
    UserInfo,
    StudentInfo,
    APP_CONFIG,
    APP_MESSAGES,
    HTTP_METHODS
} from "./ds-integration-utils.js";

async function signature(inputParams = {}) {
    if (
        !inputParams?.idPratica ||
        !inputParams?.platform ||
        !inputParams?.university ||
        !inputParams?.enrollment_type ||
        !inputParams?.student_data?.token ||
        !inputParams?.student_data?.fullName ||
        !inputParams?.student_data?.email
    ) {
        alert(APP_MESSAGES.errors.genericError);
        return;
    }
    // Set basic variables
    const dsReturnUrl = "https://docusign.github.io/jsfiddleDsResponse.html";//"about:blank";



    // Mainline
    let data = {
        implicitGrant: null,
        userInfo: null,
        studentInfo: null,
        callApi: null,
    };

    data.implicitGrant = new ImplicitGrant({
        inputParams
    });

    async function createAndSign() {
        try {
            const signer = {
                email: data.studentInfo.email,
                fullName: data.studentInfo.fullName,
                university: data.studentInfo.university,
                enrollment_type: data.studentInfo.enrollment_type,
                documents: data.studentInfo.documents,
                clientUserId: 1000
            };

            const envelopeId = await createEnvelope(signer);
            if (envelopeId) {
                data.userInfo.envelopeId = envelopeId;
                console.log(`Envelope ${data.userInfo.envelopeId} created.`);
                await embeddedSigningCeremony({
                    envelopeId: data.userInfo.envelopeId,
                    signer: signer
                });
            }
        } catch (error) {
            console.error("Errore durante l'esecuzione di createAndSign:", error);
            throw error;
        }
    };

    async function createEnvelope(signer) {
        try {
            const tempObj = data.userInfo.templateMap.find(temp => temp.acronymUni == signer.university);
            const tempIds = tempObj.templates.slice(0, parseInt(signer.enrollment_type, 10));
            const documentsArr = signer.documents.sort(
                (a, b) =>
                    data.implicitGrant.documentsType.indexOf(a.type) -
                    data.implicitGrant.documentsType.indexOf(b.type)
            );

            const req = {
                status: 'sent',
                compositeTemplates: tempIds.map((id, i)=> (
                    {
                        serverTemplates: [{
                            sequence : i+1,
                            templateId: id
                        }],
                        inlineTemplates: [
                            {
                                sequence : i+1,
                                recipients: {
                                    signers: [
                                        {
                                            email: signer.email,
                                            name: signer.fullName,
                                            clientUserId: signer.clientUserId,
                                            roleName: data.implicitGrant.roleStudent,
                                            recipientId: "1",
                                            routingOrder: "1",
                                            emailNotification: {
                                                emailSubject: `${APP_MESSAGES.emailText.subject} ${signer.fullName}`,
                                                emailBody: `${signer.fullName} ${APP_MESSAGES.emailText.body}`,
                                                supportedLanguage: APP_MESSAGES.emailText.lang
                                            }
                                        }
                                    ]
                                }
                            }],
                        document: {
                            documentId: "1",
                            name: documentsArr[i].name,
                            fileExtension:documentsArr[i].ext,
                            documentBase64:documentsArr[i].base64
                        }
                    }
                ))
            };

            // Make the create envelope API call
            console.log(`Creating envelope.`);
            const apiMethod = `/accounts/${data.userInfo.defaultAccount}/envelopes`;
            const httpMethod = HTTP_METHODS.post;
            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
                req: req
            });
            console.log(`Envelope created. Response: ${JSON.stringify(results)}`);
            return results.envelopeId;
        } catch (error) {
            console.error("Errore nella creazione dell'envelope:", error);
            throw error;
        }
    }

    /*
    * Create an embedded signing ceremony, open a new tab with it
    */
    async function embeddedSigningCeremony({ envelopeId, signer }) {
        try {
            const req = {
                returnUrl: dsReturnUrl,
                authenticationMethod: "None",
                clientUserId: signer.clientUserId,
                email: signer.email,
                userName: signer.fullName
            };

            // Make the API call
            const apiMethod = `/accounts/${data.userInfo.defaultAccount}/envelopes/${envelopeId}/views/recipient`;
            const httpMethod = HTTP_METHODS.post;
            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
                req: req
            });
            console.log(`Envelope created. Response: ${JSON.stringify(results)}`);
            console.log(`Displaying signing ceremony...`);
            createModal(results.url);
            return true;
        } catch (error) {
            console.error("Errore nella cerimonia di firma embedded:", error);
            throw error;
        }
    }


    function createModal(iframeSrc) {
        const overlay = document.createElement('div');
        overlay.id = 'ds-modal-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '99999',
        });

        const modal = document.createElement('div');
        modal.id = 'ds-modal-content';
        Object.assign(modal.style, {
            background: 'white',
            width: '90%',
            maxWidth: '1200px',
            height: '100%',
            maxHeight: '90vh',
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
        });

        const closeBtn = document.createElement('button');
        closeBtn.id = 'ds-modal-close';
        closeBtn.innerHTML = '&times;';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: '#a4242c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            zIndex: '1001',
        });
        closeBtn.onclick = () => {
            document.body.removeChild(overlay);
        };

        const iframe = document.createElement('iframe');
        iframe.id = 'ds-modal-iframe';
        iframe.src = iframeSrc;
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            flexGrow: '1',
        });

        if (window.innerWidth <= 600) {
            modal.style.width = '95%';
            modal.style.height = '90%';
            Object.assign(closeBtn.style, {
                width: '26px',
                height: '26px',
                fontSize: '14px',
            });
        }

        modal.appendChild(closeBtn);
        modal.appendChild(iframe);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function closeModal() {
        const overlay = document.querySelector('#ds-modal-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }

    async function getDocumentBase64(envelopeId, documentId) {
        try {
            const apiMethod = `/accounts/${data.userInfo.defaultAccount}/envelopes/${envelopeId}/documents/${documentId}`
            const httpMethod = HTTP_METHODS.get;
            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
            });
            const reader = new FileReader();
            return await new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(results);
            });
        } catch (error) {
            console.error('Errore nel recuperare il documento in base64:', error);
            throw error;
        }
    }

    async function getAllSignedDocumentsBase64(envelopeId) {
        try {
            const apiMethod = `/accounts/${data.userInfo.defaultAccount}/envelopes/${envelopeId}/documents`
            const httpMethod = HTTP_METHODS.get;
            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
            });
            const documents = results.envelopeDocuments;

            const filteredDocuments = documents
                .filter(doc => doc.documentId !== 'certificate')
                .sort((a, b) => Number(a.documentId) - Number(b.documentId));
            console.log(filteredDocuments);

            const base64Documents = await Promise.all(filteredDocuments.map(async (document) => {
                const base64 = await getDocumentBase64(envelopeId, document.documentId);
                return {
                    base64,
                    name: `${document.name}_${APP_MESSAGES.signatureStatus.signed}`
                };
            }));
            console.log(base64Documents);
            const finalDocs = base64Documents.map((doc, i) => {
                doc.ext = data.studentInfo.documents[i].ext;
                doc.type = data.studentInfo.documents[i].type;
                return doc;
            })
            console.log( finalDocs);
            return finalDocs;

        } catch (error) {
            console.error('Errore nel recupero documenti:', error);
            throw error;
        }
    }

    async function signingCeremonyEnded(eventData, envelopeId) {
        try {
            let sendDocStatus = null;
            if (eventData.source !== data.implicitGrant.dsResponse) {
                return;
            }
            closeModal();
            const href = eventData.href;
            const sections = href.split("?");
            const hasEvents = sections.length === 2;
            const qps = hasEvents ? sections[1].split("&") : [];
            let resultSignature = APP_MESSAGES.signatureStatus.pending;
            console.log(qps);

            if (!hasEvents) {
                console.error(`Unexpected signing ceremony response: ${eventData.href}.`);
                return;
            }

            qps.forEach((i) => {
                const parts = i.split("=");
                if (parts.length === 2) {
                    if (parts[0] === "event") {
                        resultSignature = parts[1];
                    }
                } else {
                    console.warn(`Parametro query malformato: "${i}"`);
                }
            });
            if(resultSignature == APP_MESSAGES.signatureStatus.complete){
                console.log('1.1')
                const docs = await getAllSignedDocumentsBase64(envelopeId);
                console.log('1.2')
                sendDocStatus = await sendDocs(docs);
                console.log('1.3')
                console.log(APP_MESSAGES.signatureText.complete);

            }else if(resultSignature == APP_MESSAGES.signatureStatus.decline){
                console.log(APP_MESSAGES.signatureText.decline);
            }else{
                console.log(APP_MESSAGES.signatureText.pending);
            }

            window.dispatchEvent(
              new CustomEvent("ds-signature-complete", {
                detail: {
                  statusDocusign: resultSignature,
                  statusResponse: sendDocStatus,
                },
              })
            );

        } catch (error) {
            console.error("Errore in signingCeremonyEnded:", error);
            throw error;
        }
    }

    async function retryDocs (){
        try {
            console.log(`Retry Docs Multiversity`);
            console.log( data.userInfo.templateMap.find(temp => temp.acronymUni == data.studentInfo.university));

            const tempObj = data.userInfo.templateMap.find(temp => temp.acronymUni == data.studentInfo.university);
            const apiMethod = `${tempObj.baseUriGetDocs}/${data.studentInfo.practiceId}/${data.studentInfo.enrollment_type}`;
            const httpMethod = HTTP_METHODS.get;
            console.log(apiMethod);

            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
                studentToken: data.studentInfo.token
            });
            console.log(results);
            data.studentInfo.documents = results.documents;
        } catch (error) {
            console.error("Errore in retryDocs:", error);
            throw error;
        }
    }

    async function sendDocs (docs){
        try {
            console.log(`Send Docs Multiversity`);
            const tempObj = data.userInfo.templateMap.find(temp => temp.acronymUni == data.studentInfo.university);
            const apiMethod = `${tempObj.baseUriSendDocs}`;
            const httpMethod = HTTP_METHODS.post;
            const req = {
                documents: docs
            }

            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
                req,
                studentToken: data.studentInfo.token
            });
            return results.status;
        } catch (error) {
            console.error("Errore in sendDocs:", error);
            throw error;
        }
    }

    let messageListener = async function messageListenerf(event) {
        try {
            if (!event.data) {
                return;
            }
            console.log(event.data);

            const source = event.data.source;
            if (source === data.implicitGrant.dsResponse) {
                await signingCeremonyEnded(event.data, data.userInfo.envelopeId);
                return;
            }
            if (data.implicitGrant && source === data.implicitGrant.oauthResponse) {
                await implicitGrantMsg(event.data);
                return;
            }
        } catch (error) {
            console.error("Errore nel messageListener:", error);
            alert(error);
        }
    };
    messageListener = messageListener.bind(this);

    async function implicitGrantMsg(eventData) {
        try {
            const isOAuthValid = data.implicitGrant.handleMessage(eventData);
            if (!isOAuthValid) {
                console.error("Errore: risposta OAuth non valida.");
                return;
            }
            await completeLogin();
            await retryDocs();
            await createAndSign();
        } catch (error) {
            console.error("Errore in implicitGrantMsg:", error);
            throw error;
        }
    }

    async function completeLogin() {
        try {
            data.userInfo = new UserInfo({
                accessToken: data.implicitGrant.accessToken,
                platform: `${data.implicitGrant.inputParams.platform}`.toLowerCase(),
                templateMap: `${data.implicitGrant.inputParams.platform}`.toLowerCase() == APP_CONFIG.devEnvironment ?
                    APP_CONFIG.templateMapDev :
                    APP_CONFIG.templateMapProd
            });
            await data.userInfo.getUserInfo();
            data.callApi = new CallApi({
                accessToken: data.implicitGrant.accessToken,
                apiBaseUrl: data.userInfo.defaultBaseUrl,
                platform: `${data.implicitGrant.inputParams.platform}`.toLowerCase()
            });
            console.log(data.implicitGrant.inputParams.student_data);

            data.studentInfo = new StudentInfo({
                practiceId: data.implicitGrant.inputParams.idPratica,
                university: `${data.implicitGrant.inputParams.university}`.toLowerCase(),
                enrollment_type: data.implicitGrant.inputParams.enrollment_type,
                student_data: data.implicitGrant.inputParams.student_data
            });

            console.log(`${data.userInfo.name} ${data.userInfo.email} ${data.userInfo.defaultAccountName}`);
        } catch (error) {
            console.error("Errore in completeLogin:", error);
            throw error;
        }
    }


    window.addEventListener("message", messageListener);

    await data.implicitGrant.login();

}
export { signature };
