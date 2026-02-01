export type SummaryItem = {
  title: string;
  description?: string;
};

export type Summary = {
  title: string;
  icon: "messages" | "sparkles" | "shield";
  items: SummaryItem[];
};

export const summariesHardcoded: Summary[] = [
  {
    title: "Jump Back In",
    icon: "messages",
    items: [
      {
        title:
          "How does garbage collection work in Java SE (IFS)",
      },
      {
        title:
          "Got any creative ideas for a 10year old's birthday?",
      },
      {
        title:
          "Your Google interview is in 3 days → simulate a full mock round.",
      },
    ],
  },
  {
    title: "Refine CV",
    icon: "sparkles",
    items: [
      {
        title:
          "Highlight technical skills relevant to Software Engineer roles.",
      },
      {
        title:
          "Include recent projects to showcase hands-on experience.",
      },
      {
        title:
          "Your CV doesn't mention Docker, but the job poster requires it.",
      },
    ],
  },
  {
    title: "Readiness Tracker",
    icon: "shield",
    items: [
      {
        title:
          "Readiness for Frontend Engineer (Shopify) is at 72%",
      },
      {
        title:
          "Your readiness score for SE (Google) improved by 8% this week.",
      },
      {
        title:
          "Don't break your streak! practice for Backend Developer (Amazon) today!",
      },
    ],
  },
];
