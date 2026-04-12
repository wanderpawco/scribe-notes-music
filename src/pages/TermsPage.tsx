import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsPage = () => (
  <>
    <Navbar />
    <main className="min-h-screen bg-paper pt-32 pb-16">
      <article className="container max-w-3xl mx-auto px-6 prose prose-stone prose-headings:font-heading prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-a:text-gold hover:prose-a:text-gold-dark">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-ink-muted">Last updated: April 12, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By using ScribeNoter ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2>2. Beta Service</h2>
        <p>ScribeNoter is currently in beta. The Service is provided as-is. Transcription accuracy, availability, and features may change at any time without notice. We make no guarantees about the quality or accuracy of transcriptions.</p>

        <h2>3. User Responsibilities</h2>
        <p>By uploading audio to ScribeNoter, you confirm that:</p>
        <ul>
          <li>You own the audio recording or have explicit permission from the rights holder to transcribe it</li>
          <li>You will not use the Service to infringe on the intellectual property rights of others</li>
          <li>You are responsible for any content you upload</li>
        </ul>

        <h2>4. Copyright and Intellectual Property</h2>
        <p>ScribeNoter is a tool for transcribing audio you own or have rights to. The Service does not grant you any rights to copyrighted music you do not own. Transcribing commercially released music without authorization may violate copyright law. ScribeNoter is not liable for any copyright infringement by users.</p>

        <h2>5. Account</h2>
        <p>You must create an account to use the Service. You are responsible for maintaining the security of your account. We reserve the right to suspend or terminate accounts that violate these terms.</p>

        <h2>6. Payments and Subscriptions</h2>
        <p>Paid plans are billed monthly. Cancellations take effect at the end of the current billing period. Refunds are not provided for partial billing periods. Free tier usage is subject to limits which may change at any time.</p>

        <h2>7. Limitation of Liability</h2>
        <p>ScribeNoter and its operators are not liable for any damages arising from use of the Service, including but not limited to loss of data, inaccurate transcriptions, or service interruptions.</p>

        <h2>8. Changes to Terms</h2>
        <p>We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

        <h2>9. Contact</h2>
        <p>Questions about these Terms? Contact us at <a href="mailto:devops@scribenoter.com">devops@scribenoter.com</a></p>
      </article>
    </main>
    <Footer />
  </>
);

export default TermsPage;
