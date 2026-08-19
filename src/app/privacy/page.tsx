import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
  LegalList,
} from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Orbit",
  description: "Privacy Policy for Orbit — AI Job Application OS.",
};

const CONTACT_EMAIL = "muskanwagh1608@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      updated="Last updated: August 19, 2026"
      title="Privacy Policy"
    >
      <LegalSection title="Overview">
        <p>
          This Privacy Policy explains how Orbit (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
          information when you use Orbit, an AI-powered job application
          management tool. By using Orbit, you agree to the practices described
          in this policy.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect">
        <p>We collect the following categories of information:</p>
        <LegalList
          items={[
            <>
              <strong>Account information</strong> used for authentication,
              such as your sign-in identity and account identifier.
            </>,
            <>
              <strong>Email address</strong> associated with your account.
            </>,
            <>
              <strong>Job application information</strong> you enter into
              Orbit, such as company, job title, status, and related details.
            </>,
            <>
              <strong>Resume files and information</strong> you upload.
            </>,
            <>
              <strong>Application notes, tasks, and related data</strong> you
              create while using the service.
            </>,
            <>
              <strong>Gmail information</strong>, only after you explicitly
              connect your Gmail account (see below).
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Gmail Data">
        <p>
          Connecting Gmail is optional and entirely controlled by you. When you
          connect Gmail, Orbit requests read-only access using the following
          permission scope:
        </p>
        <p>
          <code className="rounded border bg-muted px-1.5 py-0.5 text-[12px]">
            https://www.googleapis.com/auth/gmail.readonly
          </code>
        </p>
        <p>
          Orbit uses Gmail data only to identify and organize job-related
          emails and to extract information such as:
        </p>
        <LegalList
          items={[
            "Company",
            "Job title",
            "Application status",
            "Interview information",
            "Assessment information",
            "Deadlines",
            "Relevant email metadata",
          ]}
        />
        <p>Orbit does not:</p>
        <LegalList
          items={[
            "Send, delete, modify, or compose emails using your Gmail account.",
            "Sell Gmail data.",
            "Use Gmail data for advertising purposes.",
          ]}
        />
        <p>
          You can revoke Orbit&apos;s access to your Gmail data at any time
          through your Google Account at{" "}
          <a
            href="https://myaccount.google.com/permissions"
            className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="AI Processing">
        <p>
          When AI processing is enabled, Orbit may use AI to process relevant
          job and application information in order to:
        </p>
        <LegalList
          items={[
            "Classify job-related emails",
            "Extract structured information from emails",
            "Match emails to applications",
            "Generate useful action items",
          ]}
        />
        <p>
          AI-generated results are informational and reviewed within Orbit.
          Orbit does not make irreversible decisions on your behalf without
          your control — you can review, edit, or discard any AI-generated
          output before it affects your data.
        </p>
      </LegalSection>

      <LegalSection title="Data Storage">
        <p>
          Your application data is stored using Supabase/PostgreSQL. Uploaded
          files may use Supabase Storage when that functionality is enabled.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We take reasonable measures to help protect your information,
          including keeping secrets and OAuth tokens server-side, and isolating
          your data by account. No method of transmission or storage is
          completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="Your Rights">
        <p>Subject to applicable law, you may have the right to:</p>
        <LegalList
          items={[
            <>
              <strong>Access</strong> the information Orbit holds about you.
            </>,
            <>
              <strong>Correct</strong> inaccurate information in your account.
            </>,
            <>
              <strong>Delete</strong> information you no longer wish to store.
            </>,
            <>
              <strong>Disconnect Gmail</strong> at any time to stop further
              Gmail data collection.
            </>,
            <>
              <strong>Request account and data deletion</strong>, where
              supported by the service.
            </>,
          ]}
        />
        <p>
          To exercise any of these rights, contact us using the details below.
        </p>
      </LegalSection>

      <LegalSection title="Third Parties">
        <p>
          Orbit works with a small number of service providers to operate the
          service:
        </p>
        <LegalList
          items={[
            <>
              <strong>Google / Gmail API</strong> — provides the read-only
              Gmail access you authorize to retrieve email metadata and
              content.
            </>,
            <>
              <strong>Supabase</strong> — provides authentication, the
              PostgreSQL database, and (when enabled) file storage.
            </>,
            <>
              <strong>OpenRouter / AI provider</strong> — processes job and
              application information when AI features are enabled.
            </>,
          ]}
        />
        <p>
          These providers act on our behalf for the purposes described in this
          policy. We do not otherwise sell or share your personal information.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          If you have questions about this Privacy Policy, you can contact us
          at{" "}
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