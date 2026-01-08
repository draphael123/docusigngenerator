# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.example` to `.env` (if it exists) or create `.env` with required variables
   - See README.md for required environment variables

3. **Set Up Database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed document templates
   npm run db:seed
   ```

4. **Add Header PDF**
   - Place your Fountain header PDF at: `public/header-template.pdf`
   - **CRITICAL**: This file must exist before creating any templates
   - The system will validate this file on startup

5. **Create Initial User** (Optional - for testing)
   ```bash
   # You'll need to create a user via a script or directly in the database
   # Example using Prisma Studio:
   npm run db:studio
   # Then create a user with email and bcrypt-hashed password
   ```

6. **Run Development Server**
   ```bash
   npm run dev
   ```

## Important Notes

### Header PDF Requirement
- The header PDF at `public/header-template.pdf` is **REQUIRED**
- The system validates this file exists before processing any requests
- If the file is missing, template creation will fail
- The header is automatically merged as Page 1 of every document

### DocuSign Configuration
1. Create a DocuSign Integration Key in the DocuSign Developer Console
2. Set the redirect URI to: `http://localhost:3000/api/auth/docusign/callback`
3. Use the Integration Key in your `.env` file
4. Connect DocuSign from the dashboard before creating templates

### Database
- PostgreSQL is required
- The schema includes User, Account, Session, DocumentTemplate, and Request models
- Run migrations after schema changes: `npm run db:migrate`

### Document Templates
- Three templates are seeded by default:
  1. Letter of Recommendation
  2. Contractor Verification Letter
  3. Contractor End of Agreement
- Template files are placeholder DOCX files - replace with actual templates
- Templates use `{{VAR:*}}` for placeholders and `{{DS:*}}` for DocuSign anchors

## Troubleshooting

### "Header PDF not found" Error
- Ensure `public/header-template.pdf` exists
- Check file permissions
- Verify the file is a valid PDF

### DocuSign OAuth Errors
- Verify Integration Key is correct
- Check redirect URI matches DocuSign app settings
- Ensure you're using the correct auth server (demo vs production)

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Run `npm run db:push` to sync schema

### TypeScript Errors
- Run `npm run db:generate` to regenerate Prisma Client
- Ensure all dependencies are installed: `npm install`

## Next Steps

1. Replace placeholder template DOCX files with actual templates
2. Implement DOCX to PDF conversion (see README.md)
3. Add proper error logging and monitoring
4. Set up production environment variables
5. Configure S3-compatible storage for file uploads





