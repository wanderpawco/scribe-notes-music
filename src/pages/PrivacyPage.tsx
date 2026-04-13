import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPage = () => (
  <>
    <Navbar />
    <main className="min-h-screen pt-32 pb-16" style={{ background: '#05050F' }}>
      <article className="container max-w-3xl mx-auto px-6 py-4">
        <h1 className="font-heading text-4xl font-bold mb-2" style={{ color: '#F5F0E8' }}>Privacy Policy</h1>
        <p className="text-sm mb-10 pb-6" style={{ color: 'rgba(245,240,232,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Last updated: April 12, 2026</p>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>1. Overview</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            ScribeNoter ("we", "us") is operated by Nina Basiliko, Maryland, USA. This policy explains how we collect, use, and protect your data.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>2. Data We Collect</h2>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}><strong style={{ color: '#F5F0E8' }}>Account data:</strong> Email address and password (via secure authentication)</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}><strong style={{ color: '#F5F0E8' }}>Audio files:</strong> Audio recordings you upload for transcription, stored in private cloud storage</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}><strong style={{ color: '#F5F0E8' }}>Transcription data:</strong> Song titles, instrument selections, and transcription outputs (MIDI, MusicXML)</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}><strong style={{ color: '#F5F0E8' }}>Usage data:</strong> Basic technical information such as browser type and IP address</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>3. How We Use Your Data</h2>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>To provide the transcription service</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>To authenticate your account and secure your data</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>To store your transcription history for your access</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>We do not sell your data, use it for advertising, or use your audio to train AI models</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>4. Third-Party Services</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            To provide the Service, your data is processed by the following third parties:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              <strong style={{ color: '#F5F0E8' }}>Supabase</strong> (supabase.com) — database, authentication, and file storage. Servers located in the United States. See Supabase's privacy policy at <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">supabase.com/privacy</a>.
            </li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              <strong style={{ color: '#F5F0E8' }}>Klangio GmbH</strong> (klang.io) — AI music transcription processing. Audio files are sent to Klangio for transcription and are retained by Klangio for up to 14 days before deletion. Klangio is based in Karlsruhe, Germany. See Klangio's privacy policy at <a href="https://klang.io/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">klang.io/privacy</a>.
            </li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              <strong style={{ color: '#F5F0E8' }}>AudioShake</strong> (audioshake.ai) — AI audio stem separation. Audio files are sent to AudioShake for instrument isolation prior to transcription. AudioShake is based in the United States. See AudioShake's privacy policy at <a href="https://audioshake.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">audioshake.ai/privacy</a>.
            </li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              <strong style={{ color: '#F5F0E8' }}>Render</strong> (render.com) — backend server infrastructure. Servers located in the United States.
            </li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              <strong style={{ color: '#F5F0E8' }}>Lovable</strong> (lovable.dev) — frontend hosting. Servers located in the United States.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>5. Data Retention</h2>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>Audio files are stored in your private account and retained until you delete them or close your account</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>Transcription outputs are retained in your account history until deleted</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>Klangio deletes audio files from their servers within 14 days of processing</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>6. Data Security</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            All data is transmitted over encrypted HTTPS connections. Audio files are stored in private, access-controlled cloud storage scoped to your account. Only you can access your files.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>7. Your Rights</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            You have the right to:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>Access the data we hold about you</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>Request deletion of your account and all associated data</li>
            <li className="leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>Export your transcription outputs at any time</li>
          </ul>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            To exercise these rights, contact us at <a href="mailto:devops@scribenoter.com" className="text-gold hover:text-gold-dark underline">devops@scribenoter.com</a>
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>8. Children</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            ScribeNoter is not intended for users under 13 years of age.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>9. Changes to This Policy</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F5F0E8' }}>10. Contact</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
            Privacy questions? Contact us at <a href="mailto:devops@scribenoter.com" className="text-gold hover:text-gold-dark underline">devops@scribenoter.com</a>
          </p>
        </section>
      </article>
    </main>
    <Footer />
  </>
);

export default PrivacyPage;
