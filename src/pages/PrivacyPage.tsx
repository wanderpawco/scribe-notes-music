import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPage = () => (
  <>
    <Navbar />
    <main className="min-h-screen bg-paper pt-32 pb-16">
      <article className="max-w-[800px] mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold font-heading text-ink mb-2">Privacy Policy</h1>
        <p className="text-ink-muted mb-12">Last updated: April 12, 2026</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">1. Overview</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            ScribeNoter ("we", "us") is operated by Nina Basiliko, Maryland, USA. This policy explains how we collect, use, and protect your data.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">2. Data We Collect</h2>
          <ul className="text-base text-ink-soft leading-relaxed list-disc pl-6 space-y-2">
            <li><strong className="text-ink">Account data:</strong> Email address and password (via secure authentication)</li>
            <li><strong className="text-ink">Audio files:</strong> Audio recordings you upload for transcription, stored in private cloud storage</li>
            <li><strong className="text-ink">Transcription data:</strong> Song titles, instrument selections, and transcription outputs (MIDI, MusicXML)</li>
            <li><strong className="text-ink">Usage data:</strong> Basic technical information such as browser type and IP address</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">3. How We Use Your Data</h2>
          <ul className="text-base text-ink-soft leading-relaxed list-disc pl-6 space-y-2">
            <li>To provide the transcription service</li>
            <li>To authenticate your account and secure your data</li>
            <li>To store your transcription history for your access</li>
            <li>We do not sell your data, use it for advertising, or use your audio to train AI models</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">4. Third-Party Services</h2>
          <p className="text-base text-ink-soft leading-relaxed mb-3">
            To provide the Service, your data is processed by the following third parties:
          </p>
          <ul className="text-base text-ink-soft leading-relaxed list-disc pl-6 space-y-3">
            <li>
              <strong className="text-ink">AudioShake</strong> (audioshake.ai) — AI audio stem separation. Audio files are sent to AudioShake for instrument isolation prior to transcription. AudioShake is based in the United States. See AudioShake's privacy policy at <a href="https://audioshake.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">audioshake.ai/privacy</a>.
            </li>
            <li>
              <strong className="text-ink">Klangio GmbH</strong> (klang.io) — AI music transcription processing. Audio files are sent to Klangio for transcription and are retained by Klangio for up to 14 days before deletion. Klangio is based in Karlsruhe, Germany. See Klangio's privacy policy at <a href="https://klang.io/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">klang.io/privacy</a>.
            </li>
            <li>
              <strong className="text-ink">Render</strong> (render.com) — backend server infrastructure. Servers located in the United States.
            </li>
            <li>
              <strong className="text-ink">Lovable</strong> (lovable.dev) — frontend hosting. Servers located in the United States.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">5. Data Retention</h2>
          <ul className="text-base text-ink-soft leading-relaxed list-disc pl-6 space-y-2">
            <li>Audio files are stored in your private account and retained until you delete them or close your account</li>
            <li>Transcription outputs are retained in your account history until deleted</li>
            <li>Klangio deletes audio files from their servers within 14 days of processing</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">6. Data Security</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            All data is transmitted over encrypted HTTPS connections. Audio files are stored in private, access-controlled cloud storage scoped to your account. Only you can access your files.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">7. Your Rights</h2>
          <p className="text-base text-ink-soft leading-relaxed mb-3">
            You have the right to:
          </p>
          <ul className="text-base text-ink-soft leading-relaxed list-disc pl-6 space-y-2 mb-3">
            <li>Access the data we hold about you</li>
            <li>Request deletion of your account and all associated data</li>
            <li>Export your transcription outputs at any time</li>
          </ul>
          <p className="text-base text-ink-soft leading-relaxed">
            To exercise these rights, contact us at <a href="mailto:devops@scribenoter.com" className="text-gold hover:text-gold-dark underline">devops@scribenoter.com</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">8. Children</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            ScribeNoter is not intended for users under 13 years of age.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">9. Changes to This Policy</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-3">10. Contact</h2>
          <p className="text-base text-ink-soft leading-relaxed">
            Privacy questions? Contact us at <a href="mailto:devops@scribenoter.com" className="text-gold hover:text-gold-dark underline">devops@scribenoter.com</a>
          </p>
        </section>
      </article>
    </main>
    <Footer />
  </>
);

export default PrivacyPage;