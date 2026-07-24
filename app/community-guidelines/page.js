import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Community Guidelines — VibeMatch' };

export default function GuidelinesPage() {
  return (
    <InfoPage title="Community Guidelines" updated="July 23, 2026">
      <p>
        VibeMatch is for adults 35+ looking for real connection. These guidelines keep it that way.
        You must accept them before posting content anywhere on VibeMatch.
      </p>
      <h2>Be who you say you are</h2>
      <p>
        Use recent photos of yourself, your real first name, and your real age. No impersonation,
        no fake profiles, no accounts on behalf of someone else.
      </p>
      <h2>Treat people with respect</h2>
      <p>
        No harassment, hate speech, threats, or bullying. No unwanted sexual messages or images.
        If someone unmatches or stops responding, let it go.
      </p>
      <h2>Never ask members for money</h2>
      <p>
        Requesting money, gift cards, crypto, financial details, or investment "opportunities" from
        members is an immediate, permanent ban. This is the number one scam pattern on dating
        platforms and we have zero tolerance for it.
      </p>
      <h2>Keep rooms on topic and welcoming</h2>
      <p>
        Community rooms have their own posted rules and moderators. No spam, no repeated
        self-promotion, no link dumping. Moderators can mute, apply slow mode, or remove members
        who break room rules.
      </p>
      <h2>Reporting and enforcement</h2>
      <p>
        Every profile, message, and room post can be reported. Reports go to human moderators.
        Depending on severity we may warn, mute, suspend, or permanently remove an account.
        Suspensions can be appealed from the app, and a complete moderation history is kept.
      </p>
    </InfoPage>
  );
}
