# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions of Bitcoin Transaction Screenshot Generator are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our software seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please email us at [onyecosmas@gmail.com] with the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

We will acknowledge your email within 48 hours, and will send a more detailed response within 72 hours indicating the next steps in handling your report. After the initial reply to your report, we will endeavor to keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

## Security Considerations

### API Security

Our application interacts with the following external APIs:

1. **Blockchain.com Data API**
   - We only make read requests (GET)
   - No API keys required for public data access
   - All requests are made over HTTPS

2. **CoinGecko API**
   - Used for historical Bitcoin price data
   - Public API with rate limits
   - All requests are made over HTTPS

### Data Handling

- **No Data Storage**: This application does not store any user data, Bitcoin addresses, or transaction information on our servers.
- **Client-Side Processing**: All data processing occurs in the user's browser.
- **No Sensitive Information**: We never request or handle private keys, seeds, or any sensitive authentication data.

### Best Practices

1. **HTTPS Only**: All API requests are made over secure HTTPS connections.
2. **Input Validation**: All user inputs are validated before processing.
3. **CORS Protection**: API requests are configured with appropriate CORS headers.
4. **Content Security Policy**: Implemented to prevent XSS attacks.
5. **No External Scripts**: We don't load external scripts from untrusted sources.

### Dependencies Security

We regularly update our dependencies to include security patches. Our main dependencies include:

- React (v18.2.0+)
- html-to-image (v1.11.11+)
- Axios (v1.5.0+)
- Vite (v4.4.5+)

## Security Audit

While we strive to maintain high security standards, this application has not undergone a formal third-party security audit. Users should:

1. Verify the application is served from our official domain
2. Check that the connection is secure (HTTPS)
3. Review the source code if concerned about security implications

## Privacy Considerations

- We do not collect any personal information
- We do not use tracking cookies or analytics
- All processing occurs locally in your browser
- Bitcoin addresses you enter are only sent to Blockchain.com's API and are not stored by us

## Disclaimer

This software is provided for educational and design purposes only. The authors are not responsible for:

1. Any financial losses resulting from the use of this software
2. The accuracy of Bitcoin transaction data provided by third-party APIs
3. Any security vulnerabilities in dependent libraries or APIs

## Security Updates

Subscribe to our GitHub repository to receive notifications about security updates and new releases.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.