import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'Safety Center — VibeMatch' };

export default function SafetyPage() {
  return (
    <InfoPage title="Safety Center">
      <p>
        Your safety matters more to us than any feature. Here is how to stay safe on VibeMatch and
        what tools you have.
      </p>
      <h2>Tools built into VibeMatch</h2>
      <p>
        Block any member instantly — they cannot see you or contact you again. Report any profile,
        message, or room post to our human moderation team. Mute conversations or rooms without
        unmatching. Our safety assistant flags likely scams, harassment, and suspicious links in
        real time and gives you one-tap options to report or block.
      </p>
      <h2>Protect your money</h2>
      <p>
        No genuine match will ever ask you for money, gift cards, cryptocurrency, or your financial
        details. If anyone does — no matter how good the story sounds — stop, report them, and do
        not send anything. Romance scams target people of every age and background.
      </p>
      <h2>Protect your information</h2>
      <p>
        Keep conversations on VibeMatch until you trust someone. Do not share your home address,
        workplace details, or financial information. Be cautious with anyone who pushes to move to
        another app quickly.
      </p>
      <h2>Meeting in person</h2>
      <p>
        Meet in a public place. Tell a friend or family member where you are going and with whom.
        Arrange your own transportation there and back. Video chat before meeting if you can.
        Trust your gut — you can leave at any time, and you never owe anyone a reason.
      </p>
      <h2>If something goes wrong</h2>
      <p>
        If you are in immediate danger, call 911 (or your local emergency number) first. Then
        report the member to us — reports of threats and serious harm go to the front of our
        moderation queue. You can reach our safety team directly at{' '}
        <a href="mailto:safety@justmytype.help">safety@justmytype.help</a>.
      </p>
    </InfoPage>
  );
}
