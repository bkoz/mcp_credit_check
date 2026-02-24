interface ConsumerFormData {
  firstName: string;
  lastName: string;
  ssn: string;
  houseNumber: string;
  streetName: string;
  streetType: string;
  city: string;
  state: string;
  zip: string;
}

const TOKEN_URL = "https://api.sandbox.equifax.com/v2/oauth/token";
const CREDIT_URL =
  "https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report";

export async function getEquifaxToken(): Promise<string> {
  const username = process.env.EQUIFAX_USERNAME;
  const password = process.env.EQUIFAX_PASSWORD;

  if (!username || !password) {
    throw new Error("EQUIFAX_USERNAME and EQUIFAX_PASSWORD must be set");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`Failed to obtain Equifax token: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

export function buildConsumerPayload(form: ConsumerFormData) {
  return {
    consumers: {
      name: [
        {
          identifier: "current",
          firstName: form.firstName.toUpperCase(),
          lastName: form.lastName.toUpperCase(),
        },
      ],
      socialNum: [
        {
          identifier: "current",
          number: form.ssn.replace(/-/g, ""),
        },
      ],
      addresses: [
        {
          identifier: "current",
          houseNumber: form.houseNumber,
          streetName: form.streetName.toUpperCase(),
          streetType: form.streetType.toUpperCase(),
          city: form.city.toUpperCase(),
          state: form.state.toUpperCase(),
          zip: form.zip,
        },
      ],
    },
    customerReferenceidentifier: "2C800002-DOR7",
    customerConfiguration: {
      equifaxUSConsumerCreditReport: {
        pdfComboIndicator: "Y",
        memberNumber: "999XX12345",
        securityCode: "@U2",
        customerCode: "IAPI",
        multipleReportIndicator: "1",
        models: [
          { identifier: "02778", modelField: ["3", form.state.toUpperCase()] },
          { identifier: "05143" },
          { identifier: "02916" },
        ],
        ECOAInquiryType: "Individual",
      },
      equifaxUSConsumerTwnRequest: {
        userId: "twnUser@1234",
        userPassword: "pass123",
        permissiblePurposeCode: "PPASSESS",
        templateName: "Full VOI",
      },
      equifaxUSConsumerDataxInquiryRequest: {
        authentication: {
          licensekey: "licenseKey123",
          password: "passwd123",
        },
      },
    },
  };
}

export async function fetchCreditReport(
  token: string,
  payload: ReturnType<typeof buildConsumerPayload>
) {
  const res = await fetch(CREDIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export function extractReportSummary(report: Record<string, unknown>) {
  const creditReport =
    (
      report as {
        consumers?: {
          equifaxUSConsumerCreditReport?: Record<string, unknown>[];
        };
      }
    )?.consumers?.equifaxUSConsumerCreditReport?.[0] ?? {};

  return {
    subjectName: creditReport.subjectName,
    birthDate: creditReport.birthDate,
    hitCode: creditReport.hitCode,
    fileSinceDate: creditReport.fileSinceDate,
    lastActivityDate: creditReport.lastActivityDate,
    fraudSocialNumAlertCode: creditReport.fraudSocialNumAlertCode,
    fraudVictimIndicator: creditReport.fraudVictimIndicator,
    models: creditReport.models,
    trades: ((creditReport.trades as Record<string, unknown>[]) ?? []).map(
      (t) => ({
        accountDesignator: t.accountDesignator,
        creditorName: t.creditorName,
        accountNumber: t.accountNumber,
        dateOpened: t.dateOpened,
        dateClosed: t.dateClosed,
        dateLastPayment: t.dateLastPayment,
        highCredit: t.highCredit,
        balance: t.balance,
        pastDue: t.pastDue,
        paymentHistory: t.paymentHistory,
        delinquencies30Days: t.delinquencies30Days,
        delinquencies60Days: t.delinquencies60Days,
        delinquencies90to180Days: t.delinquencies90to180Days,
      })
    ),
    inquiries: creditReport.inquiries,
    publicRecords: creditReport.publicRecords,
    collections: creditReport.collections,
  };
}
