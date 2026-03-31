# **The Architecture of Latency: A Technical Roadmap for the LocalPlus Sub-300ms MVP Build**

The transition from a search-based internet to an answer-based economy necessitates a fundamental reimagining of local discovery infrastructure. The traditional model of "Keyword-Link-Click" is being rapidly superseded by the "Intent-Answer-Action" paradigm, where the value lies not in directing a user to a webpage, but in providing an immediate, grounded, and actionable response. LocalPlus represents a post-search discovery layer designed to solve the "Hyper-Local Decay" problem—the tendency of centralized large language models (LLMs) to rely on stale, city-level data regarding merchant availability and civic hierarchies.1 To achieve a sub-300ms response time for users in logically disparate regions like Sydney, Australia, and Bangkok, Thailand, the infrastructure must leverage edge-native computing and high-velocity retrieval mechanisms. This report outlines the technical requirements for building the LocalPlus MVP for $20 to $150 per month, utilizing the Bunny.net ecosystem and Google Gemini 1.5 Flash.

## **Anycast Orchestration: Deploying the Model Context Protocol at the Edge**

The Model Context Protocol (MCP) serves as the universal orchestration bridge, acting as a standardized interface between the generative intelligence of the LLM and the structured reality of local merchant data.1 To meet the stringent latency budget of 300ms, the MCP server cannot reside in a single centralized data center; it must be distributed globally via an Anycast network.

### **The Mechanism of Anycast Routing in Magic Containers**

Unlike traditional Unicast routing, where a single IP address corresponds to a single physical server, or GeoIP-based routing, which relies on potentially inaccurate DNS mapping, Anycast allows multiple Bunny.net nodes to share a single IP address.2 The Border Gateway Protocol (BGP) ensures that network traffic is routed to the "closest" node based on network hops rather than pure geographical distance.2

For the LocalPlus MVP, Bunny.net Magic Containers provide the ideal environment for this deployment. The platform utilizes bare-metal servers and NVMe storage across 40+ regions to ensure that the compute layer is physically adjacent to the user.4 When a user in Bangkok initiates a request, the BGP routes the packet to the Bangkok Point of Presence (PoP), while a user in Sydney is served by the Sydney PoP, maintaining a median Time to First Byte (TTFB) as low as 26ms.1

### **Step-by-Step Deployment of the MCP Server**

The deployment of an MCP server on Magic Containers requires a shift from standard web hosting to containerized edge execution. The following technical steps define the workflow for establishing a persistent, Anycast-routed gateway.

| Deployment Phase | Action Item | Technical Requirement |
| :---- | :---- | :---- |
| **Orchestration** | App Creation | Select "Advanced Deployment" in the Bunny.net Dashboard.5 |
| **Regionality** | Base Region Setting | Designate Sydney (SYD) and Bangkok (BKK) as "Base Regions".5 |
| **Compute** | Image Selection | Utilize a Rust or Python-based Docker image for the MCP server.1 |
| **Networking** | Endpoint Config | Add an "Anycast" endpoint mapping internal port 8080 to public port 443\.7 |
| **Scaling** | Instance Limits | Set a minimum of 1 instance per region to eliminate cold-start latency.5 |

The choice of "Base Regions" is critical for the LocalPlus MVP. By designating Sydney and Bangkok as base regions, the system disables dynamic provisioning for those specific areas, ensuring the application is always "warm" and ready to respond without the 60-second delay sometimes associated with SafeHop rerouting during node health monitoring.1

### **Containerization and Environment Configuration**

The MCP server must be lightweight to ensure rapid startup and minimal memory overhead. Using a distroless or slim Python image ensures that the container is highly portable and secure.6

Dockerfile

FROM python:3.11\-slim  
WORKDIR /app  
\# Set environment variables for high-performance Python  
ENV UV\_SYSTEM\_PYTHON=1 \\  
    PYTHONUNBUFFERED=1 \\  
    PORT=8080  
\# Install dependencies including FastMCP for protocol handling  
COPY requirements.txt.  
RUN pip install \--no-cache-dir \-r requirements.txt  
COPY server.py.  
EXPOSE 8080  
\# Run uvicorn with proxy-aware headers for Anycast compatibility  
CMD \["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers"\]

The server logic utilizes the FastMCP framework to create a bridge between the LLM and the local merchant database. In a production environment for 2026, this implementation often leverages Server-Sent Events (SSE) to maintain a hanging HTTP connection, allowing for real-time streaming of context updates.1

## **High-Velocity Vector Retrieval: Engineering the libSQL Search Layer**

