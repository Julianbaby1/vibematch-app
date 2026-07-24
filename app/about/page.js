import InfoPage from '../../components/InfoPage';

export const metadata = { title: 'About — VibeMatch' };

export default function AboutPage() {
  return (
    <InfoPage title="About VibeMatch">
      <p><strong>Find someone who fits your life, not just your photos.</strong></p>
      <p>
        VibeMatch is a dating and social platform built exclusively for adults age 35 and
        older. We started VibeMatch because dating apps built around endless swiping reward
        snap judgments and punish real people with real lives.
      </p>
      <p>
        Instead of a swipe pile, VibeMatch gives you five curated matches a day, each with a
        plain-language explanation of why we think you two fit — shared relationship goals,
        compatible schedules, communication style, and lifestyle. Hard dealbreakers are always
        respected: we never recommend someone who conflicts with your non-negotiables.
      </p>
      <h2>What makes us different</h2>
      <p>
        Membership is exclusively 35+. Matching is conversation-first, not photo-first. There is
        no endless swiping. Community rooms and social games help you actually talk. Safety
        tools — reporting, blocking, and human moderation — are built in from day one.
      </p>
      <h2>Honesty about where we are</h2>
      <p>
        VibeMatch is a young product and we are building in the open. Features that are not
        finished are labeled as coming soon — we will not pretend something works when it
        does not.
      </p>
    </InfoPage>
  );
}
