# Header PDF Required

## Critical Requirement

**You MUST place the Fountain header PDF file in this directory before using the application.**

## File Location

Place your header PDF file at:
```
public/header-template.pdf
```

## File Requirements

- **File Name**: Must be exactly `header-template.pdf`
- **Format**: Valid PDF file
- **Content**: The exact Fountain-branded header provided
- **Modification**: The header PDF must NOT be modified, recreated, or redrawn

## Validation

The system validates that this file exists:
- On application startup
- Before processing any template requests
- If the file is missing, template creation will fail with a clear error message

## Usage

The header PDF is automatically:
1. Loaded when creating a template
2. Merged as Page 1 of every document
3. Followed by the user's document content starting at Page 2

## Important Notes

- **DO NOT** modify the header PDF
- **DO NOT** recreate or redraw the header
- **DO NOT** place anchors on Page 1 (header page)
- The header must remain visually identical to the source file

## Troubleshooting

If you see "Header PDF not found" errors:
1. Verify the file exists at `public/header-template.pdf`
2. Check file permissions (must be readable)
3. Verify the file is a valid PDF
4. Restart the development server after adding the file

