
import {
    CallApi,
    ImplicitGrant,
    UserInfo,
    StudentInfo,
    APP_CONFIG,
    APP_MESSAGES,
    HTTP_METHODS
} from "./ds-integration-utils.js";

async function signature(inputParams = {}, state = "", envelopeId = "", docsType = null) {
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
	
	if(state && envelopeId && docsType){showLoader();}

    //Sostituire "https://docusign.github.io/jsfiddleDsResponse.html" con URL pagina multiversity dove fare redirect dopo la firma
    const dsReturnUrl = "https://docusign.github.io/jsfiddleDsResponse.html";



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

    async function getUserDataByDocusign(envelopeId) {
        try {
            const req = null;
            const apiMethod = `/accounts/${data.userInfo.defaultAccount}/envelopes/${envelopeId}/recipients`;
            const httpMethod = HTTP_METHODS.get;
            const results = await data.callApi.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
                req: req
            });
            console.log(`Envelope created. Response: ${JSON.stringify(results)}`);

            if (results?.signers?.length > 0) {
                const signer = results.signers[0];
                console.log(JSON.stringify(signer))
                return {
                    name: signer.name,
                    email: signer.email,
                    userId: signer.userId
                };
            } else {
                throw new Error("Nessun signer trovato nella response");
            }

        } catch (error) {
            console.error("Errore nel recupero dati utente nel getUserDataByDocusign:", error);
            throw error;
        }
    }

    async function createAndSign() {
        try {
            const signer = {
                email: data.studentInfo.email,
                fullName: data.studentInfo.fullName,
                university: data.studentInfo.university,
                enrollment_type: data.studentInfo.enrollment_type,
                documents: data.studentInfo.documents,
                clientUserId: 1000,
                userId: 1
            };

            const envelopeId = await createEnvelope(signer);

            if (envelopeId) {
                data.userInfo.envelopeId = envelopeId;
                console.log(`Envelope ${data.userInfo.envelopeId} created.`);

                const userData = await getUserDataByDocusign(envelopeId)
                console.log(`UserData:  ${JSON.stringify(userData)} get.`);

                const enrichedSigner = {
                    ...signer,
                    fullName: userData.name,
                    email: userData.email,
                    userId: userData.userId
                };

                await embeddedSigningCeremony({
                    envelopeId: data.userInfo.envelopeId,
                    signer: enrichedSigner
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
                emailSubject: `${APP_MESSAGES.emailText.subject} ${signer.fullName}`,
                emailBlurb: `${signer.fullName} ${APP_MESSAGES.emailText.body}`,
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
			const docsType = data.studentInfo.documents.map(({ type, ext }) => ({ type, ext }))
            const req = {
                returnUrl: `${dsReturnUrl}?envelopeId=${envelopeId}&docsType=${encodeURIComponent(JSON.stringify(docsType))}`,
                authenticationMethod: "None",
                clientUserId: signer.clientUserId,
                email: signer.email,
                userName: signer.fullName,
                userId: signer.userId
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
            window.location.href = results.url;
            return true;
        } catch (error) {
            console.error("Errore nella cerimonia di firma embedded:", error);
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

    let messageListener = async function messageListenerf(event) {
        try {
            if (!event.data) {
                return;
            }
            console.log(event.data);

            const source = event.data.source;
            if (data.implicitGrant && source === data.implicitGrant.oauthResponse) {
                await implicitGrantMsg(event.data);
                return;
            }
        } catch (error) {
            console.error("Errore nel messageListener:", error);
            alert(APP_MESSAGES.errors.genericError);
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
            if(state && envelopeId && docsType){
                const signingData = {
                    envelopeId,
                    accountId: data.userInfo.defaultAccount,
                    accessToken: data.callApi.accessToken,
                    apiBaseUrl: data.callApi.apiBaseUrl,
                    platform: data.implicitGrant.inputParams.platform,
                    docsType,
                    studentInfo: {
                        student_token: data.studentInfo.token,
                        university: data.studentInfo.university,
                    }
                }
                await signatureCompleted(state, signingData);
                return;
            }
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

function showLoader() {
	const overlay = document.createElement('div');
	overlay.id = 'custom-loader-overlay';
	Object.assign(overlay.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100vw',
		height: '100vh',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: '99999',
		cursor: 'wait',
	});

	const loader = document.createElement('div');
	loader.id = 'custom-loader-spinner';
	Object.assign(loader.style, {
		width: '50px',
		height: '50px',
		border: '6px solid #f3f3f3',
		borderTop: '6px solid #3498db',
		borderRadius: '50%',
		animation: 'spin 1s linear infinite',
	});

	overlay.appendChild(loader);
	document.body.appendChild(overlay);

	const style = document.createElement('style');
	style.innerHTML = `
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
	`;
	document.head.appendChild(style);
}

function hideLoader() {
	const overlay = document.getElementById('custom-loader-overlay');
	if (overlay) {
		overlay.remove();
	}
}

async function signatureCompleted(state, signingData) {

    const retryDsDocs = new CallApi({
        accessToken: signingData.accessToken,
        apiBaseUrl: signingData.apiBaseUrl
    })
    async function signingCeremonyEnded(state, envelopeId) {
        try {
            let sendDocStatus = null;
            
            if(state == APP_MESSAGES.signatureStatus.complete){
                console.log('1.1')
                const docs = await getAllSignedDocumentsBase64(envelopeId, signingData.accountId);
                console.log('1.2')
                sendDocStatus = await sendDocs(docs);
                console.log('1.3')
                console.log(APP_MESSAGES.signatureText.complete);
                console.log(docs);
                

            }else if(state == APP_MESSAGES.signatureStatus.decline){
                console.log(APP_MESSAGES.signatureText.decline);
            }else{
                console.log(APP_MESSAGES.signatureText.pending);
            }

            window.dispatchEvent(
              new CustomEvent("ds-signature-complete", {
                detail: {
                  statusDocusign: state,
                  statusResponse: sendDocStatus,
                },
              })
            );

        } catch (error) {
            hideLoader();
            console.error("Errore in signingCeremonyEnded:", error);
            throw error;
        }
    }

    async function getAllSignedDocumentsBase64(envelopeId, accountId) {
        try {
            const apiMethod = `/accounts/${accountId}/envelopes/${envelopeId}/documents`
            const httpMethod = HTTP_METHODS.get;
            const results = await retryDsDocs.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
            });
            const documents = results.envelopeDocuments;

            const filteredDocuments = documents
                .filter(doc => doc.documentId !== 'certificate')
                .sort((a, b) => Number(a.documentId) - Number(b.documentId));
            console.log(filteredDocuments);

            const base64Documents = await Promise.all(filteredDocuments.map(async (document) => {
                const base64 = await getDocumentBase64(envelopeId, document.documentId, accountId);
                return {
                    base64,
                    name: `${document.name}_${APP_MESSAGES.signatureStatus.signed}`
                };
            }));
            console.log(base64Documents);
            const finalDocs = base64Documents.map((doc, i) => {
                doc.ext = signingData.docsType[i].ext;
                doc.type = signingData.docsType[i].type;
                return doc;
            })
            console.log( finalDocs);
            return finalDocs;

        } catch (error) {
            console.error('Errore nel recupero documenti:', error);
            throw error;
        }
    }

    async function getDocumentBase64(envelopeId, documentId, accountId) {
        try {
            const apiMethod = `/accounts/${accountId}/envelopes/${envelopeId}/documents/${documentId}`
            const httpMethod = HTTP_METHODS.get;
            const results = await retryDsDocs.callApiJson({
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

    async function sendDocs (docs){
        try {
            console.log(`Send Docs Multiversity`);
            const templateMap = `${signingData.platform}`.toLowerCase() == APP_CONFIG.devEnvironment ?
                    APP_CONFIG.templateMapDev :
                    APP_CONFIG.templateMapProd
            const tempObj = templateMap.find(temp => temp.acronymUni == signingData.studentInfo.university);
            const apiMethod = `${tempObj.baseUriSendDocs}`;
            const httpMethod = HTTP_METHODS.post;
            const req = {
                documents: docs
            }

            const results = await retryDsDocs.callApiJson({
                apiMethod: apiMethod,
                httpMethod: httpMethod,
                req,
                studentToken: signingData.studentInfo.student_token
            });
            return results.status;
        } catch (error) {
            console.error("Errore in sendDocs:", error);
            throw error;
        }
    }
    
    await signingCeremonyEnded(state, signingData.envelopeId);
    hideLoader()
    return;
}
export { signature };