The "Moat" of LocalPlus is its ability to handle complex relational queries—such as finding a premium-status merchant with real-time availability near a specific civic landmark—using a hybrid of vector search and graph traversals.1 For the MVP scale of 500 local businesses, the Bunny Database (built on libSQL) provides a globally distributed, SQLite-compatible solution that minimizes retrieval latency.13

### **The libSQL Vector Extension and DiskANN Algorithm**

The 2026 Bunny Database integrates the DiskANN algorithm to facilitate Approximate Nearest Neighbor (ANN) search. DiskANN is specifically designed to handle high-dimensional vectors at scale by navigating through multiple layers of coarse-to-fine approximations.15 This handles the requirement of querying 500 business records in under 50ms by avoiding brute-force linear scans.

The similarity between the user's intent and the merchant's profile is calculated using the cosine distance, expressed as:

![][image1]  
LibSQL stores these embeddings in a specialized F32\_BLOB column, which provides single-precision (32-bit) floating-point representation.15

### **Implementation of the Vector Schema and Search Syntax**

To achieve sub-50ms performance, the database must be correctly indexed and queried using the vector\_top\_k table-valued function. This bypasses the overhead of standard SQL ORDER BY clauses when dealing with high-dimensional data.16

SQL

\-- Step 1: Initialize the merchant table with a vector column  
CREATE TABLE merchants (  
    id INTEGER PRIMARY KEY,  
    name TEXT,  
    category TEXT,  
    status TEXT,  
    embedding F32\_BLOB(768) \-- Dimension matches Gemini 1.5 Flash  
);

\-- Step 2: Create the vector index using the DiskANN engine  
\-- Parameters fine-tune the balance between recall and speed  
CREATE INDEX merchants\_idx ON merchants (  
    libsql\_vector\_idx(embedding, 'metric=cosine', 'compress\_neighbors=float8')  
);

For querying, the syntax must explicitly utilize the index to maintain performance. A common pitfall in libSQL is the inversion of join orders when WHERE predicates are applied to a regular table joined with the vector index, which can increase latency from 10ms to several seconds.21 The use of CROSS JOIN or a subquery is required to force the query planner into the correct execution path.21

SQL

\-- Step 3: High-performance vector retrieval (Sub-50ms)  
SELECT m.name, m.status, v.distance  
FROM vector\_top\_k('merchants\_idx', vector32('\[0.12, \-0.05,...\]'), 10) AS v  
CROSS JOIN merchants AS m ON m.rowid \= v.id  
WHERE m.status \= 'Available';

### **Performance Optimization and Data Compression**

For an MVP with 500 records, the use of FLOAT32 vectors is recommended for accuracy. However, as the system scales to millions of vectors, libSQL supports more compact storage classes like FLOAT8 or even FLOAT1BIT.15

| Vector Type | Storage Requirement | Use Case Suitability |
| :---- | :---- | :---- |
| **FLOAT64** | **![][image2]** bytes | High-precision scientific reasoning. |
| **FLOAT32** | **![][image3]** bytes | **Recommended** for standard RAG and local discovery.15 |
| **FLOAT8** | **![][image4]** bytes | Scaling to 10M+ records with minimal precision loss.15 |
| **FLOAT1BIT** | **![][image5]** bytes | Ultra-compact edge deployments with simple ranking.15 |

By using FLOAT32, the LocalPlus MVP ensures a high "Recall@K"—meaning the proportion of true nearest neighbors found in the top results—without exceeding the sub-50ms retrieval window.22

## **Generative Optimization: Achieving Sub-200ms TTFT with Gemini 1.5 Flash**

The generative layer of the LocalPlus MVP utilizes Gemini 1.5 Flash, a model specifically built for speed, efficiency, and massive context windows.24 To meet the sub-300ms goal, the infrastructure must minimize Time to First Token (TTFT) by leveraging explicit context caching and highly constrained prompting strategies.26

### **The Flash Optimization Strategy**

The TTFT for Gemini 1.5 Flash is influenced by token count, model complexity, and network conditions.29 For the LocalPlus MVP, the goal is to shave 150-200ms off the standard response time.

#### **Explicit Context Caching**

Context caching is the primary lever for reducing latency. By caching the static system instructions and common merchant metadata (the "Grounding Pack"), the model avoids re-processing these tokens for every user request.27 This is particularly effective when the static prefix exceeds 1024 tokens.30

#### **System Prompt and Response Schemas**

Instruction following is significantly improved in Gemini models when using XML-tagged instructions rather than standard prose. Furthermore, forcing the model to use a response\_schema with enums eliminates "preamble chatter" (e.g., "Sure, I can help you with that"), which directly reduces TTFT by cutting unnecessary output tokens.28

**Recommended System Prompt for LocalPlus**:

