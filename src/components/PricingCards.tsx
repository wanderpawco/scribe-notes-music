import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    featured: false,
    features: [
      "3 transcriptions per month",
      "PDF export only",
      "Watermarked sheet music",
      "1 instrument per transcription",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    featured: true,
    features: [
      "Unlimited transcriptions",
      "PDF, MIDI, MusicXML, Guitar Pro export",
      "All instruments supported",
      "Key transposition",
      "Priority processing",
    ],
  },
  {
    name: "Studio",
    price: "$29",
    period: "/month",
    featured: false,
    features: [
      "Everything in Pro",
      "Stem audio downloads",
      "API access",
      "Commercial use license",
      "3 team seats",
    ],
  },
];

const PricingCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`relative rounded-xl p-6 flex flex-col bg-surface shadow-card transition-all duration-200 ${
            tier.featured
              ? "border-2 border-gold ring-1 ring-gold/20"
              : "border border-border"
          }`}
        >
          {tier.featured && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-gold text-white">
              Most Popular
            </span>
          )}

          <h3 className="font-heading text-xl font-semibold text-ink">{tier.name}</h3>
          <div className="mt-3 mb-5">
            <span className="font-heading text-3xl font-bold text-ink">{tier.price}</span>
            {tier.period && <span className="text-sm text-ink-soft">{tier.period}</span>}
          </div>

          <ul className="space-y-3 flex-1 mb-6">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                <Check size={16} className="text-teal mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            to="/app"
            className={`block text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tier.featured
                ? "bg-gold text-white hover:bg-gold-dark"
                : "border border-border text-ink hover:bg-surface"
            }`}
          >
            Get Started
          </Link>
        </div>
      ))}
    </div>
  );
};

export default PricingCards;
