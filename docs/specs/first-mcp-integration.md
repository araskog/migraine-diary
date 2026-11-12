# AI Chat and MCP Diary Tools

Status: Planned.

## Goal and Scope

A user can read and update their diary through the in-app AI chat or a compatible external AI assistant connected over MCP. Both use the same diary tools. Saved changes appear in the app. The service is available to users with their own app accounts. Each connection acts only on behalf of the user who authorizes it.

The first increment exposes listing and saving diary entries. Saving supports both migraine and migraine-free status, including corrections, following the [First Usable Diary](first-usable-diary.md) rules. This milestone includes the in-app chat and public MCP access to those operations.

## API and Tool Boundaries

Keep diary operations available through the backend API. MCP tools use those operations and their backend validation and ownership rules. Share domain behavior rather than duplicating it in MCP handlers. Derive the diary owner from authenticated identity, never a tool argument.

Define one shared set of diary tools for the public MCP service and the in-app AI chat, including names, descriptions, input/output schemas, and execution handlers. Both surfaces must use that set with the authenticated user's context. Framework and transport adapters may translate representations while preserving the shared contract and behavior. The agent framework must support this shared tool contract. Strands Agents is a candidate; the shared-tool requirement applies whichever framework is selected.

Tools accept explicit calendar dates. Saving also requires an IANA timezone so the backend can validate today and reject future dates consistently with the app. An AI client must obtain the user's intended date and timezone before calling the tool. Stored dates remain calendar dates. Missing entries remain unrecorded.

Saving the same user/date/status again leaves one current entry. Return structured results only after persistence succeeds, and return distinguishable validation, authorization, and operational errors without leaking internal details.

## In-App AI Chat

A signed-in user can ask the chat to list diary entries, record migraine or migraine-free days, and correct a saved status. The chat invokes the shared tools with the signed-in user's identity. It obtains missing date or status details before saving and resolves relative dates using the user's local timezone. It reports a successful update only after the tool succeeds. The calendar reflects saved changes without requiring a new sign-in.

## Public Connection and Authorization

Use a remote MCP endpoint over HTTPS with Streamable HTTP and the MCP authorization flow based on OAuth. A user signs in and authorizes access to their diary. Clients receive access tokens intended for the MCP service. Validate token audience, expiry, and granted permissions. Provide read and write permissions and enforce them server-side. Users can revoke a connection, preventing further diary access with that connection.

Existing browser sessions alone do not establish remote client authorization. Keep credentials and diary contents out of logs and use synthetic accounts and records for verification.

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
| M8 | In-app chat and MCP use the same tool definitions and execution handlers. Contract checks verify consistent schemas, results, validation, and ownership across both paths. |
| M9 | A signed-in user asks the in-app chat to list entries, save a status, and correct it. The resulting saved status is visible in the calendar without signing in again. |
| M10 | The in-app chat asks for missing date or status details before saving. Relative dates follow the user's local timezone. Failed tool calls produce a visible failure and never a success claim. |

## Delivery and Verification

Deliver shared diary tools and API behavior, remote authorization and MCP access, and the in-app chat in focused increments. Completion requires both user paths to meet the acceptance criteria.

Automated checks cover tool schemas, backend persistence, validation, retry behavior, authorization, and isolation using synthetic users. End-to-end verification exercises the in-app chat and at least one compatible external AI client, including connection, authorization, save, correction, retrieval, app visibility, failures, and revocation. Protocol inspection alone does not verify external client interoperability. Track unavailable checks explicitly before release.

## References

- [MCP server concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [MCP authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization)
- [Strands Agents](https://strandsagents.com/)
- [Architecture](../architecture.md)
- [Domain glossary](../../GLOSSARY.md)
