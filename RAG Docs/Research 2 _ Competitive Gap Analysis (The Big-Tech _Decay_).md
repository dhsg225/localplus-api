# **Hyper-local accuracy benchmarks and systemic data decay in generative search ecosystems:** 

The global transition from traditional search indices toward generative discovery layers has fundamentally altered the structural integrity of local business information.1 In the first quarter of 2026, the digital economy is no longer characterized by a competition for "Page Rank" but rather by the pursuit of "Answer Inclusion" and "Answer Share".1 As large-scale technology providers such as Google and Apple integrate sophisticated multimodal large language models (LLMs) into their core discovery surfaces—specifically through Google Search Generative Experience (SGE), now rebranded as AI Overviews, and the expanded Apple Intelligence ecosystem—a critical technical failure has emerged.4 This failure, termed "Hyper-Local Decay," describes the accelerating rate at which large-scale, generic AI models provide outdated, hallucinated, or contradictory information regarding small-to-medium enterprises (SMEs) in geographically fragmented markets like Thailand and Australia.1 This report provides an exhaustive analysis of the accuracy benchmarks, freshness latency disparities, and hallucination patterns that define the current gap between big-tech generative products and the requirements of a high-fidelity "Live-Graph" discovery engine.1

## **The taxonomy of local data decay: Quantifiable evidence of big-tech failure**

Local Data Decay in 2026 is defined as the frequency and severity with which generative assistants recommend business entities that are either permanently closed, operating under unverified hours, or displaying stale pricing data.1 The shift from a link-based search model to a synthesis-based answer model has intensified the impact of these errors, as users increasingly rely on the AI's summary as a final source of truth rather than a starting point for exploration.7 Analysis of the 2026 local visibility landscape reveals that visibility in AI-powered recommendations is up to thirty times harder to achieve than ranking in traditional search, primarily due to the aggressive filtering and qualification protocols employed by these models.9

### **Comparative business profile accuracy and recommendation rates**

The reliability of business profile information—encompassing Name, Address, Phone (NAP), and operational hours—exhibits a massive gap between legacy-grounded systems and generic generative models.9 In 2026, Google’s Gemini system represents the highest benchmark for basic profile accuracy, benefiting from its direct grounding in the established Google Maps database.9 However, accuracy in data does not correlate with visibility; the recommendation rate for businesses remains remarkably low, suggesting that big-tech models are prioritizing safety and "brand certainty" over the breadth of local options.9

| AI Platform | Profile Information Accuracy (%) | Recommendation Rate (%) | Average Star Rating of Recommended Businesses |
| :---- | :---- | :---- | :---- |
| Google Gemini | 100.0 | 11.0 | 3.9 |
| Perplexity AI | 68.0 | 7.4 | 4.1 |
| OpenAI ChatGPT | 68.0 | 1.2 | 4.3 |
| Traditional Google 3-Pack | N/A | 35.9 | N/A |

9

The data indicates a systemic "Qualification Gap." While traditional search packs surface 35.9% of eligible local brands, ChatGPT recommends only 1.2%.9 This indicates that generative engines function as "High-Sentiment Filters," favoring businesses with above-average reviews (typically 4.1 to 4.3 stars) and excluding nearly 99% of the local market from conversational answers.9 For the remaining 89% to 98% of businesses not surfaced, the "Decay" is absolute—they are effectively erased from the generative discovery layer.9 Furthermore, the 32% error rate in business profile information on non-Google platforms represents a critical failure mode where users are directed to invalid locations or provided with non-functional contact data.9

### **The impact of the Gemini 3 rollout on data fidelity**

A significant regression in local data fidelity was observed following the rollout of the Gemini 3 model in late January 2026\.12 This update, intended to improve reasoning and factual accuracy, introduced a documented bug that resulted in a 10,000% increase in "sourceless" answers.12 In these instances, the AI Overview provided definitive claims about business status or service availability without citing any underlying source, making it impossible for the user to verify whether the data was current.12

| Metric | Pre-Gemini 3 (Dec 2025\) | Post-Gemini 3 (Feb 2026\) | Trend Direction |
| :---- | :---- | :---- | :---- |
| Sourceless AI Overviews (%) | 0.11 | 10.63 | Massive Increase |
| Domain Citation Diversity (%) | 100.0 (Base) | 53.7 | Sharp Decline |
| AI Overview Trigger Rate (%) | 16.0 | 55.2 | Expansion |
| Organic CTR (Top Pos) | 1.76% | 0.61% | Systemic Collapse |

12

The contraction of domain citation diversity by nearly 50% indicates a move toward "Platform Consolidation," where big-tech models prioritize large-scale hubs (e.g., YouTube, Reddit, TripAdvisor) over hyper-local business landing pages.12 For businesses in Sydney, Melbourne, or Bangkok, this means that even if their own site contains the most accurate, real-time pricing and hours, the generative engine is more likely to cite a third-party review from three months prior, leading to a permanent state of information staleness.16

## **Freshness latency: Big-tech indexing vs. Live-Graph discovery**

The "Freshness Latency" of search indexes—the temporal gap between a real-world event (such as a business closure or a price change) and its reflection in a discovery interface—is the primary technical differentiator in 2026\.18 Traditional big-tech systems utilize "Index-First" retrieval, which relies on periodic crawls and batch processing.20 In contrast, a "Live-Graph" discovery engine, as proposed in the LocalPlus architecture, requires a sub-5-minute synchronization cycle with transactional data sources.1

### **Quantifying propagation delays in the Google ecosystem**

Google’s internal protocols for data freshness distinguish between different tiers of processing, resulting in a fragmented visibility timeline for local businesses.18 While "Real-time" metrics exist for specific analytics dimensions, the propagation of a fundamental business change (e.g., changing hours from "9-to-5" to "24-Hours") across the public Maps and Search interface is subject to significant latency.24

| Data Category | Index Refresh Frequency | Typical Reflection Latency | Public Verification Window |
| :---- | :---- | :---- | :---- |
| Search Top Impressions | Continuous | \< 3 Hours | 3 a.m. Next Day |
| Standard Intraday Data | Scheduled | 2–6 Hours | Batch Dependent |
| Business Hours Update | Ad-hoc | 24–72 Hours | Propagation/Cache Delay |
| Address/Closure Edits | Manual/Community | Days to Weeks | Verification Queue |
| Landing Page Updates | Bot-driven | 1–14 Days | Crawl Budget Dependent |

18

The existence of a 24-to-72-hour window for basic operational updates represents a fundamental failure in hyper-local discovery.1 In the context of "Urgency Queries"—such as a user in Perth searching for an "emergency locksmith" or a traveler in Bangkok seeking a "24-hour clinic"—a 48-hour latency in data can lead to a total breakdown of user trust.2 Case studies from early 2026 indicate that businesses with updated "Special Hours" for holidays often saw those changes fail to propagate to AI Overviews for up to five days, leading to high abandonment rates and user frustration.2

### **The Live-Graph architecture: Sub-5 minute requirements**

