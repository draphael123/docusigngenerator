# DocuSign Template Generator

A production-ready MVP web application for creating DocuSign templates programmatically with enforced Fountain branding.

## Features

- **Locked Header Enforcement**: All documents automatically include the Fountain-branded header as Page 1
- **Document Template Library**: Predefined templates for common use cases (Letter of Recommendation, Contractor Verification, etc.)
- **Custom Document Upload**: Support for uploading DOCX or PDF files
- **Placeholder System**: Replace `{{VAR:*}}` placeholders with user-provided values
- **DocuSign Anchor Tabs**: Use `{{DS:*}}` anchors for automatic tab placement
- **OAuth Integration**: Secure DocuSign OAuth 2.0 connection
- **Role-Based Signing**: Configure signing order and role assignments

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- DocuSign Developer Account with Integration Key
- Header PDF file at `public/header-template.pdf`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/docusign_templates?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# DocuSign
DOCUSIGN_INTEGRATION_KEY="your-integration-key"
DOCUSIGN_AUTH_SERVER="account-d.docusign.com"
DOCUSIGN_BASE_PATH="https://demo.docusign.net/restapi"
DOCUSIGN_REDIRECT_URI="http://localhost:3000/api/auth/docusign/callback"

# File Storage (local for dev)
STORAGE_TYPE="local"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed document templates
npm run db:seed
```

### 4. Header PDF

Place your Fountain header PDF at:
```
public/header-template.pdf
```

**Important**: This header PDF must be the exact file provided. It will be merged as Page 1 of every document.

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/     # NextAuth configuration
│   │   │   └── docusign/          # DocuSign OAuth routes
│   │   ├── document-templates/    # Template CRUD API
│   │   ├── requests/              # Request processing API
│   │   └── upload/                # File upload API
│   ├── dashboard/                 # Dashboard page
│   ├── document-templates/        # Template management pages
│   ├── login/                     # Login page
│   └── requests/                  # Request creation pages
├── lib/
│   ├── docusign.ts               # DocuSign API integration
│   ├── document-template.ts      # Template utilities
│   ├── pdf-utils.ts              # PDF merging and validation
│   └── prisma.ts                 # Prisma client
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed script
└── public/
    └── header-template.pdf       # Locked header PDF (REQUIRED)
```

## Usage

### Creating a Template Request

1. **Connect DocuSign**: Click "Connect DocuSign" on the dashboard
2. **Create Request**: Navigate to "New Request"
3. **Choose Source**:
   - Select a document template, OR
   - Upload a custom DOCX/PDF file
4. **Fill Placeholders**: If using a template, fill in required `{{VAR:*}}` placeholders
5. **Configure Roles**: Set up DocuSign signing roles and order
6. **Map Anchors**: Map `{{DS:*}}` anchors to roles and tab types
7. **Submit**: The system will:
   - Merge the header PDF as Page 1
   - Generate the final PDF
   - Create the DocuSign template
   - Display the template ID

### Document Template Syntax

#### Placeholders (Text Replacement)
```
{{VAR:FULL_NAME}}
{{VAR:START_DATE}}
{{VAR:END_DATE}}
```

These are replaced with user-provided values before PDF generation.

#### DocuSign Anchors (Tab Placement)
```
{{DS:SIGNATURE_CONTRACTOR}}
{{DS:SIGNATURE_CCOO}}
{{DS:DATE_SIGNED}}
```

These remain in the PDF and are used by DocuSign to place tabs. **Important**: Anchors must NOT appear on Page 1 (header page).

## Validation Rules

- Header PDF must exist and be valid
- All required placeholders must be filled
- All required anchors must be present in the document
- Anchors cannot appear on Page 1 (header page)
- DocuSign must be connected before creating templates

## API Endpoints

### Authentication
- `GET /api/auth/docusign` - Get DocuSign OAuth URL
- `GET /api/auth/docusign/callback` - OAuth callback handler

### Templates
- `GET /api/document-templates` - List all templates
- `POST /api/document-templates` - Create new template

### Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new template request

### Upload
- `POST /api/upload` - Upload document file

## Database Models

### DocumentTemplate
- Template metadata
- Placeholder definitions
- Anchor definitions
- Default role and tab mappings

### Request
- Source document reference
- Filled placeholder values
- Role configuration
- Tab mapping
- Generated PDF path
- DocuSign template ID
- Status tracking

## Troubleshooting

### Header PDF Not Found
Ensure `public/header-template.pdf` exists. The system validates this file on startup.

### DocuSign OAuth Errors
- Verify `DOCUSIGN_INTEGRATION_KEY` is correct
- Ensure redirect URI matches DocuSign app settings
- Check that you're using the correct auth server (demo vs production)

### PDF Generation Fails
- Ensure uploaded files are valid PDF or DOCX
- Check that placeholders are properly formatted: `{{VAR:NAME}}`
- Verify anchors are properly formatted: `{{DS:ANCHOR_NAME}}`

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npm run db:push` to sync schema

## Production Considerations

1. **File Storage**: Replace local storage with S3-compatible storage
2. **DOCX Conversion**: Implement proper DOCX to PDF conversion (LibreOffice headless or CloudConvert API)
3. **Token Storage**: Store DocuSign tokens securely in database with encryption
4. **Error Handling**: Add comprehensive error logging and monitoring
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Security**: Add CSRF protection, input validation, and sanitization
7. **Testing**: Add unit tests for PDF utilities and DocuSign service

## Sample DocuSign Payload

When creating a template, the system generates a payload like:

```json
{
  "envelopeDefinition": {
    "emailSubject": "Please sign: Template Name",
    "status": "created",
    "documents": [{
      "documentBase64": "...",
      "name": "Template Name.pdf",
      "documentId": "1"
    }],
    "recipients": {
      "signers": [{
        "roleName": "Contractor",
        "routingOrder": "1",
        "tabs": {
          "signHereTabs": [{
            "anchorString": "{{DS:SIGNATURE_CONTRACTOR}}",
            "anchorUnits": "pixels",
            "anchorYOffset": "-10"
          }]
        }
      }]
    }
  }
}
```

## License

Proprietary - Healthcare Company Internal Use

