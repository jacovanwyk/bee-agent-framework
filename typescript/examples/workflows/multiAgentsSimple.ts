import "dotenv/config";
import { UnconstrainedMemory } from "beeai-framework/memory/unconstrainedMemory";
import { OpenMeteoTool } from "beeai-framework/tools/weather/openMeteo";
import { WikipediaTool } from "beeai-framework/tools/search/wikipedia";
import { AgentWorkflow } from "beeai-framework/workflows/agent";
import { UserMessage } from "beeai-framework/backend/message";
import { WatsonxChatModel } from "beeai-framework/adapters/watsonx/backend/chat";

const workflow = new AgentWorkflow();

workflow.addAgent({
  name: "Researcher",
  instructions: "You are a researcher assistant. Respond only if you can provide a useful answer.",
  tools: [new WikipediaTool()],
  llm: new WatsonxChatModel("meta-llama/llama-3-3-70b-instruct"),
});

workflow.addAgent({
  name: "WeatherForecaster",
  instructions: "You are a weather assistant. Respond only if you can provide a useful answer.",
  tools: [new OpenMeteoTool()],
  llm: new WatsonxChatModel("meta-llama/llama-3-3-70b-instruct"),
  execution: { maxIterations: 3 },
});

workflow.addAgent({
  name: "Solver",
  instructions:
    "Your task is to provide the most useful final answer based on the assistants' responses which all are relevant. Ignore those where assistant do not know.",
  llm: new WatsonxChatModel("meta-llama/llama-3-3-70b-instruct"),
});

const memory = new UnconstrainedMemory();

await memory.add(
  new UserMessage("What is the capital of France and what is the current weather there?", {
    createdAt: new Date(),
  }),
);

const { result } = await workflow.run(memory.messages).observe((emitter) => {
  emitter.on("success", (data) => {
    console.log(`-> ${data.step}`, data?.state.finalAnswer ?? "-");
  });
});

console.log(`Agent 🤖`, result.finalAnswer);
