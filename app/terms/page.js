import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Terms of Service — VibeMatch' };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service" updated="July 23, 2026">
      <h2>Who can use VibeMatch</h2>
      <p>
        You must be at least 35 years old to create an account. You must provide accurate
        information, including your real date of birth. Accounts found to belong to anyone under 35
        are removed.
      </p>
      <h2>Your account</h2>
      <p>
        You are responsible for keeping your login credentials private. One account per person.
        Impersonating someone else, creating fake profiles, or misrepresenting your identity is
        prohibited.
      </p>
      <h2>Acceptable use</h2>
      <p>
        You agree not to harass, threaten, or abuse other members; not to send sexual content that
        is unwanted or unsolicited; not to request money, financial details, or gifts from members;
        not to post spam, scams, or malicious links; and not to use VibeMatch for any illegal
        purpose. Our <a href="/community-guidelines">Community Guidelines</a> are part of these
        terms and you must accept them before posting content.
      </p>
      <h2>Content</h2>
      <p>
        You own the content you post. By posting, you give VibeMatch the limited license needed to
        display it to other members as part of the service. We may remove content that violates
        these terms or our guidelines.
      </p>
      <h2>Safety and moderation</h2>
      <p>
        We use a combination of automated detection and human moderators. Serious violations can
        lead to suspension or permanent removal. Automated systems alone never make irreversible
        punishment decisions — a human reviews serious cases, and suspensions can be appealed.
      </p>
      <h2>Termination and deletion</h2>
      <p>
        You may delete your account at any time from Settings or via the{' '}
        <a href="/delete-account">Account Deletion page</a>. We may suspend or terminate accounts
        that violate these terms.
      </p>
      <h2>Disclaimers</h2>
      <p>
        VibeMatch is provided as-is. We work hard on safety, but we cannot guarantee the conduct of
        members. Always follow the precautions in our <a href="/safety">Safety Center</a> when
        meeting someone new.
      </p>
      <p style={{ fontStyle: 'italic' }}>
        Note: these terms are a working draft prepared for launch and will be reviewed by a
        qualified attorney before app-store publication.
      </p>
    </InfoPage>
  );
}