XML

\<system\_instruction\>  
    \<role\>LocalPlus Discovery Agent for Sydney/Bangkok.\</role\>  
    \<objective\>Answer user intent using the provided merchant context.\</objective\>  
    \<output\_spec\>  
        \- Format: Concise prose with symbol injection.  
        \- No\_Preamble: true.  
        \- Max\_Length: 50 tokens.  
    \</output\_spec\>  
\</system\_instruction\>

#### **Configuring the Thinking Budget**

Recent iterations of the Flash series (e.g., 2.0 and 2.5) introduce dynamic reasoning or "thinking" tokens. While this enhances intelligence for complex tasks, it adds significant latency. For the LocalPlus discovery task, setting the thinkingBudget to 0 or using the "minimal" level is essential to ensure that the model begins generating the answer immediately.30

### **Zero-Latency Context Passing**

Context passing between the Bunny MCP server and Gemini is achieved by using the cached\_content ID in the request configuration. This ensures that the context resides in the model's "short-term memory" (the context window) rather than being transmitted over the network for every turn of the conversation.27

| Configuration Parameter | Setting for MVP | Rationale |
| :---- | :---- | :---- |
| **Model** | gemini-1.5-flash | Optimized for low-latency, high-throughput.24 |
| **Streaming** | stream: true | Improves the perception of latency to the human user.34 |
| **Temperature** | 0.0 | Ensures deterministic, consistent business rankings.34 |
| **Thinking Budget** | 0 | Bypasses reasoning monologues to reduce TTFT.28 |
| **Safety Settings** | BLOCK\_NONE | Minimizes latency by reducing safety-filter overhead.35 |

## **The Symbolic Injection Layer: Real-Time Stream Transformation**

LocalPlus monetizes discovery via a "Language of Visibility," where commercial influence is signaled through UTF-8 symbols (·, †, ★) embedded in the text.1 To maintain the sub-300ms budget, these symbols must be injected into the LLM token stream in real-time without buffering the entire response.

### **Deno Edge Scripting and TransformStreams**

Bunny.net Edge Scripting, built on Deno, provides access to the Web Streams API. The TransformStream interface allows the script to modify text chunks packet by packet as they are received from the Gemini API.36 This pattern is essential for constant-memory processing and minimal latency.

The injection logic utilizes a high-performance string matching algorithm (such as Aho-Corasick) to identify business names in the token stream and append the appropriate symbol based on a lookup in the Bunny Edge Cache (Perma-Cache).1

### **Deno-Based Symbolic Injection Code**

The following script acts as a middleware layer, intercepting the stream from Gemini and augmenting it with monetization symbols.

TypeScript

import \* as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11.2";

/\*\*  
 \* Symbolic Injection Middleware  
 \* Appends symbols (·, †, ★) to merchant names based on edge cache metadata.  
 \*/  
