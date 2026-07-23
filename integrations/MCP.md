# MCP Compatibility Watch

Last reviewed: 2026-07-23

Official source: https://modelcontextprotocol.io/specification/latest

MCP standardizes connections between LLM applications, resources, prompts, and tools. TimeProofs is interested primarily in consequential tool calls and their results.

Planned mapping questions:

- protocol revision and negotiated capabilities;
- tool identity and declared annotations;
- request and result digests;
- host, client, and server roles;
- user consent or authorization references where available;
- receiver-issued action identifier;
- later webhook or system-of-record evidence;
- cancellation, retry, resumability, and duplicate handling.

Boundary: MCP tool success proves a tool response, not automatically the final external effect.
