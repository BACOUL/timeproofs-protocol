# Compatibility Matrix

Last reviewed: 2026-07-23

Status values: WATCHING, RESEARCHED, PROFILE_DRAFTED, IMPLEMENTED, TESTED, PRODUCTION.

| System or protocol | Role | Current public capability relevant to TimeProofs | TimeProofs target | Status | Next review trigger |
|---|---|---|---|---|---|
| MCP | Connects LLM applications to tools and data; tools can execute actions | Tool request/result, protocol metadata, authorization and transport revisions | Map write-action request, result, receiver evidence, and later outcome events | RESEARCHED | New specification revision or SDK breaking change |
| A2A | Agent discovery, messaging, and collaborative task management | Agent cards, tasks, messages, artifacts, task state | Preserve delegation chain and correlate agent task state with external business outcome | RESEARCHED | New released specification or task semantics change |
| ACP | ChatGPT commerce and merchant checkout interaction | Product discovery, checkout, merchant acceptance, delegated payment integration | Map user/checkout/order evidence while preserving merchant/system-of-record outcome | WATCHING | New order, returns, multi-item, region, or payment lifecycle capability |
| UCP | Open agentic commerce language across consumer surfaces, businesses, and payment providers | Commerce primitives; API, MCP, and A2A integration; AP2 compatibility | Map checkout, order, fulfillment, returns, and evidence identifiers | WATCHING | Specification or partner implementation change |
| AP2 | Agent payment mandates and secure payment support | Payment authorization and receipt concepts | Link mandate and payment evidence to merchant effect and settlement outcome | WATCHING | Receipt, mandate, settlement, or implementation change |
| HTTP/OpenAPI | General service invocation | Request, response, status, headers, idempotency keys | Generic receiver middleware and opaque evidence references | PROFILE_DRAFTED | Receiver SDK work starts |
| Webhooks | Asynchronous lifecycle events | Delivery of later business and payment state | Correlate final outcomes, reversals, retries, and freshness | PROFILE_DRAFTED | Connector implementation starts |
| Stripe | Payment processing and refund/settlement system | Sandbox payment and refund lifecycle events | First payment system-of-record connector | WATCHING | P5 connector phase starts or API lifecycle changes |
| Shopify | Merchant order and refund system | Orders, fulfillment, returns, refunds | First commerce system-of-record connector | WATCHING | P5 connector phase starts or commerce APIs change |
| OpenAI Agents SDK | Agent runtime and tracing | Agent runs, tool calls, handoffs, trace context | Optional source adapter; never sufficient alone for external outcome | WATCHING | SDK tracing or tool contract change |
| Google ADK | Agent development runtime | Agent/tool orchestration | Optional source adapter and UCP/A2A demonstration | WATCHING | Relevant release or partner opportunity |
| LangChain/LangGraph | Agent/workflow framework | Tool and workflow execution traces | Optional evidence-source adapter | WATCHING | Developer demand |
| CrewAI | Multi-agent framework | Agent task and tool activity | Optional evidence-source adapter | WATCHING | Developer demand |
| Vercel AI SDK | AI application and tool integration | Tool calls and streaming application layer | Optional developer adapter | WATCHING | Developer gate prioritization |

## Compatibility rule

A mapping MUST state both:

1. what the source can attest; and
2. what it cannot prove without another issuer or system.

A successful tool result MUST NOT automatically map to a final business outcome.

## Vocabulary mapping rule

Protocol adapters MUST map source-native states to registered TimeProofs event types only when the source semantics match the registered phase and meaning. Vendor-specific states that do not match MUST use a collision-resistant `x.<reverse-dns>...` event type until a reviewed profile exists. A mapping MUST preserve weak or self-claimed provenance rather than upgrading it to a receiver or system-of-record source class.
