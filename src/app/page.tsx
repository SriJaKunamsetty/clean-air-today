"use client";
import { ProfileForm } from "@/components/ProfileForm";
import { ResultPanel } from "@/components/ResultPanel";
import { useAdvice } from "@/hooks/useAdvice";

export default function Home() {
  const { state, submit } = useAdvice();
  return (
    <main id="main" aria-labelledby="page-title">
      <header>
        <h1 id="page-title">Clean Air Today</h1>
        <p>
          Tell us about your home and your day. We check the live air in your city and give you steps that fit your
          family, with the reason behind each one.
        </p>
      </header>
      <noscript>
        <p className="error">This tool needs JavaScript to fetch live air quality.</p>
      </noscript>
      <ProfileForm
        busy={state.status === "loading"}
        error={state.status === "error" ? state.message : null}
        onSubmit={submit}
      />
      {state.status === "loading" && (
        <p role="status" className="meta">
          Checking the air…
        </p>
      )}
      {state.status === "success" && <ResultPanel plan={state.plan} />}
    </main>
  );
}
