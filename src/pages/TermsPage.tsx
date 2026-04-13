import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsPage = () => (
  <>
    <Navbar />
    <main className="min-h-screen pt-32 pb-16" style={{ background: '#05050F' }}>
      <article className="container max-w-3xl mx-auto px-6 py-4">
        <h1 className="font-heading text-4xl font-bold mb-2" style={{ color: '#F5F0E8' }}>Terms of Service</h1>
        <p className="text-sm mb-10 pb-6" style={{ color: 'rgba(245,240,232,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Last updated: April 12, 2026</p>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>1. Acceptance of Terms</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            By using ScribeNoter ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>2. Beta Service</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            ScribeNoter is currently in beta. The Service is provided as-is. Transcription accuracy, availability, and features may change at any time without notice. We make no guarantees about the quality or accuracy of transcriptions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>3. User Responsibilities</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            By uploading audio to ScribeNoter, you confirm that:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>You own the audio recording or have explicit permission from the rights holder to transcribe it</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>You will not use the Service to infringe on the intellectual property rights of others</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>You are responsible for any content you upload</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>4. Copyright and Intellectual Property</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            ScribeNoter is a tool for transcribing audio you own or have rights to. The Service does not grant you any rights to copyrighted music you do not own. Transcribing commercially released music without authorization may violate copyright law. ScribeNoter is not liable for any copyright infringement by users.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>5. Account</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            You must create an account to use the Service. You are responsible for maintaining the security of your account. We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>6. Payments and Subscriptions</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            Paid plans are billed monthly. Cancellations take effect at the end of the current billing period. Refunds are not provided for partial billing periods. Free tier usage is subject to limits which may change at any time.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>7. Limitation of Liability</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            ScribeNoter and its operators are not liable for any damages arising from use of the Service, including but not limited to loss of data, inaccurate transcriptions, or service interruptions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>8. Changes to Terms</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>9. Contact</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            Questions about these Terms? Contact us at <a href="mailto:devops@scribenoter.com" className="text-gold hover:text-gold-dark underline">devops@scribenoter.com</a>
          </p>
        </section>
      </article>
    </main>
    <Footer />
  </>
);

export default TermsPage;
