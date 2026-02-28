import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

const MODEL = "mistral-large-latest";

export interface CreatorProfile {
  handle: string;
  followers: string;
  niche: string;
  avgViews: string;
  topContentThemes: string[];
}

export interface BrandEnrichment {
  name: string;
  domain: string;
  industry: string;
  description: string;
  funding: string;
  headcount: string;
  recentNews: string;
  fitScore: number;
  fitReason: string;
}

export interface BrandStrategy {
  brandName: string;
  brandDomain: string;
  pitchAngle: string;
  contentFormats: string[];
  talkingPoints: string[];
  pitchScript: string;
  subjectLine: string;
  estimatedValue: string;
}

export interface PRStrategyResult {
  overallStrategy: string;
  brandStrategies: BrandStrategy[];
}

/**
 * Tool definitions for the Mistral function-calling agent.
 * The agent uses these to structure its analysis at each step.
 */
const tools = [
  {
    type: "function" as const,
    function: {
      name: "analyze_creator_brand_fit",
      description:
        "Analyze the fit between a creator and a specific brand using Clay enrichment data. Returns a structured pitch angle and strategy for that brand.",
      parameters: {
        type: "object" as const,
        properties: {
          brand_name: {
            type: "string",
            description: "Name of the brand being analyzed",
          },
          brand_domain: {
            type: "string",
            description: "Domain of the brand",
          },
          pitch_angle: {
            type: "string",
            description:
              "The primary angle for why this creator-brand partnership works. Should reference specific data points from the enrichment.",
          },
          content_formats: {
            type: "array",
            items: { type: "string" },
            description:
              "Recommended content formats (e.g., product review, workout integration, day-in-my-life, tutorial)",
          },
          talking_points: {
            type: "array",
            items: { type: "string" },
            description:
              "3-5 specific talking points the creator should hit in the pitch",
          },
          pitch_script: {
            type: "string",
            description:
              "A ready-to-send pitch message (2-3 paragraphs) from the creator to the brand's marketing team. Professional but personal.",
          },
          subject_line: {
            type: "string",
            description: "Email subject line for the outreach",
          },
          estimated_value: {
            type: "string",
            description:
              "Estimated deal value range based on creator's audience size and brand's typical influencer spend",
          },
        },
        required: [
          "brand_name",
          "brand_domain",
          "pitch_angle",
          "content_formats",
          "talking_points",
          "pitch_script",
          "subject_line",
          "estimated_value",
        ],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "compile_pr_strategy",
      description:
        "Compile the overall PR strategy summary after analyzing all brands. Provides the creator with a high-level game plan.",
      parameters: {
        type: "object" as const,
        properties: {
          overall_strategy: {
            type: "string",
            description:
              "2-3 paragraph executive summary of the PR strategy. Covers the creator's positioning, target verticals, outreach timeline, and expected outcomes.",
          },
        },
        required: ["overall_strategy"],
      },
    },
  },
];

/**
 * Run the Mistral orchestrator agent.
 *
 * The agent receives the creator profile, Clay enrichment data, and
 * the marketing request. It uses function calling to:
 *   1. Analyze each brand's fit and generate a personalized pitch
 *   2. Compile an overall PR strategy
 */
export async function runAgent(
  creator: CreatorProfile,
  brands: BrandEnrichment[],
  marketingRequest: string
): Promise<PRStrategyResult> {
  const brandList = brands
    .map(
      (b) =>
        `- ${b.name} (${b.domain}) | Industry: ${b.industry} | Funding: ${b.funding} | Headcount: ${b.headcount} | Recent: ${b.recentNews} | Fit Score: ${b.fitScore} | Fit Reason: ${b.fitReason} | Description: ${b.description}`
    )
    .join("\n");

  const systemPrompt = `You are Tokker, an expert AI PR agent for TikTok creators. Your job is to craft hyper-personalized brand outreach strategies.

You have access to Clay-enriched data on brands that match this creator. Your task:
1. For EACH brand, call the "analyze_creator_brand_fit" tool with a tailored pitch strategy. Reference specific enrichment data (funding rounds, hiring signals, recent news) to make the pitch compelling and data-driven.
2. After analyzing ALL brands, call "compile_pr_strategy" with an overall strategy summary.

Be specific, actionable, and reference real data points. Avoid generic advice. Each pitch should feel like it was written by someone who deeply researched both the creator and the brand.`;

  const userMessage = `## Creator Profile
- Handle: @${creator.handle}
- Followers: ${creator.followers}
- Niche: ${creator.niche}
- Average Views: ${creator.avgViews}
- Top Content Themes: ${creator.topContentThemes.join(", ")}

## Creator's Marketing Request
${marketingRequest}

## Enriched Brand Matches (from Clay)
${brandList}

Please analyze each brand and generate personalized pitch strategies, then compile the overall PR strategy.`;

  const brandStrategies: BrandStrategy[] = [];
  let overallStrategy = "";

  // Run the agent loop with function calling
  let messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
  }> = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  // Allow up to 15 iterations for the agent loop (one per brand + final summary + safety margin)
  for (let i = 0; i < 15; i++) {
    const response = await client.chat.complete({
      model: MODEL,
      messages,
      tools,
      toolChoice: "auto" as unknown as undefined,
    });

    const choice = response.choices?.[0];
    if (!choice) break;

    const assistantMessage = choice.message;

    // Add assistant message to conversation
    messages.push({
      role: "assistant",
      content: assistantMessage.content?.toString() ?? "",
    });

    // If no tool calls, the agent is done
    if (
      !assistantMessage.toolCalls ||
      assistantMessage.toolCalls.length === 0
    ) {
      break;
    }

    // Process each tool call
    for (const toolCall of assistantMessage.toolCalls) {
      const fn = toolCall.function;
      const args = JSON.parse(
        typeof fn.arguments === "string"
          ? fn.arguments
          : JSON.stringify(fn.arguments)
      );

      if (fn.name === "analyze_creator_brand_fit") {
        brandStrategies.push({
          brandName: args.brand_name,
          brandDomain: args.brand_domain,
          pitchAngle: args.pitch_angle,
          contentFormats: args.content_formats,
          talkingPoints: args.talking_points,
          pitchScript: args.pitch_script,
          subjectLine: args.subject_line,
          estimatedValue: args.estimated_value,
        });

        messages.push({
          role: "tool",
          content: JSON.stringify({
            status: "success",
            message: `Pitch strategy for ${args.brand_name} saved.`,
          }),
          tool_call_id: toolCall.id,
        });
      } else if (fn.name === "compile_pr_strategy") {
        overallStrategy = args.overall_strategy;

        messages.push({
          role: "tool",
          content: JSON.stringify({
            status: "success",
            message: "Overall PR strategy compiled.",
          }),
          tool_call_id: toolCall.id,
        });
      }
    }

    // If the model finished (stop), break
    if (choice.finishReason === "stop") {
      break;
    }
  }

  // Fallback if agent didn't produce a strategy summary
  if (!overallStrategy && brandStrategies.length > 0) {
    overallStrategy = `PR strategy generated for @${creator.handle} targeting ${brandStrategies.length} brands across ${[...new Set(brandStrategies.map((b) => b.brandName))].join(", ")}. Review the individual pitch strategies below and prioritize outreach based on fit score.`;
  }

  return { overallStrategy, brandStrategies };
}
