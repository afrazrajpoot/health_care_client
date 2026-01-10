"use client";

interface Chip {
  text: string;
  type: "blue" | "amber" | "red" | "green";
}

interface QuestionnaireSummaryProps {
  chips: Chip[];
}

export default function QuestionnaireSummary({
  chips,
}: QuestionnaireSummaryProps) {
  if (chips.length === 0) return null;
  console.log("Rendering QuestionnaireSummary with chips:", chips);
  const getChipClasses = (type: "blue" | "amber" | "red" | "green") => {
    switch (type) {
      case "blue":
        return "border-blue-200 bg-blue-50 text-blue-900";
      case "amber":
        return "border-amber-200 bg-amber-50 text-amber-900";
      case "red":
        return "border-red-200 bg-red-50 text-red-900";
      case "green":
        return "border-green-200 bg-green-50 text-green-900";
    }
  };

  return (
    <section
      className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
      style={{ borderLeft: "4px solid #2563eb" }}
    >
      <h3 className="m-0 px-3.5 py-3 text-base font-bold border-b border-gray-200">
        Pre‑Visit Questionnaire Summary
      </h3>
      <div className="flex flex-wrap gap-2 px-4 pb-4 pt-3">
        {chips.map((chip, idx) => (
          <span
            key={idx}
            className={`text-xs px-2 py-1 rounded-full border font-semibold whitespace-nowrap ${getChipClasses(
              chip.type
            )}`}
          >
            {chip.text}
          </span>
        ))}
      </div>
    </section>
  );
}
