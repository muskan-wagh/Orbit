import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
  LegalList,
} from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Orbit",
  description: "Terms of Service for Orbit — AI Job Application OS.",
};

const CONTACT_EMAIL = "muskanwagh1608@gmail.com";

export default function TermsPage() {
  return (
    <LegalPageLayout
      updated="Last updated: August 19, 2026"
      title="Terms of Service"
    >
      <LegalSection title="Acceptance">
        <p>
          By accessing or using Orbit, you agree to be bound by these Terms of
          Service. If you do not agree to these terms, you may not use Orbit.
        </p>
      </LegalSection>

      <LegalSection title="Service Description">
        <p>
          Orbit is an AI-powered job application management tool that helps
          users organize applications, emails, resumes, tasks, and related
          information.
        </p>
      </LegalSection>

      <LegalSection title="User Responsibilities">
        <p>You are responsible for:</p>
        <LegalList
          items={[
            "The information you provide to Orbit",
            "The resumes you upload",
            "The Gmail access you authorize",
            "Verifying AI-generated information before relying on it",
            "Complying with applicable laws and the terms of third-party platforms you interact with",
          ]}
        />
      </LegalSection>

      <LegalSection title="AI Disclaimer">
        <p>
          Orbit may use AI to classify emails, extract information, recommend
          actions, produce matching scores, and suggest next steps. AI-generated
          output may be inaccurate, incomplete, or out of date, and should be
          reviewed by you.
        </p>
        <p>Orbit does not guarantee:</p>
        <LegalList
          items={[
            "Employment or job offers",
            "Interviews or application success",
            "The accuracy of extracted information",
            "The completeness of job information",
          ]}
        />
      </LegalSection>

      <LegalSection title="Gmail Authorization">
        <p>
          Connecting Gmail is optional and controlled entirely by you. Orbit
          only requests the permissions displayed during the Google
          authorization flow, and you may revoke access at any time.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Use Orbit for any unlawful purpose",
            "Abuse or overload the service",
            "Attempt unauthorized access to Orbit or other accounts",
            "Attempt to compromise the security of the system",
            "Upload malicious content",
            "Use Orbit in a way that violates third-party terms",
          ]}
        />
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          Orbit and all related software, design, and content are owned by Orbit
          and its developers. You retain all rights to the content you provide,
          subject to the licenses and permissions necessary for Orbit to
          operate the service.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          We may suspend or terminate your access to Orbit for violations of
          these terms or for security reasons. You may stop using Orbit at any
          time.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          Orbit is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          without warranties of any kind, express or implied, to the maximum
          extent permitted by applicable law. We do not warrant that Orbit will
          be uninterrupted, error-free, or that results will meet your
          expectations.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Orbit and its
          developers will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits, data, or
          goodwill, arising from or related to your use of Orbit, even if
          advised of the possibility of such damages. Nothing in these terms
          limits liability that cannot be limited under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Changes to These Terms">
        <p>
          We may update these Terms of Service from time to time. Continued use
          of Orbit after changes are posted constitutes acceptance of the
          updated terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          If you have questions about these Terms of Service, you can contact
          us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}