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

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface UserInfoResponse {
  sub: string;
  email: string;
  name: string;
  accounts: Array<{
    account_id: string;
    is_default: string;
    account_name: string;
    base_uri: string;
  }>;
}

interface SignHereTab {
  anchorString: string;
  anchorUnits: string;
  anchorYOffset: string;
  anchorXOffset: string;
}

interface DateSignedTab {
  anchorString: string;
  anchorUnits: string;
  anchorYOffset: string;
  anchorXOffset: string;
}

interface TextTab {
  anchorString: string;
  anchorUnits: string;
  anchorYOffset: string;
  anchorXOffset: string;
}

interface Tabs {
  signHereTabs?: SignHereTab[];
  dateSignedTabs?: DateSignedTab[];
  textTabs?: TextTab[];
}

interface Signer {
  roleName: string;
  routingOrder: string;
  recipientId: string;
  tabs?: Tabs;
}

interface Recipients {
  signers: Signer[];
}

interface Document {
  documentBase64: string;
  name: string;
  fileExtension: string;
  documentId: string;
}

interface EnvelopeDefinition {
  emailSubject: string;
  status: string;
  documents: Document[];
  recipients: Recipients;
}

interface EnvelopeTemplate {
  name: string;
  description: string;
  envelope: EnvelopeDefinition;
}

interface CreateTemplateResponse {
  templateId: string;
  name: string;
  uri: string;
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
  const tokenUrl = `https://${AUTH_SERVER}/oauth/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${INTEGRATION_KEY}:`).toString('base64')}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain access token from DocuSign: ${response.status} ${errorText}`);
  }

  const tokenData: TokenResponse = await response.json();
  
  if (!tokenData.access_token) {
    throw new Error('Failed to obtain access token from DocuSign: No access_token in response');
  }

  const accountInfo = await getAccountInfo(tokenData.access_token);

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in || 3600,
    accountId: accountInfo.accountId,
    baseUrl: accountInfo.baseUrl,
  };
}

/**
 * Get account information
 */
async function getAccountInfo(accessToken: string): Promise<{ accountId: string; baseUrl: string }> {
  const userInfoUrl = `${BASE_PATH}/oauth/userinfo`;
  
  const response = await fetch(userInfoUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user info from DocuSign: ${response.status} ${errorText}`);
  }

  const userInfo: UserInfoResponse = await response.json();
  
  const account = userInfo.accounts?.[0];
  if (!account) {
    throw new Error('No DocuSign account found');
  }

  return {
    accountId: account.account_id,
    baseUrl: account.base_uri,
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
  // Create envelope definition
  const envelopeDefinition: EnvelopeDefinition = {
    emailSubject: `Please sign: ${templateName}`,
    status: 'created',
    documents: [
      {
        documentBase64: pdfBuffer.toString('base64'),
        name: `${templateName}.pdf`,
        fileExtension: 'pdf',
        documentId: '1',
      },
    ],
    recipients: {
      signers: roles.map((role) => {
        const signer: Signer = {
          roleName: role.roleName,
          routingOrder: role.signingOrder.toString(),
          recipientId: role.signingOrder.toString(),
          tabs: {
            signHereTabs: [],
            dateSignedTabs: [],
            textTabs: [],
          },
        };

        // Add tabs based on tabMap
        tabMap
          .filter(tab => tab.roleName === role.roleName)
          .forEach(tab => {
            const anchorString = `{{DS:${tab.anchorName}}}`;
            
            if (tab.tabType === 'signature') {
              signer.tabs!.signHereTabs!.push({
                anchorString,
                anchorUnits: 'pixels',
                anchorYOffset: '-10',
                anchorXOffset: '0',
              });
            } else if (tab.tabType === 'date') {
              signer.tabs!.dateSignedTabs!.push({
                anchorString,
                anchorUnits: 'pixels',
                anchorYOffset: '-10',
                anchorXOffset: '0',
              });
            } else if (tab.tabType === 'text') {
              signer.tabs!.textTabs!.push({
                anchorString,
                anchorUnits: 'pixels',
                anchorYOffset: '-10',
                anchorXOffset: '0',
              });
            }
          });

        // Remove empty tab arrays
        if (signer.tabs!.signHereTabs!.length === 0) delete signer.tabs!.signHereTabs;
        if (signer.tabs!.dateSignedTabs!.length === 0) delete signer.tabs!.dateSignedTabs;
        if (signer.tabs!.textTabs!.length === 0) delete signer.tabs!.textTabs;
        
        // Remove tabs object if empty
        if (!signer.tabs!.signHereTabs && !signer.tabs!.dateSignedTabs && !signer.tabs!.textTabs) {
          delete signer.tabs;
        }

        return signer;
      }),
    },
  };

  // Create template request
  const templateRequest: EnvelopeTemplate = {
    name: templateName,
    description: `Template: ${templateName}`,
    envelope: envelopeDefinition,
  };

  // Create template via REST API
  const templateUrl = `${baseUrl}/v2.1/accounts/${accountId}/templates`;
  
  const response = await fetch(templateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create DocuSign template: ${response.status} ${errorText}`);
  }

  const result: CreateTemplateResponse = await response.json();
  
  if (!result.templateId) {
    throw new Error('Failed to create DocuSign template: No templateId in response');
  }

  return result.templateId;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<DocuSignAuthTokens> {
  const tokenUrl = `https://${AUTH_SERVER}/oauth/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${INTEGRATION_KEY}:`).toString('base64')}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh access token: ${response.status} ${errorText}`);
  }

  const tokenData: TokenResponse = await response.json();
  
  if (!tokenData.access_token) {
    throw new Error('Failed to refresh access token: No access_token in response');
  }

  const accountInfo = await getAccountInfo(tokenData.access_token);

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || refreshToken,
    expiresIn: tokenData.expires_in || 3600,
    accountId: accountInfo.accountId,
    baseUrl: accountInfo.baseUrl,
  };
}