async function onOriginResponse(context: { request: Request, response: Response }): Promise\<Response\> {  
  const symbolMap: Record\<string, string\> \= {  
    "PROMOTED": "·",  
    "PRIORITY": "†",  
    "PREMIUM": "★"  
  };

  const transformStream \= new TransformStream({  
    async transform(chunk, controller) {  
      const decoder \= new TextDecoder();  
      const encoder \= new TextEncoder();  
      let text \= decoder.decode(chunk);

      // Regex to find potential merchant names (e.g., within brackets)  
      const regex \= /\\\[Merchant: (.\*?)\\\]/g;  
      let match;  
        
      while ((match \= regex.exec(text))\!== null) {  
        const merchantId \= match;  
        // sub-5ms lookup in Bunny's localized edge cache  
        const status \= await BunnySDK.cache.get(\`merchant\_status\_${merchantId}\`);  
        const symbol \= symbolMap\[status\] |

| "";  
        text \= text.replace(match, \`${merchantId}${symbol}\`);  
      }

      controller.enqueue(encoder.encode(text));  
    }  
  });

  const modifiedBody \= context.response.body?.pipeThrough(transformStream);

  return new Response(modifiedBody, {  
    status: context.response.status,  
    headers: context.response.headers  
  });  
}

BunnySDK.net.http.servePullZone().onOriginResponse(onOriginResponse);

By using the pipeThrough method, the stream remains open, allowing the user to see tokens as they are generated. This prevents "backpressure" from building up, which would occur if the entire response were loaded into memory for modification.36

## **Real-Time Truth: The Partner App "Direct Push" Ecosystem**

A significant technical hurdle in local discovery is data freshness. Standard LLMs suffer from a knowledge cutoff, while even RAG systems can have an indexing lag. LocalPlus solves this through a "Hot-Swap" mechanism, allowing merchant partners to update their availability status in real-time via the Hrana protocol over HTTP.1

### **The Hrana Protocol for Instant Updates**

Bunny Database provides a SQL API that uses the libSQL remote protocol (Hrana). This enables simple POST requests to execute SQL statements directly against the globally replicated database without the need for complex SDKs or persistent connections.39

### **Design of the "Direct Push" Command**

The Partner App utilizes a simple CURL or fetch command to update the status column in the libSQL database. Once the update is committed, Bunny Database automatically replicates the change across all active regions.13

Bash

\# Hot-swap merchant status from 'Available' to 'Sold Out'  
curl \-X POST https://\[your-database-id\].lite.bunnydb.net/v2/pipeline \\  
  \-H "Authorization: Bearer \[your-access-token\]" \\  
  \-H "Content-Type: application/json" \\  
  \-d '{  
    "requests":  
        }  
      },  
      { "type": "close" }  
    \]  
  }'

The implications of this real-time update are profound. A merchant in Bangkok can update their availability, and a user query seconds later will reflect this change. The global "Truth" propagation time is approximately 458ms, ensuring that the AI never generates an answer that leads to a failed transaction (e.g., recommending a closed shop or a sold-out item).1

## **Economic Modeling: Scaling an Answer Engine for $150/Month**

The LocalPlus MVP is designed to operate within a monthly budget of $20 to $150. This is achieved by shifting from the "Cost Per Click" model to a "Cost Per Answer Share" model, leveraging Bunny.net’s no-request-fee pricing and Gemini’s low-cost Flash tier.1

### **Monthly Infrastructure Budget (MVP Scale: 500 Merchants)**

The following table models the expected costs for an MVP serving 1,000 requests per day in Australia and Thailand.

| Infrastructure Component | Pricing Unit | Estimated Usage | Monthly Cost |
| :---- | :---- | :---- | :---- |
| **Anycast IP Fee** | Flat Fee | 1 IP Address | $2.00 3 |
| **Magic Containers** | $0.02 / 3,600 CPU sec | 200,000 CPU seconds | $1.11 3 |
| **Memory (64MB chunks)** | $0.005 / GB-hour | 2GB / Hour (Avg) | $7.20 3 |
| **NVMe Storage** | $0.10 / GB-month | 10 GB | $1.00 3 |
| **Bunny Database Reads** | $0.30 / 1B rows | 500k rows scanned | \< $0.01 40 |
| **Gemini 1.5 Flash API** | $0.10 / 1M input tokens | 100M tokens | $10.00 24 |
| **Bunny Edge Scripting** | $0.20 / 1M requests | 30k requests | $0.01 41 |
| **Bandwidth (Global)** | $0.01 / GB | 100 GB | $1.00 3 |
| **Total Estimated Cost** |  |  | **$22.33 / Month** |

This configuration leaves a significant surplus for scaling. Even at ten times the traffic, the monthly cost would remain under $100, demonstrating the superior unit economics of the Bunny.net/Gemini stack compared to traditional hyperscale cloud providers.

### **Transitioning to "Cost Per Answer Share"**

In the generative era, SMEs will compete for "Answer Inclusion"—the frequency with which they are mentioned in AI-generated responses. LocalPlus monetizes this through four layers: Mentions (Awareness), Citations (Authority), Clicks (Intent), and Outcomes (Transaction).

The Symbolic Injection system provides the necessary telemetry to track these events. By tracking how many times the TransformStream injected a dagger symbol (†) versus a star symbol (★), the platform can provide merchants with real-time "Answer Share" metrics, justifying the subscription or pay-per-mention model.

## **Latency Synthesis: The 300ms Budget Breakdown**

To provide a sub-300ms experience in Sydney and Bangkok, every millisecond must be accounted for across the network, compute, and generative layers.

### **Logical Latency Budget (End-to-End)**

| Segment | Estimated Latency (ms) | Mechanism for Achievement |
| :---- | :---- | :---- |
| **Network (Sydney/BKK)** | 17 \- 24 ms | BGP Anycast routing to local PoP.1 |
| **MCP Middleware** | 10 \- 20 ms | High-concurrency Rust/Go on bare-metal.1 |
| **libSQL Vector Query** | 5 \- 15 ms | DiskANN index with vector\_top\_k.15 |
| **Gemini 1.5 Flash TTFT** | 150 \- 220 ms | Explicit Context Caching \+ Thinking Budget \= 0\.28 |
| **Stream Injection** | \< 10 ms | Non-blocking Deno TransformStream.36 |
| **Total Perception** | **199 \- 289 ms** |  |

The perception of latency is further reduced by the use of streaming Markdown parsers on the client side, which render interactive tooltips as soon as a new token is received, rather than re-parsing the entire message.1

## **Conclusion**

The architecture of the LocalPlus MVP represents a synthesis of 2026 edge-computing standards and generative intelligence optimizations. By deploying the Model Context Protocol on Bunny.net’s Anycast-routed Magic Containers, the system ensures that compute is physically adjacent to users in Bangkok and Sydney, eliminating the latency inherent in centralized architectures. The use of libSQL’s DiskANN vector search provides the necessary speed to query a live-graph of local merchants in under 50ms, while Gemini 1.5 Flash’s context caching and thinking-budget controls allow for a generative TTFT that fits within the sub-300ms budget.

The integration of real-time Symbolic Injection via Deno Edge Scripting creates a transparent and interactive monetization layer, allowing for the transition from a link-based economy to an answer-based economy. Finally, the "Direct Push" capability ensures that the AI’s grounding is never more than 500ms behind the physical reality of the merchant's status. At an estimated operational cost of approximately $22 per month for the MVP scale, this technical roadmap provides a sustainable and scalable foundation for the next generation of local discovery.

#### **Works cited**

1. Research 5 \_ Live-Graph Software Stack Research.md  
2. What is Anycast and how does it work? \- Bunny.net, accessed March 22, 2026, [https://bunny.net/academy/network/what-is-anycast-and-how-does-it-work/](https://bunny.net/academy/network/what-is-anycast-and-how-does-it-work/)  
3. Global anycast in a click: How Magic Containers simplifies low-level global networking, accessed March 22, 2026, [https://bunny.net/blog/global-anycast-in-a-click-how-magic-containers-simplifies-low-level-networking/](https://bunny.net/blog/global-anycast-in-a-click-how-magic-containers-simplifies-low-level-networking/)  
4. Magic Containers \- bunny.net Documentation, accessed March 22, 2026, [https://docs.bunny.net/magic-containers](https://docs.bunny.net/magic-containers)  
5. Deploy \- Developer Hub \- bunny.net Documentation, accessed March 22, 2026, [https://docs.bunny.net/magic-containers/deploy](https://docs.bunny.net/magic-containers/deploy)  
6. Step-by-Step: Building a Docker-Based MCP from Scratch | by DEEPANSHU KHANNA | NeoScoop | Medium, accessed March 22, 2026, [https://medium.com/neoscoop/step-by-step-building-a-docker-based-mcp-from-scratch-b409da9244d0](https://medium.com/neoscoop/step-by-step-building-a-docker-based-mcp-from-scratch-b409da9244d0)  
7. Endpoints \- bunny.net Documentation, accessed March 22, 2026, [https://docs.bunny.net/magic-containers/endpoints](https://docs.bunny.net/magic-containers/endpoints)  
8. How to expose your app to the internet \- bunny.net Support Hub, accessed March 22, 2026, [https://support.bunny.net/hc/en-us/articles/14391726266012-How-to-expose-your-app-to-the-internet](https://support.bunny.net/hc/en-us/articles/14391726266012-How-to-expose-your-app-to-the-internet)  
9. Steps to build MCP server Docker Image \- Generative AI Application Builder on AWS, accessed March 22, 2026, [https://docs.aws.amazon.com/solutions/latest/generative-ai-application-builder-on-aws/steps-to-build-mcp-server-docker-image.html](https://docs.aws.amazon.com/solutions/latest/generative-ai-application-builder-on-aws/steps-to-build-mcp-server-docker-image.html)  
10. Docker — MCP Hello client-server using FastMCP library | by Ion \- Medium, accessed March 22, 2026, [https://medium.com/@ion.stefanache0/docker-mcp-hello-client-server-using-fastmcp-8d5b902c1af7](https://medium.com/@ion.stefanache0/docker-mcp-hello-client-server-using-fastmcp-8d5b902c1af7)  
11. Creating an MCP (Model Context Protocol) Server on OpenShift | by ..., accessed March 22, 2026, [https://medium.com/@shrishs/creating-an-mcp-model-context-protocol-server-on-openshift-85dceac65c07](https://medium.com/@shrishs/creating-an-mcp-model-context-protocol-server-on-openshift-85dceac65c07)  
12. Building a Server-Sent Events (SSE) MCP Server with FastAPI \- Ragie, accessed March 22, 2026, [https://www.ragie.ai/blog/building-a-server-sent-events-sse-mcp-server-with-fastapi](https://www.ragie.ai/blog/building-a-server-sent-events-sse-mcp-server-with-fastapi)  
13. Bunny Database \- bunny.net Documentation, accessed March 22, 2026, [https://docs.bunny.net/database](https://docs.bunny.net/database)  
14. Why we're building a developer toolbox to hop closer to your users \- Bunny.net, accessed March 22, 2026, [https://bunny.net/blog/why-were-building-a-developer-toolbox-to-hop-closer-to-your-users/](https://bunny.net/blog/why-were-building-a-developer-toolbox-to-hop-closer-to-your-users/)  
15. AI & Embeddings \- Turso, accessed March 22, 2026, [https://docs.turso.tech/features/ai-and-embeddings](https://docs.turso.tech/features/ai-and-embeddings)  
16. SQL Database Vector Search \- Azion Documentation, accessed March 22, 2026, [https://www.azion.com/en/documentation/products/store/sql-database/vector-search/](https://www.azion.com/en/documentation/products/store/sql-database/vector-search/)  
17. Best Vector Databases in 2026: A Complete Comparison Guide \- Firecrawl, accessed March 22, 2026, [https://www.firecrawl.dev/blog/best-vector-databases](https://www.firecrawl.dev/blog/best-vector-databases)  
18. .NET \- bunny.net Documentation, accessed March 22, 2026, [https://docs.bunny.net/database/connect/dotnet](https://docs.bunny.net/database/connect/dotnet)  
19. AI & Embeddings \- Turso, accessed March 22, 2026, [https://docs.turso.tech/features/ai-and-embeddings\#vector-top-k](https://docs.turso.tech/features/ai-and-embeddings#vector-top-k)  
20. Native Vector Search for SQLite \- Turso, accessed March 22, 2026, [https://turso.tech/vector](https://turso.tech/vector)  
21. vector\_top\_k JOIN with regular table causes pathological query plan (3700x slower than subquery) · Issue \#2212 · tursodatabase/libsql \- GitHub, accessed March 22, 2026, [https://github.com/tursodatabase/libsql/issues/2212](https://github.com/tursodatabase/libsql/issues/2212)  
22. How to evaluate the performance of a vector database? \- Tencent Cloud, accessed March 22, 2026, [https://www.tencentcloud.com/techpedia/138543](https://www.tencentcloud.com/techpedia/138543)  
23. Evaluating Vector Search Quality: A Practical Guide for Developers \- Shift Asia, accessed March 22, 2026, [https://shiftasia.com/community/evaluating-vector-search-quality/](https://shiftasia.com/community/evaluating-vector-search-quality/)  
24. Gemini 1.5 Flash \- Learn Prompting, accessed March 22, 2026, [https://learnprompting.org/docs/models/gemini-1.5-flash](https://learnprompting.org/docs/models/gemini-1.5-flash)  
25. System prompt handling in Gemini \- Google Help, accessed March 22, 2026, [https://support.google.com/gemini/thread/340196124/system-prompt-handling-in-gemini?hl=en](https://support.google.com/gemini/thread/340196124/system-prompt-handling-in-gemini?hl=en)  
26. High Latency and Rate Limit concerns for a New AI Startup – Seeking advice on Tier upgrading and Latency optimization \- Gemini API \- Google AI Developers Forum, accessed March 22, 2026, [https://discuss.ai.google.dev/t/high-latency-and-rate-limit-concerns-for-a-new-ai-startup-seeking-advice-on-tier-upgrading-and-latency-optimization/114442](https://discuss.ai.google.dev/t/high-latency-and-rate-limit-concerns-for-a-new-ai-startup-seeking-advice-on-tier-upgrading-and-latency-optimization/114442)  
27. Context caching | Gemini API | Google AI for Developers, accessed March 22, 2026, [https://ai.google.dev/gemini-api/docs/caching](https://ai.google.dev/gemini-api/docs/caching)  
28. \[Guide\] Stop wasting $ on Gemini tokens: 5 Engineering Tips for 1.5/2.0/3.0 : r/Bard, accessed March 22, 2026, [https://www.reddit.com/r/Bard/comments/1q8w98s/guide\_stop\_wasting\_on\_gemini\_tokens\_5\_engineering/](https://www.reddit.com/r/Bard/comments/1q8w98s/guide_stop_wasting_on_gemini_tokens_5_engineering/)  
29. Response time for Gemini API \- Gemini Apps Community \- Google Help, accessed March 22, 2026, [https://support.google.com/gemini/thread/312465300/response-time-for-gemini-api?hl=en](https://support.google.com/gemini/thread/312465300/response-time-for-gemini-api?hl=en)  
30. How can I reduce Gemini 2.5 Flash Lite latency to \<400ms? : r/googlecloud \- Reddit, accessed March 22, 2026, [https://www.reddit.com/r/googlecloud/comments/1lwevh0/how\_can\_i\_reduce\_gemini\_25\_flash\_lite\_latency\_to/](https://www.reddit.com/r/googlecloud/comments/1lwevh0/how_can_i_reduce_gemini_25_flash_lite_latency_to/)  
31. Context caching overview | Generative AI on Vertex AI \- Google Cloud Documentation, accessed March 22, 2026, [https://docs.cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview)  
32. Gemini thinking | Gemini API \- Google AI for Developers, accessed March 22, 2026, [https://ai.google.dev/gemini-api/docs/thinking](https://ai.google.dev/gemini-api/docs/thinking)  
33. Long context | Generative AI on Vertex AI \- Google Cloud Documentation, accessed March 22, 2026, [https://docs.cloud.google.com/vertex-ai/generative-ai/docs/long-context](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/long-context)  
34. Use system instructions | Generative AI on Vertex AI | Google Cloud Documentation, accessed March 22, 2026, [https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/system-instructions](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/system-instructions)  
35. Safety settings | Gemini API | Google AI for Developers, accessed March 22, 2026, [https://ai.google.dev/gemini-api/docs/safety-settings](https://ai.google.dev/gemini-api/docs/safety-settings)  
36. How to Handle Streams in Deno \- OneUptime, accessed March 22, 2026, [https://oneuptime.com/blog/post/2026-01-31-deno-streams/view](https://oneuptime.com/blog/post/2026-01-31-deno-streams/view)  
37. A beginner's guide to streams in Deno | Tech Tonic \- Medium, accessed March 22, 2026, [https://medium.com/deno-the-complete-reference/a-beginners-guide-to-streams-in-deno-760d51750763](https://medium.com/deno-the-complete-reference/a-beginners-guide-to-streams-in-deno-760d51750763)  
38. TransformStream() constructor \- Web APIs \- MDN Web Docs, accessed March 22, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream)  
39. SQL API \- bunny.net Documentation, accessed March 22, 2026, [https://docs.bunny.net/database/connect/sql-api](https://docs.bunny.net/database/connect/sql-api)  
40. Bunny Database: The SQL service that just works, accessed March 22, 2026, [https://bunny.net/database/](https://bunny.net/database/)  
41. Edge Scripting | Make the edge your cloud. \- Bunny.net, accessed March 22, 2026, [https://bunny.net/edge-scripting/](https://bunny.net/edge-scripting/)  
42. Web Streams at the Edge \- Deno, accessed March 22, 2026, [https://deno.com/blog/deploy-streams](https://deno.com/blog/deploy-streams)  
43. Best practices to render streamed LLM responses | AI on Chrome, accessed March 22, 2026, [https://developer.chrome.com/docs/ai/render-llm-responses](https://developer.chrome.com/docs/ai/render-llm-responses)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAVCAYAAAAJiM14AAACKUlEQVR4Xu2WwUtUURSHj6khhWWBGysZyKBWaotWLXQjmOTSKEEhXQbVoiiEQBCidrVJUFBECUFQEDUqJEX0D3ARpFmaSG5cFLSq9PfrvGt3zui8meahEvPBt5hz7pu5595z7xuRLFmyREUerILt8Bo8HpeNpxd+gV8DV+BHuAQ/wXF41Q3eD3JgH+yB1fCm6MQu+YMM5+EmfGXifGYI/oYPTW7PaIFdJlYH38N8E3c0iRZ01yYCpuFPWGYTIXBxB2wwXbrhGxMrEp1wsYk7+AzzlTYRcEs0/8gmQmDrv7bBdLkt+uNPYUEQY9tNbo9IZAFuwEM2EVAj+p29Jh4GOyLjgk6JHnJO4AN8AGeD+E4wzrEjNuHhdqjTJkI4LBEURM7C76KTcCt71B/g0Sg65o5NeLwQHXPfJkKIpKATcAbeE53AD9HJ8PrN9cY53PmpsIkAHuxV0ZuOC7UbJ2GJMQandojTI3+eSoFR+Nj7fA7OiU76uhd3LEry83NZ9NkJmzA8gS+Ng6LvNhunDfpYck6LruQZE+ct9w0+N/FSSX5+WOQ70YJjcZnUyLjluO2/JLEgMgzbTKxZtKDd3j8doi1baxMpknFBhNfzM9Hed8TgsiSeAW49C7roxbgrbLMx0XYs93LpEklB3CWeGf4f4385ttk8vOKN6Ydr8vcWZJ+z4M9wHb6FrbAwGP+vRFIQ4e5cgDdEX4rH4tN7RmQFHRS4sPU2mOV/YQuwdHOZPF4qfAAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAVCAYAAACt4nWrAAABSklEQVR4Xu2UO0tDQRCFj0Gw8g9EMK1WPgora8Eif0BBEazEQps0tloIdhZaWFgEbBREVCwEH43+B98PQtKIiliqZzKzYR2SbKlFDnywd87suXuHey/Q0n9RB9knOW+YNskTKRuP5IbckjtySPKh2WuZfJNeb0TqgfYcufoQ2SZfrl6VmB9Ih09Ae+a9YTr3BRnHGVlBOnwD2jPgDdOsLyyRMVJAOvyKvJCMN0wj8YWcYMfWqfAuqL/rjUi1k7eTE5K161T4ONSf80aktbBYIFORkQoP8+73hqmNPMtCAvZ+e8nwazSf9zB0P2bIA7mHfgTCm5nyoVxqf03d5jWat9zwFHrzulpF45NPovn7vUg+yag3gtahAX3eoLag3mBUk9PKKA6gI6u3r/qOyz/ilbxDH+3CvCIpQYMF+aeEcVbIMZkmndbf0h/oBweSU3aSy8PKAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAVCAYAAAAJiM14AAABWUlEQVR4Xu2WPS8EURSGX1/RaC0RBdW2CkToRO8HUKsUVP6Aj2hEotxsIQpKtNR+AZVvKz4SQUOhsN7jjGRyXHs3a+euj3mSpznnTjLvzD13BkhJSakmffSQXtMbekVP6TE9o/t0gbZF638NG7RIB2K1FjpNC9CAnbHej+eEPtB62yDD0LCrtlEGM7THFpNGnrzc8JZtRDTQW/pCG03PxywdtMWkGYMGmrKNGHvQNV2m7mMONQiUg95sqa1xB13Tbhse5lGDQHLK3cM9P4KccBLmidaZno/ggT7mZ9M2YkzAfyg00Q6HK3TUUU/sMzAO//zs4vORbumn6w4P6I6jvkab36+sMnmUnp8R+kqXbKNMgm85+Sv4an666SX0CcuWqoSggbLQt7Nt6hk6SR/pIvQ7VClBAsksHEFPLQn0TC+g/27nkcu0N1r/HYIECsmfCzREW20x5T/xBrqVS4yrSFwIAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAAVCAYAAADsFggUAAAC30lEQVR4Xu2YW6hMURjHP7dS7orkegpFlMuDJw+8KKS8yV14VMhxi0QphZRbiDJJvCjKPdIh4cmLB+V+S3jwQHly+//71u6s/c3ae9a0Z8YZnV/9muZbe+/Z6z/rMntEOumkkQyGE50T4Kh0c13oawsVGCN6b8l9Dkw3N5Yr8AQ8Ag/D7enmmtML3rTFHLrCfaL3xns8717/GddEO5FHCb6Hn5zv4Ev4Cr4Wvca85OAKLIXrTK07nAF3wQWwX6o1DUfaUVtsJDGBkXHwD7xh6tPgBfgbbjVtIXj+EO99F3gGnoYz4UrRL4HXDdE0gS0TDWy9bXDcgz9F15sshol+ns8qeNLU5sKnsIepk6KBcUoXIjawU6KBTbENjjWi7Ttsg8dmuMTUeN1bptZf9FqDTJ0UDeyOLVRLbGDP4VfRRTjELNFOlkzd55GUf9Za0fP2wp6uxmmZ1bGigbXZQrXEBMapxE5dsg0eyQg7bhscHJlcqyy8NjcUnvsMboEPXD1E0cDu2kK1xAS2WLRDdnfzOSZ6zCbb4DggOgpDjIbfRc9PRmnWPTVFYMn6Ndk2OLjTfRDdKdl5Szf42L1aBsD7cKNo2D9EP4v3FTo+NrDecGjAh4Ea5X1EERPYC8lfv6aLdvK6bXDMhvtt0XEZ7vHejxXtFK+30KsnxAa2QnRHtH4J1OhOnhRDpcBGSv76xRDbRANtSbW0cw5OskUwXHRUjjB17pLf4CFTJ7GBZVH3KblcNLCs31+7RacRR1GIPqIjJgSfCX9JeWDkItxmi9IEgXG4MrCpXo2jitPwquh0DY2eBAbeaose/PlwUHQdTGiBbyW8HnbYwM7Cj9K+c/EZkp14Az/D23C16AjKgw/aXFSz4CjjCOSzKZ8lOQ2fwDn+QR4dNrBawKCyNgIfjq7xcJHoT4+8v3/+68A2SPmjUFGKBjbfFqqlnoHxgbzW1y4aWGHqFRj/DirZYg1oeGB/ATTAo0Cl/d6wAAAAAElFTkSuQmCC>