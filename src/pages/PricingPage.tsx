import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCards from "@/components/PricingCards";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-ink mb-4">
            Simple pricing for every musician
          </h1>
          <p className="text-lg text-ink-soft mb-12">
            Start free. Upgrade when you're ready.
          </p>
          <PricingCards />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
