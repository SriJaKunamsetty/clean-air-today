"use client";
import { useCallback, useRef, useState } from "react";
import type { Plan } from "@/lib/adviceService";
import { requestPlan } from "@/lib/client";

export type AdviceState =
  { status: "idle" } | { status: "loading" } | { status: "success"; plan: Plan } | { status: "error"; message: string };

/** Owns request state; cancels any in-flight request when a new one starts. */
export function useAdvice() {
  const [state, setState] = useState<AdviceState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  const submit = useCallback(async (payload: unknown) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState({ status: "loading" });
    try {
      const plan = await requestPlan(payload, current.signal);
      setState({ status: "success", plan });
    } catch (error) {
      if (current.signal.aborted) return;
      setState({ status: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }, []);

  return { state, submit };
}
