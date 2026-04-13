import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCards from "@/components/PricingCards";

const PricingPage = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05050F' }}>
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold mb-4" style={{ color: '#F5F0E8' }}>
            Simple pricing for every musician
          </h1>
          <p className="text-lg mb-12" style={{ color: 'rgba(245,240,232,0.6)' }}>
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
