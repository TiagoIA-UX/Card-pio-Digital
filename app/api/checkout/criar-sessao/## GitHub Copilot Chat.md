## GitHub Copilot Chat

- Extension: 0.37.8 (prod)
- VS Code: 1.109.5 (072586267e68ece9a47aa43f8c108e0dcbf44622)
- OS: win32 10.0.26200 x64
- GitHub Account: TiagoIA-UX

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 4.228.31.149 (6 ms)
- DNS ipv6 Lookup: Error (33 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (0 ms)
- Electron fetch (configured): HTTP 200 (26 ms)
- Node.js https: HTTP 200 (66 ms)
- Node.js fetch: HTTP 200 (15 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.112.22 (5 ms)
- DNS ipv6 Lookup: Error (6 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): HTTP 200 (149 ms)
- Node.js https: HTTP 200 (490 ms)
- Node.js fetch: HTTP 200 (488 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 4.228.31.153 (4 ms)
- DNS ipv6 Lookup: Error (14 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (71 ms)
- Node.js https: HTTP 200 (78 ms)
- Node.js fetch: HTTP 200 (75 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (2136 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (614 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (596 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (588 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (58 ms)

Number of system certificates: 92

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).