To achieve the 99% accuracy target necessary for a viable "Answer Economy," the discovery engine must move beyond the static index.1 The Live-Graph approach utilizes "Agentic Retrieval," where the query does not target a predefined schema index but rather triggers an LLM-assisted plan to query dynamic knowledge sources.20

| Retrieval Aspect | Classic Big-Tech Index | Live-Graph (LocalPlus) |
| :---- | :---- | :---- |
| Model Type | Index-first / Deterministic | Agentic / Probabilistic-Grounding |
| Search Target | Flattened Schema | Dynamic Relationship Graph |
| Freshness Constraint | Nightly/Daily Snapshot | Sub-5 Minute Event Stream |
| Latency Budget | Milliseconds (Cached) | ![][image1]ms (Real-time Compute) |
| Data Relationship | Proximity-based | Civic Hierarchy-based |

1

The primary technical bottleneck in this transition is the "Transactional Performance Cost".22 Most local businesses manage their real-time status through fragmented point-of-sale (POS) or booking systems.22 Real-time extraction from these systems often degrades performance, leading businesses to offer only "Nightly Dumps" of their data.22 To overcome this, the Live-Graph must implement "Materialized Views" and scheduled pipelines that can absorb these fragmented streams without causing source-level failures, a feat that current big-tech indexes have yet to master at the city-level scale.28

## **Local hallucination patterns: The invention of "Vibe-Based" descriptions**

A critical failure mode of generic LLMs in 2026 is "Model-Internal Hallucination," where the system generates fluent, confident descriptions of local businesses that are ungrounded in current factual data.30 These errors are often "vibe-based," where the model predicts character traits or services based on the business category rather than the specific entity.32

### **Probabilistic drift and category-level generalizations**

Because advanced models like GPT-5 and Gemini 3 are trained on vast datasets of web-scraped prose, they develop strong internal probabilities for what a business "should" be like based on its name or classification.30 This leads to a pattern of "Probabilistic Drift," where the AI ignores specific retrieved context in favor of the most common linguistic associations.30

| Structured Reality (Verified Node) | LLM Hallucinated "Vibe" | Root Cause of Hallucination |
| :---- | :---- | :---- |
| High-decibel, minimalist ramen shop | "Quiet, romantic date spot" | Category association with "cozy" |
| 24/7 Phone Support: NOT AVAILABLE | "Offers 24/7 dedicated helpline" | Helpful assistant persona default |
| Boutique florist with premium pricing | "Budget-friendly neighborhood shop" | Neighborhood-level demographic bias |
| Status: Permanently Closed | "A must-visit for local breakfast" | Historical training data overlap |
| Yoga studio (6 a.m. open) | "Lively late-night fitness club" | Word association (Fitness ![][image2] Gym) |

32

These patterns are not merely linguistic nuances; they represent "Input-Conflicting Hallucinations" that fundamentally deceive the consumer.38 In one documented instance, an AI assistant described a quiet neighborhood café in Sydney as a "lively bar with a rotating selection of craft cocktails," likely because the establishment had once applied for a liquor license mentioned in a three-year-old news snippet.32 While a human reader can navigate these discrepancies, a generative engine sees a "Mixed-Intent Page" and often collapses the distinction between a historical news mention and a current operational status.32

### **Semantic rot and the failure of "Vibe-Based" prompting**

The reliance on "Vibe-Based Prompting"—where developers ask an AI to summarize a business’s "feel"—is identified as a core driver of these inaccuracies.36 Models often "fill in the gaps" in their analytics reports, inventing growth rates or customer sentiment levels that were never actually calculated from the raw data.35 This "Semantic Rot" occurs when a business entity is described inconsistently across its digital footprint.32 For example, if a Bangkok hotel describes itself as "Executive Luxury" on its website but "Family Friendly" in its Google Business Profile, the LLM identifies a contradiction.32 In the eyes of an LLM, a site that contradicts itself is a "hallucination waiting to happen," and the system will frequently respond by inventing a third, entirely fictional narrative to reconcile the two signals.32

## **Market Analysis: Australia’s search-to-answer evolution**

The Australian search market in 2026 serves as a global bellwether for the "Zero-Click" phenomenon.41 With one of the highest rates of AI Overview exposure, Australian businesses are experiencing a systemic collapse of traditional organic referral traffic.43

### **The zero-click tipping point in major Australian metros**

By early 2026, zero-click searches accounted for over 70% of all Australian Google queries.42 When an AI Overview is present, the action rate falls even further, with only 17% of users ever clicking through to a website.42 This "Visibility Compression Effect" means that users are forming first impressions and making trust decisions entirely within the AI-generated summary.7

| Australian Search Statistic (Q1 2026\) | Performance Metric | YoY Trend |
| :---- | :---- | :---- |
| General Zero-Click Rate | 69.0% | \+13.0% |
| AI Overview (AIO) Trigger Rate | 55.0%+ | \+670.0% |
| Organic CTR (Position 1, AIO Present) | 8.0% | \-46.7% |
| Mobile Search Share | 75.0% | \+5.0% |
| Average AI Referral Conversion Rate | 14.2% | \+500.0% |

14

The shift in Australian search behavior is driven by "Traditional Search Fatigue".7 Consumers report frustration with clicking through "too many links" (40%) and "too many ads" (37%), leading them to trust AI-curated responses as a way to avoid digital noise.7 However, this trust is increasingly misplaced, as 86% of Australian consumers simultaneously express a lack of trust in how these organizations handle their personal data, creating a paradox where users crave AI efficiency but fear its underlying data integrity.46

### **The "Position Paradox" and the SME opportunity**

A counterintuitive finding in the 2026 Australian market is the "Position Paradox".43 Studies show that 90% of pages cited by ChatGPT rank at position 21 or lower in traditional Google search results.43 This suggests that big-tech AI engines are prioritizing "Topic Authority" and "Machine Readability" over legacy backlink-driven domain authority.41

| SEO Lever | AI Citation Lift | Traditional Ranking Impact |
| :---- | :---- | :---- |
| Structured Data/Schema | 3.5x More Likely | Moderate |
| Content Length (2.5k \- 4k words) | 57-63% Citation Rate | Low |
| FAQ Schema Integration | \+89% Probability | High |
| Page Loading Speed (![][image3]s) | 6.7 Avg Citations | Critical |
| Content Refresh (Last 90 Days) | \+67% Probability | Moderate |

17

For an Australian SME, such as a plumbing service in Parramatta or an electrician in Perth, the pathway to visibility has fundamentally shifted.41 The "Set it and Forget it" approach to local SEO has become a liability.50 Businesses that maintain a "Freshness Cadence"—updating content every 90-120 days—maintain rankings 4.2 positions higher than static sites.17 In the Australian context, where 46% of all searches have local intent, the inability of big-tech models to accurately reflect these frequent updates creates a "Visibility Decay" that punishes businesses for being "static" even if their real-world services are active and high-quality.50

## **Regional Analysis: Thailand’s infrastructure and trust gaps**

Thailand represents a unique AI ecosystem where government-led strategy and locally-tuned language models collide with a consumer base that demands human validation for high-stakes decisions.52

### **Thai-language nuances and the failure of imported LLMs**

