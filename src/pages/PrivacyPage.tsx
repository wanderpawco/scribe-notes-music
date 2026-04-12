import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPage = () => (
  <>
    <Navbar />
    <main className="min-h-screen bg-paper pt-32 pb-16">
      <article className="container max-w-3xl mx-auto px-6 prose prose-stone prose-headings:font-heading prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-a:text-gold hover:prose-a:text-gold-dark">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-ink-muted">Last updated: April 12, 2026</p>

        <h2>1. Overview</h2>
        <p>ScribeNoter ("we", "us") is operated by Nina Basiliko, Maryland, USA. This policy explains how we collect, use, and protect your data.</p>

        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> Email address and password (via secure authentication)</li>
          <li><strong>Audio files:</strong> Audio recordings you upload for transcription, stored in private cloud storage</li>
          <li><strong>Transcription data:</strong> Song titles, instrument selections, and transcription outputs (MIDI, MusicXML)</li>
          <li><strong>Usage data:</strong> Basic technical information such as browser type and IP address</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>To provide the transcription service</li>
          <li>To authenticate your account and secure your data</li>
          <li>To store your transcription history for your access</li>
          <li>We do not sell your data, use it for advertising, or use your audio to train AI models</li>
        </ul>

        <h2>4. Third-Party Services</h2>
        <p>To provide the Service, your data is processed by the following third parties:</p>
        <ul>
          <li><strong>Klangio GmbH</strong> (klang.io) — AI music transcription processing. Audio files are sent to Klangio for transcription and are retained by Klangio for up to 14 days before deletion. Klangio is based in Karlsruhe, Germany. See Klangio's privacy policy at <a href="https://klang.io/privacy" target="_blank" rel="noopener noreferrer">klang.io/privacy</a>.</li>
          <li><strong>Render</strong> (render.com) — backend server infrastructure. Servers located in the United States.</li>
          <li><strong>Lovable</strong> (lovable.dev) — frontend hosting. Servers located in the United States.</li>
        </ul>

        <h2>5. Data Retention</h2>
        <ul>
          <li>Audio files are stored in your private account and retained until you delete them or close your account</li>
          <li>Transcription outputs are retained in your account history until deleted</li>
          <li>Klangio deletes audio files from their servers within 14 days of processing</li>
        </ul>

        <h2>6. Data Security</h2>
        <p>All data is transmitted over encrypted HTTPS connections. Audio files are stored in private, access-controlled cloud storage scoped to your account. Only you can access your files.</p>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the data we hold about you</li>
          <li>Request deletion of your account and all associated data</li>
          <li>Export your transcription outputs at any time</li>
        </ul>
        <p>To exercise these rights, contact us at <a href="mailto:devops@scribenoter.com">devops@scribenoter.com</a></p>

        <h2>8. Children</h2>
        <p>ScribeNoter is not intended for users under 13 years of age.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.</p>

        <h2>10. Contact</h2>
        <p>Privacy questions? Contact us at <a href="mailto:devops@scribenoter.com">devops@scribenoter.com</a></p>
      </article>
    </main>
    <Footer />
  </>
);

export default PrivacyPage;
