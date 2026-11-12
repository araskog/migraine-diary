# First MCP Integration

Status: Planned. This specification prepares the integration for implementation.

## Goal and Scope

A user can connect a compatible AI assistant to Migraine Diary over the internet, record a migraine day, and see that entry in the app. The service is available to users with their own app accounts. Each connection acts only on behalf of the user who authorizes it.

The first increment exposes listing and saving diary entries. Saving supports both migraine and migraine-free status, including corrections, following the [First Usable Diary](first-usable-diary.md) rules. Later increments can expose additional diary operations and support the in-app assistant.

## API and Tool Boundaries

Keep diary operations available through the backend API. MCP tools use those operations and their backend validation and ownership rules. Share domain behavior rather than duplicating it in MCP handlers. Derive the diary owner from authenticated identity, never a tool argument.

Define one shared set of diary tools for the public MCP service and the future in-app AI chat, including names, descriptions, input/output schemas, and execution handlers. Both surfaces must use that set with the authenticated user's context. Framework and transport adapters may translate representations while preserving the shared contract and behavior. Evaluate Strands Agents as a candidate for the in-app agent runtime and MCP tool integration during implementation planning.

Tools accept explicit calendar dates. Saving also requires an IANA timezone so the backend can validate today and reject future dates consistently with the app. An AI client must obtain the user's intended date and timezone before calling the tool. Stored dates remain calendar dates. Missing entries remain unrecorded.

Saving the same user/date/status again leaves one current entry. Return structured results only after persistence succeeds, and return distinguishable validation, authorization, and operational errors without leaking internal details.

## Public Connection and Authorization

Use a remote MCP endpoint over HTTPS with Streamable HTTP and the MCP authorization flow based on OAuth. A user signs in and authorizes access to their diary. Clients receive access tokens intended for the MCP service. Validate token audience, expiry, and granted permissions. Provide read and write permissions and enforce them server-side. Users can revoke a connection, preventing further diary access with that connection.

Select the authorization implementation and an initial compatible AI client during implementation planning. Existing browser sessions alone do not establish remote client authorization. Keep credentials and diary contents out of logs and use synthetic accounts and records for verification.

## Acceptance Criteria

| ID | Observable outcome |
|---|---|
| M1 | A user connects a compatible external AI client over the internet, signs in, and authorizes diary access. |
| M2 | An authorized client discovers typed listing and saving tools and can list only that user's saved diary entries. Missing entries are never reported as migraine-free. |
| M3 | A client saves a migraine or migraine-free day for an explicit date and timezone. The entry appears in the app and remains after reconnecting and signing in again. |
| M4 | Repeating a save creates no duplicate user/date entry. Correcting the status updates the existing entry and is visible in the app. |
| M5 | Invalid dates, future dates, invalid timezones, and unsupported statuses are rejected without changing saved entries, using the same backend rules as the API. Include timezone boundary cases. |
| M6 | Unauthenticated requests and invalid, expired, revoked, wrong-audience, or insufficient-permission credentials cannot perform protected operations. A client cannot read or change another user's diary by supplying identifiers. |
| M7 | Failed saves return an error rather than success. A retry after a lost response leaves one entry with the requested status. |
| M8 | MCP exposes the shared tool definitions and handlers intended for the in-app AI chat. Contract checks verify consistent schemas, results, validation, and ownership through the MCP adapter and direct invocation of the shared tools. When in-app chat is added, it uses this same set. |

## Delivery and Verification

Implement in focused increments: confirm API contracts and shared behavior, add remote authorization, then expose and exercise the first tools through a compatible AI client. Agree the specific client and test boundaries before implementing affected behavior.

Automated checks cover tool schemas, backend persistence, validation, retry behavior, authorization, and isolation using synthetic users. An end-to-end demonstration covers connection, authorization, save, retrieval, app visibility, and revocation. Protocol inspection alone does not verify external client interoperability. Track unavailable checks explicitly before release.

## References

- [MCP server concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [MCP authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization)
- [Strands Agents](https://strandsagents.com/)
- [Architecture](../architecture.md)
- [Domain glossary](../../GLOSSARY.md)
