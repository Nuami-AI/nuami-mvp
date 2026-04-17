import ActionCard from "@/components/ActionCard";

const DEMO_CARD = {
  situation:
    "You need to ask your manager for a deadline extension — but you're not sure how to bring it up without looking unreliable.",
  steps: [
    { id: 1, text: "Pick a calm moment, not right before a meeting." },
    { id: 2, text: "State the blocker in one sentence." },
    { id: 3, text: "Propose a new date — don't wait to be asked." },
    { id: 4, text: "Offer a brief plan to prevent it next time." },
  ],
  keyPhrases: [
    "I want to flag a risk early so we can adjust together.",
    "Here's the new date I can commit to: ___.",
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-10">
      <ActionCard
        situation={DEMO_CARD.situation}
        steps={DEMO_CARD.steps}
        keyPhrases={DEMO_CARD.keyPhrases}
      />
    </main>
  );
}