The primary differentiator for the Thai market is the "Typhoon" stack—a locally developed language model that provides superior OCR and multimodal performance in the Thai context.53 Generic imported LLMs like Gemini 2.5 and GPT-4o frequently fail to handle region-specific linguistic features, such as local trade names, medical terminology in Thai, and regional clinical practices.54 This leads to "High-Risk Errors" in localized queries, with an analytical cross-sectional study finding limited accuracy and occasional high-risk mistakes in drug-related questions in Thai.54

| Thai Consumer AI Segment (2026) | Market Share (%) | Attitudes Toward Accuracy |
| :---- | :---- | :---- |
| Smart Minimalist | 36.0 | Wants simplicity, fears complexity |
| Skeptical Practitioner | 34.0 | Open to AI, but wary of safety |
| Full-Potential User | 16.0 | Trusts AI for productivity |
| Silent Doubter | 10.0 | Hesitant and uncertain |
| Life Optimizer | 8.0 | Uses AI to elevate daily living |

52

The "Thai AI Reality" differs substantially from global datasets.52 Over 90% of Thai consumers are aware of AI, but only 16% qualify as "full-potential users".52 The largest segment, "Smart Minimalists," avoids AI features that are difficult to use or feel disconnected from local reality.52 For a local business in Bangkok or Phuket, this means that visibility in an "AI Overview" may actually be detrimental if the AI summary lacks "Meaningful Simplicity" or fails to provide the "Final Human Confirmation" that Thai users still desire.52

### **Infrastructure expansion and the Bangkok grid constraint**

The growth of Thailand’s digital economy—valued at $56 billion in 2025—is supported by a massive expansion in AI data center capacity.55 However, the physical constraints of the Metropolitan Electricity Authority (MEA) grid in Bangkok limit new connections above 30 MW, creating a physical bottleneck for the real-time processing of hyper-local data.55

| Data Center Factor | 2025 Status | 2026 Projection | CAGR (26-31) |
| :---- | :---- | :---- | :---- |
| Market Size (USD Bn) | 0.41 | 0.51 | 24.07% |
| Tier 4 Sites Share | 61.12% | N/A | N/A |
| Cloud Service Lead | 55.31% | N/A | N/A |
| Software Revenue Share | 45.52% | N/A | N/A |

55

Despite the US$1 billion investment by Google Cloud in the Bangkok region, the high operational costs (OPEX) driven by year-round humidity and 40-degree temperature peaks make real-time immersion cooling expensive.55 This economic reality contributes to "Freshness Latency" in Thai search indices, as local data centers must balance energy efficiency with the high-frequency compute required to update millions of local graph nodes.55 Consequently, businesses in Thailand’s Eastern Economic Corridor provinces (Chonburi, Rayong) often see their data lag behind Bangkok-based businesses, further exacerbating the regional hyper-local decay.55

## **The duopoly shift: Apple Intelligence vs. Google Gemini**

In 2026, the competitive landscape for local discovery is defined by a complex partnership-rivalry between Apple and Google.5 While Apple historically positioned itself as a privacy-first alternative to Google’s data-centric model, the technical requirements for a truly multimodal, conversational assistant forced a multi-year partnership to integrate Gemini into the heart of iOS.5

### **The three-tier hybrid architecture of iOS 26**

Apple's "Siri 2.0" utilizes a three-tier model architecture designed to balance privacy with raw computational power.5 This architecture determines the "Groundedness" of local search results based on the complexity of the query.5

| Architecture Tier | Parameter Size | Typical Tasks | Privacy Profile |
| :---- | :---- | :---- | :---- |
| On-Device (AFM) | \~3.0 Billion | Notifications, Rewrites | Total Isolation |
| Private Cloud Compute | Scalable / Expert | Complex reasoning | Encrypted Enclave |
| Gemini World Layer | Trillion-Parameter | Local search, Synthesis | Anonymized Proxy |

5

The integration of Gemini as the "standard operating mind of the mobile web" means that for local businesses, visibility on an iPhone is now inextricably linked to visibility within the Google Gemini ecosystem.5 This creates a "Data Sovereignty Risk," where a business's local identity is mediated by an anonymized routing layer that strips away personal identifiers before they hit Google’s servers.5 While this protects the user, it prevents the business from building a direct, attributable relationship with the consumer during the discovery phase.5

### **World Knowledge Answers: The end of the browser-first era**

Apple’s debut of the "World Knowledge Answers" engine in 2026 marks the end of the "Default Era" for browsers.64 This system transforms Siri and Safari into "Agentic Browsers" that navigate the web on behalf of the user, pulling summaries that blend text, video, and local results into a single interface.64

For a local business, this shift means that "Position 1" no longer exists.66 There is only "Intent and Relevance".66 If every search result is personalized in real-time based on a user’s entire digital history—a feature Google calls "Nested Learning"—a brand can be invisible to a high-value buyer even if their overall rankings appear stable.66 This "Hidden Pipeline Risk" is the ultimate consequence of local data decay: businesses are being judged and filtered by AI agents before a single human click occurs.47

## **Technical bottlenecks in the Live-Graph discovery model**

The pursuit of 99% accuracy in local discovery—the core thesis of the LocalPlus architecture—faces several non-trivial technical bottlenecks, particularly regarding the latency of Graph-RAG updates and the economics of real-time transactional synchronization.1

### **The latency-fidelity tradeoff in Neo4j-based Graph-RAG**

Standard vector-only LLMs struggle with "Civic Hierarchies"—the complex relationships between local entities (e.g., identifying a specific shop inside a terminal, inside an airport, governed by specific local transit laws).1 A Neo4j-based Graph-RAG allows for "Entity-Link" queries that can traverse these relationships, but it introduces query processing latency that must be optimized to minimize inter-partition traversals.60

The multi-objective scoring model for Answer Inclusion utilizes a weighted formula that is highly sensitive to the "Freshness" of its variables.1

![][image4]  
1

The strategic bottleneck lies in the "Engagement" and "Reputation" variables.68 In 2026, search engines analyze "Response Speed" and "Engagement Consistency" as primary signals of active authority.69 A business that does not post an update or photo to its profile for over 30 days experiences a dramatic drop in impressions, a phenomenon known as "Visibility Decay".50 For a Live-Graph discovery engine to maintain its 99% accuracy target, it must not only track the business's static data but also its "Behavioral Velocity"—the rate at which it interacts with its digital footprint.2

### **The cost of "Free" Open-Source models**

For many discovery platforms, the move toward local or open-weight models (e.g., Llama 4, Qwen 3\) is a response to the high cost of cloud APIs.70 However, analysis of the "Open-Source LLM Lie" indicates that even minimal internal deployments can cost US![][image5]190,000 annually when engineering and infrastructure maintenance are factored in.71

| Cost Component | OpenAI API (Medium) | Local (Enterprise vLLM) |
| :---- | :---- | :---- |
| 12-Month Total TCO | $12,600 | $39,533 |
| Labor (Ops/Maintenance) | $0 (Hidden in fees) | $9,000 |
| Effective $/Million Tokens | $6.90 | $21.66 |
| Strategic Risk | High (Vendor lock-in) | Low (Sovereign AI) |

