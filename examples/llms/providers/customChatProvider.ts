import {
  AsyncStream,
  BaseLLMTokenizeOutput,
  ExecutionOptions,
  GenerateCallbacks,
  GenerateOptions,
  LLMCache,
  LLMMeta,
} from "bee-agent-framework/llms/base";
import { shallowCopy } from "bee-agent-framework/serializer/utils";
import type { GetRunContext } from "bee-agent-framework/context";
import { Emitter } from "bee-agent-framework/emitter/emitter";
import { ChatLLM, ChatLLMOutput } from "bee-agent-framework/llms/chat";
import { BaseMessage, Role } from "bee-agent-framework/llms/primitives/message";
import { sum } from "remeda";

export class CustomChatLLMOutput extends ChatLLMOutput {
  public readonly chunks: BaseMessage[] = [];

  constructor(chunk: BaseMessage) {
    super();
    this.chunks.push(chunk);
  }

  get messages() {
    return this.chunks;
  }

  merge(other: CustomChatLLMOutput): void {
    this.chunks.push(...other.chunks);
  }

  getTextContent(): string {
    return this.chunks.map((result) => result.text).join("");
  }

  toString(): string {
    return this.getTextContent();
  }

  createSnapshot() {
    return { chunks: shallowCopy(this.chunks) };
  }

  loadSnapshot(snapshot: ReturnType<typeof this.createSnapshot>): void {
    Object.assign(this, snapshot);
  }
}

// Feel free to extend if you want to support additional parameters
type CustomGenerateOptions = GenerateOptions;

export interface CustomChatLLMInput {
  modelId: string;
  executionOptions?: ExecutionOptions;
  cache?: LLMCache<CustomChatLLMOutput>;
  parameters?: Record<string, any>;
}

export class CustomChatLLM extends ChatLLM<CustomChatLLMOutput, CustomGenerateOptions> {
  public readonly emitter: Emitter<GenerateCallbacks> = Emitter.root.child({
    namespace: ["custom", "llm"],
    creator: this,
  });

  constructor(protected readonly input: CustomChatLLMInput) {
    super(input.modelId, input.executionOptions, input.cache);
  }

  async meta(): Promise<LLMMeta> {
    // TODO: retrieve data about current model from the given provider API
    return { tokenLimit: Infinity };
  }

  async tokenize(input: BaseMessage[]): Promise<BaseLLMTokenizeOutput> {
    // TODO: retrieve data about current model from the given provider API
    return {
      tokensCount: sum(input.map((msg) => Math.ceil(msg.text.length / 4))),
    };
  }

  protected async _generate(
    input: BaseMessage[],
    options: CustomGenerateOptions,
    run: GetRunContext<this>,
  ): Promise<CustomChatLLMOutput> {
    // this method should do non-stream request to the API
    // TIP: access inference parameters via `this.input.parameters` and `options`
    // TIP: use signal from run.signal
    const result = BaseMessage.of({
      role: Role.ASSISTANT,
      text: "TODO: response retrieve from the API",
      meta: {
        createdAt: new Date(),
      },
    });
    return new CustomChatLLMOutput(result);
  }

  protected async *_stream(
    input: BaseMessage[],
    options: CustomGenerateOptions,
    run: GetRunContext<this>,
  ): AsyncStream<CustomChatLLMOutput, void> {
    // this method should do stream request to the API
    // TIP: access inference parameters via `this.input.parameters` and `options`
    // TIP: use signal from run.signal
    for await (const chunk of ["Hel", "oo", "world", "!"]) {
      const result = BaseMessage.of({
        role: Role.ASSISTANT,
        text: chunk,
        meta: {
          createdAt: new Date(),
        },
      });
      yield new CustomChatLLMOutput(result);
    }
  }

  createSnapshot() {
    return {
      ...super.createSnapshot(),
      input: shallowCopy(this.input),
    };
  }

  loadSnapshot({ input, ...snapshot }: ReturnType<typeof this.createSnapshot>) {
    super.loadSnapshot(snapshot);
    Object.assign(this, { input });
  }
}
