import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_COUNTRY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles your data: your photos and text stay on your device; we use Google Analytics, with your consent where required.`,
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {SITE_NAME} is a free web app for making images for social media. It is run by {OPERATOR}, based in {OPERATOR_COUNTRY} (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). This policy explains what information is involved when you use {SITE_NAME}, and the choices you have. Questions:{" "}
        {mail}.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>
          <strong>Your photos and text never leave your device.</strong> Images are made in your browser. We don&rsquo;t upload, store or see
          anything you put into a post.
        </li>
        <li>There are no accounts, and we don&rsquo;t ask for your name or email.</li>
        <li>
          We use <strong>Google Analytics</strong> to count visits and see which templates are used. In the EU, UK and Switzerland it only runs
          if you agree; everywhere, you can turn it off with &ldquo;Cookie settings&rdquo;.
        </li>
        <li>We don&rsquo;t sell your information, show ads or build advertising profiles.</li>
      </ul>

      <h2>1. What stays on your device</h2>
      <p>
        So your work is still there when you come back, {SITE_NAME} saves it in your browser&rsquo;s own storage on your device (IndexedDB and
        localStorage). This includes the text, photos and settings of your posts, your brand details (page name, logo, profile picture), the
        post size you chose and your cookie choice. This data is never sent to us. You can delete it at any time by clearing this site&rsquo;s
        data in your browser settings, or by using &ldquo;Start over&rdquo; in a template.
      </p>

      <h2>2. Analytics (Google Analytics)</h2>
      <p>
        We use Google Analytics 4, provided by Google LLC, to understand how {SITE_NAME} is used so we can improve it. When it runs, it
        collects:
      </p>
      <ul>
        <li>pages viewed, time spent and how you arrived (for example, from a search or a shared link);</li>
        <li>device and browser type, screen size and language;</li>
        <li>approximate location (country and city), which Google derives from your IP address. Google Analytics 4 does not store IP addresses;</li>
        <li>
          two events from the app: which template you choose, and when you download a post (the template, post size and image quality, never the
          image or its text).
        </li>
      </ul>
      <p>
        Google Analytics sets cookies named <code>_ga</code> and <code>_ga_&lt;ID&gt;</code> that last up to 2 years, to tell visits apart. We
        keep analytics data for up to 14 months. Advertising features are turned off. Google processes this data under its own terms; see{" "}
        <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">
          how Google uses information from sites that use its services
        </a>
        .
      </p>
      <h3>Your choice</h3>
      <p>
        If you are in the EU/EEA, the UK or Switzerland, Google Analytics stays off unless you press &ldquo;Accept&rdquo;. Elsewhere it is on
        unless you press &ldquo;Decline&rdquo;. You can change your choice at any time with the &ldquo;Cookie settings&rdquo; link at the bottom
        of this page or in the app. You can also use Google&rsquo;s{" "}
        <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener" target="_blank">
          opt-out browser add-on
        </a>
        .
      </p>

      <h2>3. Hosting</h2>
      <p>
        {SITE_NAME} is hosted by Vercel Inc. Like any web host, Vercel&rsquo;s servers receive your IP address and browser details when your
        browser loads the site, and keep short-lived logs of these requests to deliver the site and protect it from abuse. Fonts and icons are
        served from our own site, so loading {SITE_NAME} doesn&rsquo;t contact font services.
      </p>

      <h2>4. Legal bases (GDPR and UK GDPR)</h2>
      <ul>
        <li>Analytics: your consent where it is required, which you can withdraw at any time.</li>
        <li>Hosting logs: our legitimate interest in running a secure, working website.</li>
      </ul>

      <h2>5. International transfers</h2>
      <p>
        Google and Vercel may process data in the United States and other countries. They rely on safeguards such as the EU Standard
        Contractual Clauses and the EU-U.S. Data Privacy Framework.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct or delete personal data about you, to object to or restrict its
        use, to withdraw consent and to complain to a data protection authority. This includes rights under the EU and UK GDPR, India&rsquo;s
        Digital Personal Data Protection Act, 2023 and California&rsquo;s CCPA/CPRA. Because we don&rsquo;t collect your name or email and can&rsquo;t
        link analytics to you, the simplest steps are to decline analytics (&ldquo;Cookie settings&rdquo;) and clear this site&rsquo;s data in
        your browser. For anything else, or for grievances under Indian law, email {mail} and we will reply within 30 days.
      </p>
      <p>We do not sell or share personal information for cross-context behavioral advertising.</p>

      <h2>7. Children</h2>
      <p>
        {SITE_NAME} is not directed at children under 13, and we don&rsquo;t knowingly collect personal data from them. In the EU, children
        under 16 should use it only with a parent&rsquo;s consent.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        If we change how {SITE_NAME} handles data, we will update this page and the &ldquo;Last updated&rdquo; date above. Significant changes,
        such as collecting new kinds of data, will be shown in the app.
      </p>

      <h2>9. Contact</h2>
      <p>
        {OPERATOR}, {OPERATOR_COUNTRY}. Email: {mail}.
      </p>
    </LegalPage>
  );
}
