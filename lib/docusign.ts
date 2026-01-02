import * as docusign from 'docusign-esign';

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY!;
const AUTH_SERVER = process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com';
const BASE_PATH = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';
const REDIRECT_URI = process.env.DOCUSIGN_REDIRECT_URI!;

export interface DocuSignAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  accountId: string;
  baseUrl: string;
}

/**
 * Get DocuSign OAuth authorization URL
 */
export function getDocuSignAuthUrl(state?: string): string {
  const scopes = 'signature impersonation';
  const authUrl = `https://${AUTH_SERVER}/oauth/auth?response_type=code&scope=${encodeURIComponent(scopes)}&client_id=${INTEGRATION_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
  return authUrl;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<DocuSignAuthTokens> {
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(AUTH_SERVER);
  
  // Exchange authorization code for access token
  const tokenResponse = await apiClient.requestToken(code, REDIRECT_URI);
  
  if (!tokenResponse.body || !tokenResponse.body.access_token) {
    throw new Error('Failed to obtain access token from DocuSign');
  }
  
  const accountInfo = await getAccountInfo(tokenResponse.body.access_token);
  
  return {
    accessToken: tokenResponse.body.access_token,
    refreshToken: tokenResponse.body.refresh_token,
    expiresIn: tokenResponse.body.expires_in || 3600,
    accountId: accountInfo.accountId,
    baseUrl: accountInfo.baseUrl,
  };
}

/**
 * Get account information
 */
async function getAccountInfo(accessToken: string): Promise<{ accountId: string; baseUrl: string }> {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(BASE_PATH);
  apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
  
  const authApi = new docusign.AuthenticationApi(apiClient);
  const userInfo = await authApi.getUserInfo(accessToken);
  
  const account = userInfo.accounts?.[0];
  if (!account) {
    throw new Error('No DocuSign account found');
  }
  
  return {
    accountId: account.accountId!,
    baseUrl: account.baseUri!,
  };
}

/**
 * Create a DocuSign template from PDF
 */
export async function createDocuSignTemplate(
  accessToken: string,
  accountId: string,
  baseUrl: string,
  templateName: string,
  pdfBuffer: Buffer,
  roles: Array<{ roleName: string; signingOrder: number }>,
  tabMap: Array<{ anchorName: string; roleName: string; tabType: string }>
): Promise<string> {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(baseUrl);
  apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
  
  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  
  // Create envelope definition
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = `Please sign: ${templateName}`;
  envelopeDefinition.status = 'created';
  
  // Create document
  const document = new docusign.Document();
  document.documentBase64 = pdfBuffer.toString('base64');
  document.name = `${templateName}.pdf`;
  document.fileExtension = 'pdf';
  document.documentId = '1';
  
  envelopeDefinition.documents = [document];
  
  // Create recipients with roles
  const signers: docusign.Signer[] = roles.map((role) => {
    const signer = new docusign.Signer();
    signer.roleName = role.roleName;
    signer.routingOrder = role.signingOrder.toString();
    signer.recipientId = role.signingOrder.toString();
    
    // Add tabs based on tabMap
    const tabs = new docusign.Tabs();
    const signerTabs: any[] = [];
    
    tabMap
      .filter(tab => tab.roleName === role.roleName)
      .forEach(tab => {
        const anchorString = `{{DS:${tab.anchorName}}}`;
        
        if (tab.tabType === 'signature') {
          if (!tabs.signHereTabs) tabs.signHereTabs = [];
          const signHere = new docusign.SignHere();
          signHere.anchorString = anchorString;
          signHere.anchorUnits = 'pixels';
          signHere.anchorYOffset = '-10';
          signHere.anchorXOffset = '0';
          tabs.signHereTabs.push(signHere);
        } else if (tab.tabType === 'date') {
          if (!tabs.dateSignedTabs) tabs.dateSignedTabs = [];
          const dateSigned = new docusign.DateSigned();
          dateSigned.anchorString = anchorString;
          dateSigned.anchorUnits = 'pixels';
          dateSigned.anchorYOffset = '-10';
          dateSigned.anchorXOffset = '0';
          tabs.dateSignedTabs.push(dateSigned);
        } else if (tab.tabType === 'text') {
          if (!tabs.textTabs) tabs.textTabs = [];
          const textTab = new docusign.Text();
          textTab.anchorString = anchorString;
          textTab.anchorUnits = 'pixels';
          textTab.anchorYOffset = '-10';
          textTab.anchorXOffset = '0';
          tabs.textTabs.push(textTab);
        }
      });
    
    signer.tabs = tabs;
    return signer;
  });
  
  const recipients = new docusign.Recipients();
  recipients.signers = signers;
  envelopeDefinition.recipients = recipients;
  
  // Create template
  const template = new docusign.Template();
  template.name = templateName;
  template.description = `Template: ${templateName}`;
  template.envelope = envelopeDefinition;
  
  // Create template via Templates API
  const templatesApi = new docusign.TemplatesApi(apiClient);
  const templateRequest = new docusign.EnvelopeTemplate();
  templateRequest.name = templateName;
  templateRequest.description = `Template: ${templateName}`;
  templateRequest.envelope = envelopeDefinition;
  
  const result = await templatesApi.createTemplate(accountId, {
    envelopeTemplate: templateRequest,
  });
  
  return result.templateId!;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<DocuSignAuthTokens> {
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(AUTH_SERVER);
  
  // Note: DocuSign SDK may have a refresh token method
  // This is a simplified version
  throw new Error('Token refresh not yet implemented');
}