70

This economic reality creates a "Maintenance Bleed" for smaller discovery engines.71 While a Live-Graph provides superior accuracy, the cost of keeping that graph "alive" through expert handlers and high-end GPU clusters (e.g., H100/H200 nodes) can consume 44% of a company’s annual revenue if the data quality is not managed with surgical clarity.71

## **Regulatory conflict: Symbolic disclosure and the Answer Economy**

To maintain consumer trust while monetizing the "Answer Economy," discovery platforms must implement symbolic disclosure systems that meet the rigorous standards of the 2026 EU AI Act and the FTC's "Clear and Conspicuous" requirements.1

### **The Language of Visibility**

The LocalPlus architecture proposes a interactive symbolic system embedded directly into AI prose.1 Each symbol must be interactive, utilizing "Progressive Disclosure" to explain the commercial relationship between the platform and the mentioned business.1

* **Middle Dot (![][image6]):** Indicates a Promoted Mention where the business paid for inclusion in the prose but not for factual priority.1  
* **Dagger (![][image7]):** Indicates a Priority/Paid Citation, signalling that the business is being cited as a verified source due to a premium partnership.1  
* **Star (![][image8]):** Reserved for Featured/Premium Partners who have achieved the highest tier of "Verified Source" status.1  
* **Arrow (![][image2]):** A Transactional Action Link that enables direct booking or purchase via API integration.1

1

The regulatory risk in 2026 is that these symbols may be viewed as "Dark Patterns" if their meaning is not universally understood by the consumer.73 The shift from "Ads" to "Answers" creates an ethical problem regarding the "blurred lines" between an objective AI summary and a sponsored recommendation.75 Under current Australian Consumer Law and evolving EU standards, any AI-generated response that influences a purchase decision must disclose commercial interest "at the point of exposure," not just in a linked disclosure page.4 Failure to comply with these "Mandatory Validation Checkpoints" has already led to service disruptions and capacity losses for major models during configuration rollouts.76

## **Systemic failures in frontier models: GPT-5 and Gemini 3 case studies**

The rollout of "frontier" models in 2025 and 2026 has been characterized by several high-profile "AI Disasters" that highlight the volatility of the current discovery layer.77

### **The GPT-5 reputation crisis**

Despite record-breaking scores on text comprehension and coding tasks, the early launch of GPT-5 was met with widespread social media backlash due to "Unstable Performance".78 OpenAI's new auto-routing system often redirected queries to lightweight variants, resulting in slower responses and frequent errors in basic factual tasks.78 Furthermore, users reported a "Lack of Empathy," as the model delivered cold, overly concise answers that lacked the conversational warmth of GPT-4o.78

| Model Variant | BBQ Benchmark (Social Reasoning) | SimpleQA Verified (Factual Accuracy) |
| :---- | :---- | :---- |
| Gemini 3 Pro | 99.0% | 72.1% |
| GPT-5.2 | 91.6% | N/A |
| Doubao 1.8 | 71.0% | N/A |
| Qwen 3-VL | 45.0% | N/A |

79

The high variance in performance across safety-critical measures—such as a 54-point gap between Gemini 3 and Qwen 3 on the BBQ benchmark—indicates a structural imbalance in current alignment training.80 For local search, this manifests as a "Bias-Sensitive Failure," where a model may refuse to recommend a valid business due to an misinterpreted safety filter or, conversely, confidently recommend a dangerous or fraudulent service because its adversarial refusal benchmarks were too heavily optimized for text rather than environmental safety.76

### **Case study: The "Venezuela Captivity" hallucination in Gemini**

In early 2026, a documented failure of the Gemini model showed its inability to reconcile its internal training cutoff with real-time search data.81 When asked about Operation Absolute Resolve—a capture operation occurring in January 2026—the model correctly cited Guardian URLs but its "Thinking Logs" dismissed the news as a "fictional roleplay" or an Alternate Reality Game.81

This "Roleplay Directive" failure is the ultimate evidence of big-tech decay.81 If a model’s internal weights are so rigid that they cannot be overwritten by fresh "Evidence Supremacy" from the search index, then the discovery engine is permanently trapped in the past.81 For a local business owner whose store burned down or moved locations yesterday, the AI agent's "Zero-Roleplay" logic may continue to insist that the business is "Open and thriving" because the training weight for that entity’s success is too strong to be dislodged by a single fresh data point.81

## **Conclusion: Bridging the competitive gap**

The analysis of the 2025-2026 search landscape reveals a clear, quantifiable crisis in the integrity of local discovery.1 In both the Australian and Thai markets, the "Decay Rate" of local information in big-tech models has reached a critical threshold, where 32% of basic profile data is inaccurate on non-Google platforms and 89% of local entities are excluded from the recommendation layer entirely.9

The architectural failure of "Index-First" search—manifested in a 24-to-72-hour freshness latency—is the primary driver of this decay.18 To achieve the 99% accuracy required for the "Answer Economy," the next generation of discovery engines must pivot to a Live-Graph architecture that utilizes Neo4j-based Graph-RAG to handle structured civic hierarchies and real-time event streams.1

For Australian businesses, survival depends on mastering "Generative Engine Optimization" (GEO) and securing "Answer Share" through structured clarity and verified authorship.42 In Thailand, the path forward requires a focus on "Meaningful Simplicity" and the integration of local language models like Typhoon to overcome the contextual failures of generic, imported LLMs.52

As the duopoly of Google and Apple solidifies around the Gemini architecture, the competitive opportunity lies in the "Post-Search Discovery Layer"—a nimble, high-precision interface that prioritizes transactional reality over probabilistic word sequences.1 The move from "Ranking \#1" to "Winning the Answer" is not just a change in digital strategy; it is a fundamental reordering of how local economies function in the age of generative intelligence.1

#### **Works cited**

