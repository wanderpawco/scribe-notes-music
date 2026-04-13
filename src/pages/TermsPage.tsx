import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsPage = () => (
  <>
    <Navbar />
    <main className="min-h-screen bg-paper pt-32 pb-16">
      <article className="max-w-[800px] mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold font-heading text-ink mb-2">Terms of Service</h1>
        <p className="text-ink-muted mb-12">Last updated: April 12, 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">1. Acceptance of Terms</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            By using ScribeNoter ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">2. Beta Service</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            ScribeNoter is currently in beta. The Service is provided as-is. Transcription accuracy, availability, and features may change at any time without notice. We make no guarantees about the quality or accuracy of transcriptions.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">3. User Responsibilities</h2>
          <p className="text-base text-ink-soft leading-relaxed mb-3">
            By uploading audio to ScribeNoter, you confirm that:
          </p>
          <ul className="text-base text-ink-soft leading-relaxed list-disc pl-6 space-y-2">
            <li>You own the audio recording or have explicit permission from the rights holder to transcribe it</li>
            <li>You will not use the Service to infringe on the intellectual property rights of others</li>
            <li>You are responsible for any content you upload</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">4. Copyright and Intellectual Property</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            ScribeNoter is a tool for transcribing audio you own or have rights to. The Service does not grant you any rights to copyrighted music you do not own. Transcribing commercially released music without authorization may violate copyright law. ScribeNoter is not liable for any copyright infringement by users.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">5. Account</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            You must create an account to use the Service. You are responsible for maintaining the security of your account. We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">6. Payments and Subscriptions</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            Paid plans are billed monthly. Cancellations take effect at the end of the current billing period. Refunds are not provided for partial billing periods. Free tier usage is subject to limits which may change at any time.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">7. Limitation of Liability</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            ScribeNoter and its operators are not liable for any damages arising from use of the Service, including but not limited to loss of data, inaccurate transcriptions, or service interruptions.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">8. Changes to Terms</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">9. Contact</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            Questions about these Terms? Contact us at <a href="mailto:devops@scribenoter.com" className="text-gold hover:text-gold-dark underline">devops@scribenoter.com</a>
          </p>
        </section>
      </article>
    </main>
    <Footer />
  </>
);

export default TermsPage;