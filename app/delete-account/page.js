import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Delete Your Account — VibeMatch' };

export default function DeleteAccountPage() {
  return (
    <InfoPage title="Delete Your Account" updated="July 23, 2026">
      <p>
        You can permanently delete your VibeMatch account and its data at any time. This page
        exists so you can always find deletion instructions, even if you cannot sign in — and to
        satisfy Google Play's account-deletion requirements.
      </p>
      <h2>Delete from inside the app</h2>
      <p>
        Sign in, open <strong>Settings</strong>, choose <strong>Delete account</strong>, and
        confirm. Deletion starts immediately.
      </p>
      <h2>Delete by email</h2>
      <p>
        If you cannot sign in, email{' '}
        <a href="mailto:privacy@justmytype.help">privacy@justmytype.help</a> from the address on
        your account with the subject "Delete my account." We will verify it is really you, then
        process the deletion.
      </p>
      <h2>What gets deleted</h2>
      <p>
        Your profile, photos, prompt answers, quiz answers, matches, likes, and room memberships
        are permanently deleted. Messages you sent may remain visible to the people you sent them
        to, with your name removed.
      </p>
      <h2>Narrow exceptions</h2>
      <p>
        We may retain limited records where required for fraud prevention, active abuse or safety
        investigations, or legal obligations. These records are kept only as long as necessary and
        are never used for matching or marketing.
      </p>
      <h2>Want your data first?</h2>
      <p>
        Before deleting, you can request an export of your data from Settings or by emailing{' '}
        <a href="mailto:privacy@justmytype.help">privacy@justmytype.help</a>.
      </p>
    </InfoPage>
  );
}