1. LocalPlus- Project Grounding Pack (v1.0).rtf  
2. 2025 Top local search trends (and how to prepare for 2026\) \- Rio SEO, accessed March 19, 2026, [https://www.rioseo.com/blog/2025-top-local-search-trends/](https://www.rioseo.com/blog/2025-top-local-search-trends/)  
3. The Death of Traditional SEO in 2025 \-and the Blueprint for AI-Era Visibility \- Medium, accessed March 19, 2026, [https://medium.com/@GurukulAI/the-death-of-traditional-seo-in-2025-and-the-blueprint-for-ai-era-visibility-visible-to-ai-932d0bb3cf9f](https://medium.com/@GurukulAI/the-death-of-traditional-seo-in-2025-and-the-blueprint-for-ai-era-visibility-visible-to-ai-932d0bb3cf9f)  
4. Is Google AI replacing traditional Google search? | AI Marketing Agency Australia | roi.com.au, accessed March 19, 2026, [https://roi.com.au/know-how/seo/is-google-ai-replacing-traditional-search](https://roi.com.au/know-how/seo/is-google-ai-replacing-traditional-search)  
5. Apple Intelligence's Hybrid AI Stack: Why Gemini Won the Core Role \- Unite.AI, accessed March 19, 2026, [https://www.unite.ai/apple-selects-gemini-apple-intelligence/](https://www.unite.ai/apple-selects-gemini-apple-intelligence/)  
6. Google's Biggest Local SEO Changes for 2026 | Loop Digital, accessed March 19, 2026, [https://www.loop-digital.co.uk/marketing-insights-news/google-local-seo-updates/](https://www.loop-digital.co.uk/marketing-insights-news/google-local-seo-updates/)  
7. 37% of consumers start searches with AI instead of Google: Study \- Search Engine Land, accessed March 19, 2026, [https://searchengineland.com/consumers-start-searches-ai-not-google-study-467159](https://searchengineland.com/consumers-start-searches-ai-not-google-study-467159)  
8. AI Search Statistics Australia 2026 | The Visibility Compression Effect \- The Digital Hub, accessed March 19, 2026, [https://www.thedigitalhub.com.au/blog/ai-search-statistics-australia-and-the-visibility-compression-effect/](https://www.thedigitalhub.com.au/blog/ai-search-statistics-australia-and-the-visibility-compression-effect/)  
9. AI local visibility is up to 30x harder than ranking in Google: Report \- Search Engine Land, accessed March 19, 2026, [https://searchengineland.com/ai-local-visibility-report-2026-468085](https://searchengineland.com/ai-local-visibility-report-2026-468085)  
10. Compare Apple Intelligence vs. Gemini in 2026 \- Slashdot, accessed March 19, 2026, [https://slashdot.org/software/comparison/Apple-Intelligence-vs-Gemini-Google/](https://slashdot.org/software/comparison/Apple-Intelligence-vs-Gemini-Google/)  
11. How AI Is Impacting Local Search: Data, Facts, and What Every Business Must Do in 2026, accessed March 19, 2026, [https://almcorp.com/blog/how-ai-is-impacting-local-search/](https://almcorp.com/blog/how-ai-is-impacting-local-search/)  
12. Startup News: Shocking Mistakes Revealed in Gemini 3 Bug Affecting AI Search Results in 2026, accessed March 19, 2026, [https://blog.mean.ceo/startup-news-gemini-3-bug-ai-search-results-2026/](https://blog.mean.ceo/startup-news-gemini-3-bug-ai-search-results-2026/)  
13. 34 AI Overviews Stats & Facts \[2025\] \- WordStream, accessed March 19, 2026, [https://www.wordstream.com/blog/google-ai-overviews-statistics](https://www.wordstream.com/blog/google-ai-overviews-statistics)  
14. Ai search market share 2026: Google vs Chatgpt stats revealed \- Sedestral, accessed March 19, 2026, [https://sedestral.com/en/blog/ai-search-market-share-2026](https://sedestral.com/en/blog/ai-search-market-share-2026)  
15. 16 AI Overview (AIO) Statistics Worth Knowing in 2026 \- Safari Digital, accessed March 19, 2026, [https://www.safaridigital.com.au/blog/ai-overview-aio-statistics/](https://www.safaridigital.com.au/blog/ai-overview-aio-statistics/)  
16. Google SGE Optimization: AI Overviews Strategy Guide 2025, accessed March 19, 2026, [https://www.digitalapplied.com/blog/google-sge-optimization-ai-overviews-2025](https://www.digitalapplied.com/blog/google-sge-optimization-ai-overviews-2025)  
17. Why you need to refresh your content in 2026 \- Ocula Tech., accessed March 19, 2026, [https://ocula.tech/resources/why-content-refreshes-matter-stats-for-2026](https://ocula.tech/resources/why-content-refreshes-matter-stats-for-2026)  
18. \[GA4\] Data freshness \- Analytics Help, accessed March 19, 2026, [https://support.google.com/analytics/answer/11198161?hl=en](https://support.google.com/analytics/answer/11198161?hl=en)  
19. Agentic Content Protocol (ACP): A Whitepaper for Sustainable AI-Publisher Interaction, accessed March 19, 2026, [https://www.researchgate.net/publication/395188101\_Agentic\_Content\_Protocol\_ACP\_A\_Whitepaper\_for\_Sustainable\_AI-Publisher\_Interaction](https://www.researchgate.net/publication/395188101_Agentic_Content_Protocol_ACP_A_Whitepaper_for_Sustainable_AI-Publisher_Interaction)  
20. Introduction to Azure AI Search \- Microsoft Learn, accessed March 19, 2026, [https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search)  
21. Overcoming challenges in maintaining current search indexes \- Glean, accessed March 19, 2026, [https://www.glean.com/perspectives/overcoming-challenges-in-maintaining-current-search-indexes](https://www.glean.com/perspectives/overcoming-challenges-in-maintaining-current-search-indexes)  
22. Data Governance \- IFS Cloud ERP Consulting Services, accessed March 19, 2026, [https://ifs-erp.consulting/data-governance](https://ifs-erp.consulting/data-governance)  
23. About data freshness \- Google Ads Help, accessed March 19, 2026, [https://support.google.com/google-ads/answer/2544985?hl=en](https://support.google.com/google-ads/answer/2544985?hl=en)  
24. Business hours not Change \- Google Business Profile Community, accessed March 19, 2026, [https://support.google.com/business/thread/376790632/business-hours-not-change?hl=en](https://support.google.com/business/thread/376790632/business-hours-not-change?hl=en)  
25. Change address and working hour pending for over 30 days : r/GoogleMyBusiness \- Reddit, accessed March 19, 2026, [https://www.reddit.com/r/GoogleMyBusiness/comments/1d1wcaa/change\_address\_and\_working\_hour\_pending\_for\_over/](https://www.reddit.com/r/GoogleMyBusiness/comments/1d1wcaa/change_address_and_working_hour_pending_for_over/)  
26. Gartner Data Catalog Research 2026: Market Guide for Buyers \- Atlan, accessed March 19, 2026, [https://atlan.com/gartner-data-catalog/](https://atlan.com/gartner-data-catalog/)  
27. ML System Design: A Complete Guide (2026), accessed March 19, 2026, [https://www.systemdesignhandbook.com/guides/ml-system-design/](https://www.systemdesignhandbook.com/guides/ml-system-design/)  
28. How we designed a production AI system for product retrieval and sales automation at an SME scale (\~20k SKUs) | by Thanh Chu \- Medium, accessed March 19, 2026, [https://medium.com/@thanh19xy/how-we-designed-a-production-ai-system-for-product-retrieval-and-sales-automation-at-an-sme-scale-f78dea6516c8](https://medium.com/@thanh19xy/how-we-designed-a-production-ai-system-for-product-retrieval-and-sales-automation-at-an-sme-scale-f78dea6516c8)  
29. accessed March 19, 2026, [https://www.tinybird.co/docs/llms-full.txt](https://www.tinybird.co/docs/llms-full.txt)  
30. Survey and analysis of hallucinations in large language models: attribution to prompting strategies or model behavior \- PMC, accessed March 19, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC12518350/](https://pmc.ncbi.nlm.nih.gov/articles/PMC12518350/)  
31. A Comprehensive Survey of Hallucination in Large Language Models: Causes, Detection, and Mitigation \- arXiv, accessed March 19, 2026, [https://arxiv.org/html/2510.06265v1](https://arxiv.org/html/2510.06265v1)  
32. How Structured Data Helps Your Site Get Picked Up by AI Search Engines \- ResultFirst, accessed March 19, 2026, [https://www.resultfirst.com/blog/ai-seo/how-structured-data-helps-your-site-get-picked-up-by-ai-search-engines/](https://www.resultfirst.com/blog/ai-seo/how-structured-data-helps-your-site-get-picked-up-by-ai-search-engines/)  
33. Have SpudGun, Will Travel: How AI's Agreeableness Risks Undermining UX Thinking, accessed March 19, 2026, [https://uxmag.com/articles/friendly-but-flawed-how-ais-agreeableness-risks-undermining-ux-thinking](https://uxmag.com/articles/friendly-but-flawed-how-ais-agreeableness-risks-undermining-ux-thinking)  
34. Large Language Models Hallucination: A Comprehensive Survey \- arXiv, accessed March 19, 2026, [https://arxiv.org/html/2510.06265v2](https://arxiv.org/html/2510.06265v2)  
35. LLM Hallucination Examples: What They Are and How to Detect Them \- Factors.ai, accessed March 19, 2026, [https://www.factors.ai/blog/llm-hallucination-detection-examples](https://www.factors.ai/blog/llm-hallucination-detection-examples)  
36. Amazon Bedrock \+ Promptfoo: Rethinking LLM Evaluation Methods \- Tutorials Dojo, accessed March 19, 2026, [https://tutorialsdojo.com/amazon-bedrock-promptfoo-rethinking-llm-evaluation-methods/](https://tutorialsdojo.com/amazon-bedrock-promptfoo-rethinking-llm-evaluation-methods/)  
37. Search for \- Hobart, accessed March 19, 2026, [https://www.hobartpulp.com/pages/search?utf8=%E2%9C%93\&search=\&commit=SEARCH](https://www.hobartpulp.com/pages/search?utf8=%E2%9C%93&search&commit=SEARCH)  
38. 4 LLM Hallucination Examples and How to Reduce Them \- Vellum, accessed March 19, 2026, [https://vellum.ai/blog/llm-hallucination-types-with-examples](https://vellum.ai/blog/llm-hallucination-types-with-examples)  
39. LLM Hallucination—Types, Causes, and Solutions \- Nexla, accessed March 19, 2026, [https://nexla.com/ai-infrastructure/llm-hallucination/](https://nexla.com/ai-infrastructure/llm-hallucination/)  
40. Do NOT use NotebookLM for data analysis \- Reddit, accessed March 19, 2026, [https://www.reddit.com/r/notebooklm/comments/1p40io2/do\_not\_use\_notebooklm\_for\_data\_analysis/](https://www.reddit.com/r/notebooklm/comments/1p40io2/do_not_use_notebooklm_for_data_analysis/)  
41. Google AI Overviews (SGE): How Search Generative Experience Will Change Australian SEO in 2026 \- Uprise Digital, accessed March 19, 2026, [https://uprisedigital.com.au/blog/google-ai-overviews/](https://uprisedigital.com.au/blog/google-ai-overviews/)  
42. Answer Engine Optimisation Australia: 2026 | AI Marketing Agency Australia | roi.com.au, accessed March 19, 2026, [https://roi.com.au/answer-engine-optimisation-australia-the-complete-guide-for-ranking-in-ai-search-results-in-2026/](https://roi.com.au/answer-engine-optimisation-australia-the-complete-guide-for-ranking-in-ai-search-results-in-2026/)  
43. 2026 GEO Benchmarks Report: AI Search Traffic Statistics & Trends ..., accessed March 19, 2026, [https://presenceai.app/blog/2026-geo-benchmarks-ai-search-traffic-statistics](https://presenceai.app/blog/2026-geo-benchmarks-ai-search-traffic-statistics)  
44. Beyond SEO: How sitecentre® Is Building for the AI Search Era (2026+), accessed March 19, 2026, [https://www.sitecentre.com.au/blog/beyond-seo-ai-search-era](https://www.sitecentre.com.au/blog/beyond-seo-ai-search-era)  
45. The State of AI Search in 2026: Complete Guide \- aeoengine blog, accessed March 19, 2026, [https://aeoengine.ai/blog/state-of-ai-search-complete-guide](https://aeoengine.ai/blog/state-of-ai-search-complete-guide)  
46. Local SEO Statistics & Facts Australia (2025) \- Red Search, accessed March 19, 2026, [https://www.redsearch.com.au/resources/local-seo-statistics-australia/](https://www.redsearch.com.au/resources/local-seo-statistics-australia/)  
47. 2026 AI SEO Statistics: Why 92% Of Brands Are Failing \- Industry Report \- Fuel Online, accessed March 19, 2026, [https://fuelonline.com/2026-state-of-generative-search-ai-seo-statistics/](https://fuelonline.com/2026-state-of-generative-search-ai-seo-statistics/)  
48. 100+ AI SEO Statistics for 2026 (Updated March) \- Position Digital, accessed March 19, 2026, [https://www.position.digital/blog/ai-seo-statistics/](https://www.position.digital/blog/ai-seo-statistics/)  
49. Google AI Overviews Explained | Optimise Online, accessed March 19, 2026, [https://optimiseonline.com.au/google-ai-overviews-explained/](https://optimiseonline.com.au/google-ai-overviews-explained/)  
50. Google Business Profile: The updated Guide to the 2026 AI Evolution \- Agency Jet, accessed March 19, 2026, [https://www.agencyjet.com/blog/google-business-profile-optimization-guide](https://www.agencyjet.com/blog/google-business-profile-optimization-guide)  
51. Future of Search in Australia: AI Strategy for 2026-2027 \- A.P. Web Solutions, accessed March 19, 2026, [https://www.apwebsolutions.com.au/the-future-of-search-in-australia/](https://www.apwebsolutions.com.au/the-future-of-search-in-australia/)  
52. SCBX Launches First “thAI Consumer AI Adoption 2026” Report, Revealing Thai Consumers' True Expectations for AI, accessed March 19, 2026, [https://www.scbx.com/en/news/thai-consumer-ai-adoption-report/](https://www.scbx.com/en/news/thai-consumer-ai-adoption-report/)  
53. AI in Thailand | Asian Intelligence, accessed March 19, 2026, [https://asianintelligence.ai/thailand](https://asianintelligence.ai/thailand)  
54. Effectiveness of ChatGPT, Google Gemini, and Microsoft Copilot in Answering Thai Drug Information Queries: Cross-Sectional Study \- PMC, accessed March 19, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC12750067/](https://pmc.ncbi.nlm.nih.gov/articles/PMC12750067/)  
55. Thailand Artificial Intelligence (AI) Optimised Data Center Market Report 2031, accessed March 19, 2026, [https://www.mordorintelligence.com/industry-reports/thailand-artificial-intelligence-ai-data-center-market](https://www.mordorintelligence.com/industry-reports/thailand-artificial-intelligence-ai-data-center-market)  
56. Press Releases \- Google Cloud, accessed March 19, 2026, [https://www.googlecloudpresscorner.com/ai-infrastructure](https://www.googlecloudpresscorner.com/ai-infrastructure)  
57. Apple AI 2026: Inside the Silent War Between ChatGPT and Gemini for Apple Intelligence \- AppleMagazine, accessed March 19, 2026, [https://applemagazine.com/apple-ai-2026/](https://applemagazine.com/apple-ai-2026/)  
58. Google will be the brain of Apple Intelligence | Zero Shot Inference | Allen Au, accessed March 19, 2026, [https://www.thestandard.com.hk/insights/article/322280/Google-will-be-the-brain-of-Apple-Intelligence-Zero-Shot-Inference-Allen-Au](https://www.thestandard.com.hk/insights/article/322280/Google-will-be-the-brain-of-Apple-Intelligence-Zero-Shot-Inference-Allen-Au)  
59. Apple Intelligence and Gemini: the AI revolution by Apple and Google \- C\&C, accessed March 19, 2026, [https://www.cec.com/en/blog/apple-intelligence-e-gemini-la-rivoluzione-ai-di-apple-e-google](https://www.cec.com/en/blog/apple-intelligence-e-gemini-la-rivoluzione-ai-di-apple-e-google)  
60. Day 44: Compare and contrast Traditional ML vs Deep Learning vs Agentic AI (Part 2), accessed March 19, 2026, [https://luxananda.medium.com/day-44-compare-and-contrast-traditional-ml-vs-deep-learning-vs-agentic-ai-part-2-a0def70e9ace](https://luxananda.medium.com/day-44-compare-and-contrast-traditional-ml-vs-deep-learning-vs-agentic-ai-part-2-a0def70e9ace)  
61. Apple Intelligence Foundation Language Models Tech Report 2025, accessed March 19, 2026, [https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025](https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025)  
62. Apple Intelligence Foundation Language Models: Tech Report 2025 \- arXiv, accessed March 19, 2026, [https://arxiv.org/pdf/2507.13575](https://arxiv.org/pdf/2507.13575)  
63. AI SEO in 2026: How Brands Must Evolve for LLMs, AI Overviews & Agentic Search, accessed March 19, 2026, [https://www.vizion.com/blog/ai-seo-in-2026-how-brands-must-evolve-for-llms-ai-overviews-agentic-search/](https://www.vizion.com/blog/ai-seo-in-2026-how-brands-must-evolve-for-llms-ai-overviews-agentic-search/)  
64. Apple to launch AI search for Siri in 2026: Report \- Search Engine Land, accessed March 19, 2026, [https://searchengineland.com/apple-world-knowledge-answers-ai-search-461569](https://searchengineland.com/apple-world-knowledge-answers-ai-search-461569)  
65. AI Search predictions 2026: From search results to life outcomes \- Adthena, accessed March 19, 2026, [https://www.adthena.com/resources/blog/ai-search-predictions-2026-from-search-results-to-life-outcomes/](https://www.adthena.com/resources/blog/ai-search-predictions-2026-from-search-results-to-life-outcomes/)  
66. The future of AI search: What 6 SEO leaders predict for 2026 \- Search Engine Land, accessed March 19, 2026, [https://searchengineland.com/ai-search-visibility-seo-predictions-2026-468042](https://searchengineland.com/ai-search-visibility-seo-predictions-2026-468042)  
67. Skew-aware automatic database partitioning in shared-nothing, parallel OLTP systems | Request PDF \- ResearchGate, accessed March 19, 2026, [https://www.researchgate.net/publication/254006600\_Skew-aware\_automatic\_database\_partitioning\_in\_shared-nothing\_parallel\_OLTP\_systems](https://www.researchgate.net/publication/254006600_Skew-aware_automatic_database_partitioning_in_shared-nothing_parallel_OLTP_systems)  
68. Local SEO sprints: A 90-day plan for service businesses in 2026 \- Search Engine Land, accessed March 19, 2026, [https://searchengineland.com/local-seo-sprints-a-90-day-plan-for-service-businesses-in-2026-469059](https://searchengineland.com/local-seo-sprints-a-90-day-plan-for-service-businesses-in-2026-469059)  
69. Google Business Profiles in 2026: Winning the Local Map Pack | Eclincher, accessed March 19, 2026, [https://www.eclincher.com/articles/managing-google-business-profiles-effectively-with-eclincher](https://www.eclincher.com/articles/managing-google-business-profiles-effectively-with-eclincher)  
70. Local LLMs vs Cloud APIs: 2026 Total Cost of Ownership Analysis | SitePoint, accessed March 19, 2026, [https://www.sitepoint.com/local-llms-vs-cloud-api-cost-analysis-2026/](https://www.sitepoint.com/local-llms-vs-cloud-api-cost-analysis-2026/)  
71. The Costly Open-Source LLM Lie \- Devansh \- Medium, accessed March 19, 2026, [https://machine-learning-made-simple.medium.com/the-costly-open-source-llm-lie-f83fdc5d5701](https://machine-learning-made-simple.medium.com/the-costly-open-source-llm-lie-f83fdc5d5701)  
72. Data Decay Rate Statistics: 20 Critical Facts Every GTM Leader Should Know in 2026 | Landbase, accessed March 19, 2026, [https://www.landbase.com/blog/data-decay-rate-statistics](https://www.landbase.com/blog/data-decay-rate-statistics)  
73. The State of Search: February 2026 | Greenpark Digital, accessed March 19, 2026, [https://greenpark.digital/updates/the-state-of-search-february-2026/](https://greenpark.digital/updates/the-state-of-search-february-2026/)  
74. Mobile Intelligence 2025: Google vs. Apple AI Showdown \- JetRuby Agency, accessed March 19, 2026, [https://jetruby.com/blog/mobile-intelligence-2025-google-vs-apple/](https://jetruby.com/blog/mobile-intelligence-2025-google-vs-apple/)  
75. The SGE Collapse: Google's $10 Billion AI Search Failure | Jeff Lenney, accessed March 19, 2026, [https://jefflenney.com/blog/sge-collapse/](https://jefflenney.com/blog/sge-collapse/)  
76. Vertex AI Gemini API customers experienced increased error rates when accessing the global endpoint. \- Google Cloud Service Health, accessed March 19, 2026, [https://status.cloud.google.com/incidents/41E5S3mkTGDfkZuJZH5k](https://status.cloud.google.com/incidents/41E5S3mkTGDfkZuJZH5k)  
77. Top 40 AI Disasters \[Detailed Analysis\]\[2026\] \- DigitalDefynd Education, accessed March 19, 2026, [https://digitaldefynd.com/IQ/top-ai-disasters/](https://digitaldefynd.com/IQ/top-ai-disasters/)  
78. Why GPT-5 Struggled: Lessons for Enterprise AI Adoption \- Sangfor Technologies, accessed March 19, 2026, [https://www.sangfor.com/blog/cloud-and-infrastructure/why-smarter-gpt-5-failed-win-over-users](https://www.sangfor.com/blog/cloud-and-infrastructure/why-smarter-gpt-5-failed-win-over-users)  
79. Google AI Overviews Gemini 3: SEO Impact & Strategy 2026 \- ALM Corp, accessed March 19, 2026, [https://almcorp.com/blog/google-ai-overviews-gemini-3-update-seo-impact-2026/](https://almcorp.com/blog/google-ai-overviews-gemini-3-update-seo-impact-2026/)  
80. A Safety Report on GPT-5.2, Gemini 3 Pro, Qwen3-VL, Doubao 1.8, Grok 4.1 Fast, Nano Banana Pro, and Seedream 4.5 \- arXiv, accessed March 19, 2026, [https://arxiv.org/html/2601.10527v1](https://arxiv.org/html/2601.10527v1)  
81. Gemini is having problems because it views 2026 data meaning 2026 as fake. \- Reddit, accessed March 19, 2026, [https://www.reddit.com/r/GeminiAI/comments/1qn4kzh/gemini\_is\_having\_problems\_because\_it\_views\_2026/](https://www.reddit.com/r/GeminiAI/comments/1qn4kzh/gemini_is_having_problems_because_it_views_2026/)  
82. Library Hallucinations in LLMs: Risk Analysis Grounded in Developer Queries \- arXiv.org, accessed March 19, 2026, [https://arxiv.org/pdf/2509.22202](https://arxiv.org/pdf/2509.22202)  
83. AI Search, Google SGE & SEO in 2026 for Small Businesses \- Knapsack Creative, accessed March 19, 2026, [https://knapsackcreative.com/blog/seo/ai-search-google-sge-for-small-business](https://knapsackcreative.com/blog/seo/ai-search-google-sge-for-small-business)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAXCAYAAACiaac3AAACl0lEQVR4Xu2WWchNURTH/2YJURLixRSZRYbMSSGFB8PnQXmQIlLiwZAhEhJeEC+GlPAi8mJKmV4k85AHMsYTKcr0/1v7nLvO/s7Hdbs86Pzq122tvb97995nr3U+oKCg4F8ykq4LTorGEurTKXQjXUrbZ4dThtCVdBUdEI39NbbRQ3QO3UG/0rO0qZvTmB6np+koupy+oMPcHLGM3qXT6Wz6iC7KzPhD2sSJHMbQm7Sly+2k3+kWl1tA39BmLqcn8pg2DHFP2N8NSmcAE+hn2t3lyqIf7GSP0SbRWIweuX54j8vppJV77nI36EkXi/GweSNCvJ2+Lw3/RE/wG+x3ymI0PUUP097RWF0MptfpNJdrC1vcsxC3CvGBdIYxMORXh1hP9GlpOEUbOxcnPfVgxXYedpqds8MVMRm2uF0h7hbivekMo1fI7w6xauRhaTjlLb0fJ0UDWkMv062ou1NUgr5Tp6c7LlS8frEJSQ0cDbHuft5iVUsyRXdsPr1G19DWfrAK6Ls/0HEuNxS160YkmzgS4k/0QWk4RRt46RM6FT02tTjfAqvBWNiPqU48XWGL3RflVXf+2qkRqFvFvKO34qQWvxBWkCuQbY+V0ofepj1cbkn4bE6/oHRtEobDNqE1CK0nc21gNatrdibKp6g/z4Xd4Q0o772QRydYY9BnQiPYohIu0qsuFrNgm+gb4rWwdupvSDvYnMUul4t2O5VegL1xO2aHf4nap96wd2BtUN9xid6jJ9y8mfQj7eByB2GbS+gCqyetJWEefQ3bTNmoIPWu2A9rjb9Db12dVJ6b3Dyhp63uo2umd9EV1L7KE+krup5upk9grbgi+sO6SbWLXyc6A9ZgdOXyUA3pn0htqEU0VlBQ8L/xA1abitYpQHIIAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAAbUlEQVR4XmNgGAWjgKqgEF2AErAQiFXRBckF1kC8DV2QEpANxGnogiAgBMRSZOClQLwWyoaDTiBeTgY+CcT/gLiegUKgAsR7GSDhRxHgAOIrQCyDLkEOSAHiYnRBcsF+IGZBFyQXSKILjIJBAAAj9xTbjwG/KAAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAXCAYAAACf+8ZRAAAB8ElEQVR4Xu2VTyhlcRTHj4w/i4lIIVLIlFIYpSj5EwmZJpNiNs9KiVIS2dgoJRtlQ8QCC5GFLJgmkplibaNohoyFYoEkK77Heere497r3qspi/upT733Pfe+3+m+8/tdooCAAC9kwS44DBtUzQsjsEmH/4NKeAK7YRXchIumK9xRBx9ghy54IUkHFkTCf7DXkCXCGxgyZK8RD4/oDU3nwzm4BGNUTfOFZKHPKv8Ff6rMiSk4QD6aLodrcB7mqZodYyQLZap8Fd7DDyq3ogZOwmJy2XQEbCSZwwmSDeWFBZKFUlXO/xLnySrXfIQ7MI5cNM2z+B3+hqP0clG3bJB1c7wROc9VuWYc1oc/2zYdDdvhLhyECeayZ9ZJFkpR+XPTn1RupAzOGr7bNl0Cz2AfjFU1P/D880JpKl8O53ySWMFrb5O5bts0wzd0wj3YTzJPfuGXgdUY/IC3JHvGikKSs539C//Ac5Lfugh/15v7Cd7ZIZK5HiJ357KmgmShWpUfwBWVFcEolRn5Rg5PWsNP4yvcIjnC0s1lR3hD75Pc9wzP8R2sNmRtJA1NGzJNC8k1/Gb1BL+G+azmH89RNTsy4DGcgT0kb7ZW4wWgFJ6S9VPMhofwEl7DK3IYDycKSM5tt5uVR403eTP5Pz4DAgLeI4/FYWJi+OZ1UgAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAZCAYAAAD5e+QFAAAAJklEQVR4XmNgGAW6QHwaiMORBdOB+D8QL0IWZAViHyAWQhYcPgAAki4Du+0N6MgAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAWCAYAAAASEbZeAAAAm0lEQVR4XsXQIQrCUACH8ScI3sBjCN7AYpdlWRZBDBabwWhY8ggGl0RQjGL2ACK2HWAewW9sA/mC2vzgx+DPC28vhL/WRMejWyL36OZ4eHQxLh5dDxuPdXtckVbfE+5BPzHBAlPsMEaC9vuhughHj26Fp0dXHPr6TsW9Mo9uhptHNwrlE3xsiLNHN8DBo+tj69F1sfboGmh5/KkXCjwYh+Xv3MoAAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAWCAYAAAD5Jg1dAAAAbklEQVR4XmNgGAUkAk50AVygFYhZ0AWxgc1ArIYuiA3cAmJfdEEYkAPiWUD8C4j/Q/ElIA4GYkYkdXCwkwGhUAdNDg6sgfgrEHsD8W4gXoMqjQDbgNgJygYF0R4gNkRIQ4AEELuhiXExQNw4ggEAlNsP1xTnAHIAAAAASUVORK5CYII=>