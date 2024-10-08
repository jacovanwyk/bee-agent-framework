import { LLM } from "bee-agent-framework/llms/llm";
import {
  AsyncStream,
  BaseLLMOutput,
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

interface CustomLLMChunk {
  text: string;
  metadata: Record<string, any>;
}

export class CustomLLMOutput extends BaseLLMOutput {
  public readonly chunks: CustomLLMChunk[] = [];

  constructor(chunk: CustomLLMChunk) {
    super();
    this.chunks.push(chunk);
  }

  merge(other: CustomLLMOutput): void {
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

export interface CustomLLMInput {
  modelId: string;
  executionOptions?: ExecutionOptions;
  cache?: LLMCache<CustomLLMOutput>;
  parameters?: Record<string, any>;
}

export class CustomLLM extends LLM<CustomLLMOutput, CustomGenerateOptions> {
  public readonly emitter: Emitter<GenerateCallbacks> = Emitter.root.child({
    namespace: ["custom", "llm"],
    creator: this,
  });

  constructor(protected readonly input: CustomLLMInput) {
    super(input.modelId, input.executionOptions, input.cache);
  }

  async meta(): Promise<LLMMeta> {
    // TODO: retrieve data about current model from the given provider API
    return { tokenLimit: Infinity };
  }

  async tokenize(input: string): Promise<BaseLLMTokenizeOutput> {
    // TODO: retrieve data about current model from the given provider API
    return {
      tokensCount: Math.ceil(input.length / 4),
    };
  }

  protected async _generate(
    input: string,
    options: CustomGenerateOptions,
    run: GetRunContext<this>,
  ): Promise<CustomLLMOutput> {
    // this method should do non-stream request to the API
    // TIP: access inference parameters via `this.input.parameters` and `options`
    // TIP: use signal from run.signal
    const result: CustomLLMChunk = {
      text: "...",
      metadata: {},
    };
    return new CustomLLMOutput(result);
  }

  protected async *_stream(
    input: string,
    options: CustomGenerateOptions,
    run: GetRunContext<this>,
  ): AsyncStream<CustomLLMOutput, void> {
    // this method should do stream request to the API
    // TIP: access inference parameters via `this.input.parameters` and `options`
    // TIP: use signal from run.signal
    for await (const chunk of ["Hel", "oo", "world", "!"]) {
      const result: CustomLLMChunk = {
        text: chunk,
        metadata: {},
      };
      yield new CustomLLMOutput(result);
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
