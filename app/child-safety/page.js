import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Child Safety Standards — VibeMatch' };

export default function ChildSafetyPage() {
  return (
    <InfoPage title="Child Safety Standards" updated="July 23, 2026">
      <p>
        VibeMatch is exclusively for adults age 35 and older. Minors are never permitted on the
        platform under any circumstances. This page describes our standards against child sexual
        abuse and exploitation (CSAE).
      </p>
      <h2>Zero tolerance</h2>
      <p>
        We have zero tolerance for child sexual abuse material (CSAM), child sexual exploitation,
        grooming, sexualization of minors, or any attempt by a minor to access the platform. Any
        such content or behavior results in immediate account removal and, where appropriate,
        reports to the National Center for Missing &amp; Exploited Children (NCMEC) and law
        enforcement.
      </p>
      <h2>How we keep minors off the platform</h2>
      <p>
        Every account requires a date of birth showing an age of at least 35, enforced at signup,
        in our backend, and in our database rules. Accounts reported or detected as potentially
        underage are suspended pending review. Members can report suspected underage users from any
        profile, and these reports are prioritized above all others in our moderation queue.
      </p>
      <h2>In-app reporting</h2>
      <p>
        Every profile, message, and room post has a report option. Reports go to human moderators.
        Child-safety reports are reviewed with the highest priority.
      </p>
      <h2>Dedicated contact</h2>
      <p>
        Our designated child-safety point of contact can be reached at{' '}
        <a href="mailto:safety@justmytype.help">safety@justmytype.help</a>. Law enforcement
        inquiries may use the same address.
      </p>
      <h2>Compliance</h2>
      <p>
        We comply with applicable child-safety laws, including CSAM reporting obligations, and with
        the Google Play Child Safety Standards policy for dating apps.
      </p>
    </InfoPage>
  );
}
