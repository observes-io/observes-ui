[![License: Internal Use Only](https://img.shields.io/badge/license-Internal%20Use%20Only-red)](LICENSE)
[![Security Policy](https://img.shields.io/badge/security-policy-blue)](SECURITY.md)

> **License Summary:** Free for internal organisational use (including production) by your own employees and contractors, solely for your organisation's benefit.
> Not for embedding, bundling, resale, hosting, offering as a service, or any paid commercial use without a license.
> See [Polyform Internal Use License](https://polyformproject.org/licenses/internal-use/) for full terms.

# Observes UI

Observes UI is a client-side web application for visualizing, managing, and exploring Azure DevOps resources, pipelines and their relationships. It is designed for internal use within your organization, providing a rich dashboard and interactive tools for DevOps inventory, compliance, and risk management.

**Useful documentation links (see the [resources](#resources) section for more):**

0. Get familiar with [the concepts we use](https://observes.io/userguide/concepts/).
1. Follow the onboarding process in [our documentation](https://observes.io/userguide/onboard/).
2. Hit the ground running by setting up [use cases](https://observes.io/userguide/fasttrack/).
3. Explore the [what & why](https://observes.io/whatwhy/).

---

## Features

- Visualize and organise Azure DevOps CI/CD resources (pools, repositories, credentials), pipelines (definitions, historic/preview executions) and the relationships between them
- Interactive dashboards and charts with project and user stats
- Advanced filtering, search, and drill-down capabilities, including pre-computed filters for common use cases such as:
  - Overprivileged, overshared and cross-project CI/CD resources
  - Pipeline-based access control (PBAC)
  - Protection statuses for CI/CD resources
  - Potentially dangerous pipelines (historic and future executions) *based on a basic regex engine

---

## Project Structure


The repository is organised as follows:

- `src/` - Main application source code
  - `pages/` - Top-level pages and views
    - `components/` - Reusable UI components (cards, grids, charts, etc.)
    - `dashboard/` - Dashboard views and widgets
    - `onboarding/` - Onboarding flows and integrations
    - `platform/` - Platform-specific pages
    - `resource/` - Resource tables, details, and tracking
    - `theme/` - Theme and customization files
  - `state/` - Application state management (Zustand store)
- `public/` - Static assets, images, and data files
- `dist/` - Production build output (after running `npm run build`)
- `nginx.conf` - Example configuration for secure static hosting

---

## Prerequisites

- Node.js 18+ and npm (for local development)
- Modern browser (Chrome, Edge, Firefox, Safari)

---

## Installation

Clone the repository and install dependencies:

```pwsh
git clone https://github.com/observes-io/observes-ui.git
cd observes-ui
npm install
```

To run locally:

```pwsh
npm run dev
```

To build for production:

```pwsh
npm run build
```

For static hosting, deploy the contents of the `dist/` or `build/` folder to your web server (see `nginx.conf` for security best practices).

---


## Security

- Observes UI does **not** process or store sensitive data such as tokens or secrets.
- All secrets and authentication are handled by backend tools (e.g., Observes Scanner).
- Security headers and best practices are recommended for hosting (see `nginx.conf`).
- Being client-side does mean, the data will be stored in your browser's local database, which means it is accessible via browser extensions/JavaScript.

> **Note:** Observes UI does not store or process sensitive data. However, if secrets are improperly handled or exposed within your DevOps pipelines, they may be visible in the UI. Always follow best practices for secret management and avoid exposing credentials in pipeline outputs or resources.

**Security Disclosure:**

If you discover a vulnerability, please contact us directly at **security@observes.io**.
Do not publicly disclose security issues until we have investigated and addressed them.

See [SECURITY.md](./SECURITY.md) for our responsible disclosure policy.

---

## Troubleshooting

- Ensure your PAT and API permissions are correct for the scope you want to target.
- Check browser console and network logs for errors.

---

## Contributing

Under the [Polyform Internal Use License](https://polyformproject.org/licenses/internal-use/), we do **not** accept code contributions (pull requests).
We welcome **feature requests**, **bug reports**, and **documentation suggestions** via [Issues](../../issues).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## Code of Conduct

We are committed to a welcoming, respectful environment.
Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

---

## License

This project is licensed under the [Polyform Internal Use License](https://polyformproject.org/licenses/internal-use/).

**You may:**
- Use this software in production **within your own organisation**
- Modify it internally for your own use

**You may not:**
- Sell, resell, redistribute, embed, bundle, host, or offer the software as a service
- Use it as part of a paid product, service, or consulting engagement without a commercial license

See [LICENSE](./LICENSE) and [LICENSE-CLARIFICATION.md](./LICENSE-CLARIFICATION.md) for details.

## Commercial Licensing

If you wish to use this software for paid commercial purposes or include it in a product or service offered to third parties, please contact us at **info@observes.io** for commercial licensing options.

---

## Disclaimer

This software is provided **"as is"**, without warranty of any kind.
You are responsible for ensuring you have proper authorisation before use.
See [DISCLAIMER.md](./DISCLAIMER.md) for details.

---

## Supply Chain Security

A Software Bill of Materials (SBOM) is published for each release.

- [View the SBOM for this project](https://github.com/observes-io/supply-chain)

---

### Resources

- [Observes.io Documentation Home](https://https://observes.io/docshome/)
- [Scanner Source Code GitHub Repository](https://github.com/observes-io/observes-scanner)
- [UI Source Code GitHub Repository](https://github.com/observes-io/observes-ui)
- [Observes Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=Observesio.observes)
- [App https://app.observes.io/](https://app.observes.io/) or your own self-hosted version

---

For questions, support, or feature requests, open an issue or contact us at **info@observes.io**.
