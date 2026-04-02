import type { StampedIntent } from "../../contracts/turn";
import type { GameSessionStore } from "../../state/GameSessionStore";

export interface IntentExecutionContext {
  store: GameSessionStore;
}

export type TypedIntent<TType extends StampedIntent["type"]> = Extract<
  StampedIntent,
  { type: TType }
>;

export type IntentHandler<TType extends StampedIntent["type"]> = (
  context: IntentExecutionContext,
  intent: TypedIntent<TType>,
) => void;

export type HandlerMap = {
  [TType in StampedIntent["type"]]: IntentHandler<TType>;
};
