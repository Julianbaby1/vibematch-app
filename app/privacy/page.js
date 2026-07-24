import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Privacy Policy — VibeMatch' };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated="July 23, 2026">
      <p>
        This policy explains, in plain English, what information VibeMatch collects, how we use
        it, and the choices you have. VibeMatch is operated at justmytype.help.
      </p>
      <h2>What we collect</h2>
      <p>
        Account information you give us: email address, first name, date of birth (to enforce our
        35+ requirement), and password (stored only as a secure hash by our authentication
        provider). Profile information you choose to add: photos, bio, city, life stage, interests,
        prompt answers, and compatibility quiz answers. Activity on the platform: matches, likes and
        passes, messages you send, rooms you join, and reports you file. Technical basics: device
        type, app version, and logs needed to keep the service running and secure.
      </p>
      <h2>What we do not do</h2>
      <p>
        We do not sell your personal information. We do not show you advertising based on your
        private messages. We do not infer sensitive traits such as race, religion, health
        conditions, or sexual orientation from your photos or private messages.
      </p>
      <h2>How we use your information</h2>
      <p>
        To create and secure your account, to generate your daily matches and explain them, to
        deliver messages, to keep the community safe (including automated scam and harassment
        detection with human review), and to comply with legal obligations.
      </p>
      <h2>AI features</h2>
      <p>
        VibeMatch includes clearly labeled AI assistants (profile coach, matchmaker, conversation
        coach, and safety assistant). AI never impersonates a member and never sends messages on
        your behalf. Content is processed by AI only for the features you use.
      </p>
      <h2>Sharing</h2>
      <p>
        We share data only with service providers needed to run VibeMatch (such as our database and
        authentication provider), and with authorities when legally required or when necessary to
        protect a person from serious harm.
      </p>
      <h2>Your choices</h2>
      <p>
        You can edit your profile at any time, export your data, and permanently delete your
        account from inside the app or via our <a href="/delete-account">Account Deletion page</a>.
        Deletion permanently removes your profile data, subject to narrow, documented exceptions for
        fraud prevention, abuse investigations, and legal retention requirements.
      </p>
      <h2>Age requirement</h2>
      <p>
        VibeMatch is exclusively for adults 35 and older. We do not knowingly allow anyone under 35
        to hold an account, and we never allow minors under any circumstances. See our{' '}
        <a href="/child-safety">Child Safety Standards</a>.
      </p>
      <p style={{ fontStyle: 'italic' }}>
        Note: this policy is a working draft prepared for launch and will be reviewed by a
        qualified attorney before app-store publication.
      </p>
    </InfoPage>
  );
}
