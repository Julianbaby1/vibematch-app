import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Contact — VibeMatch' };

export default function ContactPage() {
  return (
    <InfoPage title="Contact Us">
      <p>We read every message. Here is where to send yours:</p>
      <h2>Support</h2>
      <p>
        Account problems, bugs, billing, or general questions:{' '}
        <a href="mailto:support@justmytype.help">support@justmytype.help</a>
      </p>
      <h2>Safety</h2>
      <p>
        Report a safety concern about a member or content:{' '}
        <a href="mailto:safety@justmytype.help">safety@justmytype.help</a>. In-app reporting (on
        any profile or message) is the fastest route to our moderation team.
      </p>
      <h2>Privacy and data requests</h2>
      <p>
        Data export or deletion questions:{' '}
        <a href="mailto:privacy@justmytype.help">privacy@justmytype.help</a>, or use the{' '}
        <a href="/delete-account">Account Deletion page</a>.
      </p>
      <h2>Child safety</h2>
      <p>
        Concerns that anyone underage may be on the platform:{' '}
        <a href="mailto:safety@justmytype.help">safety@justmytype.help</a> — these reports are
        prioritized above all others. See our <a href="/child-safety">Child Safety Standards</a>.
      </p>
    </InfoPage>
  );
}
