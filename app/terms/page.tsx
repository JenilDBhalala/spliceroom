import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_COUNTRY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms for using ${SITE_NAME}, the free meme, poster and Instagram post maker.`,
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms apply when you use {SITE_NAME}, a free web app run by {OPERATOR} in {OPERATOR_COUNTRY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        By using {SITE_NAME}, you agree to them. If you don&rsquo;t agree, please don&rsquo;t use it.
      </p>

      <h2>1. Using {SITE_NAME}</h2>
      <p>
        {SITE_NAME} lets you make images, such as memes, posters, quote cards and post graphics, from templates in your browser. It is free and
        needs no account. You may use it for personal and commercial purposes, as long as you follow these terms and the law.
      </p>

      <h2>2. Your content</h2>
      <p>
        You own what you make with {SITE_NAME}, and everything you put in: your photos, text and logos. They stay on your device; we don&rsquo;t
        receive them, so we claim no rights over them.
      </p>
      <p>
        You are responsible for what you make and share. Only use photos, film stills, logos, artwork and text that you have the right to use,
        for example because you own them, you have permission, or your use is allowed by law (such as fair use or fair dealing for commentary,
        criticism, news or parody). Movie stills, posters, title logos and brand names usually belong to their studios and owners.
      </p>

      <h2>3. News tools</h2>
      <p>
        The news tools show headlines and links from public film news feeds and, when you pick a story, add the article&rsquo;s own photos and
        AI-written headlines and slides to your post. The photos belong to their photographers, agencies, studios or publishers; {SITE_NAME}
        doesn&rsquo;t own them and gives you no right to use them. Crediting the source is good practice, but a credit alone is not permission.
        Before you post, make sure your use is allowed, or swap in photos you have the rights to.
      </p>
      <p>
        AI-written text can contain mistakes. Check names, numbers and facts against the original articles before you share anything, and
        don&rsquo;t present a rumor as confirmed news.
      </p>
      <p>
        Our free AI has a daily limit per person and may change or stop at any time; when it&rsquo;s unavailable, posts use the
        article&rsquo;s own title. If you add your own Gemini API key, you are responsible for your Google account, its limits and any costs,
        and for following Google&rsquo;s terms. The news list links to articles on other websites, whose content we don&rsquo;t control.
      </p>
      <p>
        If you own content shown by {SITE_NAME} and want it removed, write to {mail} with a link to it, and we&rsquo;ll act on it promptly.
      </p>

      <h2>4. What you must not do</h2>
      <p>Don&rsquo;t use {SITE_NAME} to make or share content that:</p>
      <ul>
        <li>infringes someone else&rsquo;s copyright, trademark, privacy or other rights;</li>
        <li>
          impersonates a real person or organization in a misleading way. In particular, don&rsquo;t present the tweet/X post template as a
          real post by a real person who didn&rsquo;t write it. Clearly labeled parody and commentary are fine;
        </li>
        <li>is defamatory, harassing, hateful, threatening, sexually exploitative, or encourages violence or illegal activity;</li>
        <li>involves the sexual exploitation of anyone under 18, or shares someone&rsquo;s intimate images without consent;</li>
        <li>is spam, a scam, or deliberately false information designed to mislead.</li>
      </ul>
      <p>Also don&rsquo;t try to disrupt, overload or break into the service.</p>

      <h2>5. Templates, fonts and names</h2>
      <p>
        You may use the templates and the images you make with them freely, including on social media and for commercial work. The fonts in{" "}
        {SITE_NAME} are open-source fonts licensed under the SIL Open Font License, which allows this use.
      </p>
      <p>
        {SITE_NAME} is an independent tool. It is not affiliated with, endorsed by or sponsored by Instagram, Meta, X (Twitter), IMDb or any film
        studio. Their names are trademarks of their owners and are used only to describe the kinds of images you can make. The sample text and
        placeholder images in the templates are examples; replace them with your own content.
      </p>

      <h2>6. The service is provided &ldquo;as is&rdquo;</h2>
      <p>
        We work to keep {SITE_NAME} running well, but we provide it free of charge, &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
        warranties of any kind. We may change, pause or stop any part of it at any time. Your work is saved only in your browser, which can be
        cleared, so keep copies of anything important by downloading it.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the extent the law allows, we are not liable for any indirect, incidental or consequential loss, for lost work or data, or for how
        you or others use images made with {SITE_NAME}. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>8. Indemnity</h2>
      <p>
        If someone makes a claim against us because of content you made or shared with {SITE_NAME} in breach of these terms, you agree to cover
        the reasonable costs that result, to the extent the law allows.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms. The &ldquo;Last updated&rdquo; date above shows when they last changed. If you keep using {SITE_NAME} after a
        change, the new terms apply.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of {OPERATOR_COUNTRY}, and the courts of {OPERATOR_COUNTRY} have jurisdiction. If you live in a
        country whose consumer laws give you more protection, those protections still apply.
      </p>

      <h2>11. Contact</h2>
      <p>Questions about these terms, or a report about misuse: {mail}.</p>
    </LegalPage>
  );
}
