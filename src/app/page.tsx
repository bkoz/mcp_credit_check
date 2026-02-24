import { readFileSync } from "fs";
import { join } from "path";
import type { ConsumerFormData } from "@/lib/types";
import CreditReportForm from "@/components/CreditReportForm";

function parseConsumerJson(): ConsumerFormData {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "consumer.json"), "utf-8")
  );

  const name = raw?.consumers?.name?.[0] ?? {};
  const ssn = raw?.consumers?.socialNum?.[0] ?? {};
  const addr = raw?.consumers?.addresses?.[0] ?? {};

  return {
    firstName: name.firstName ?? "",
    lastName: name.lastName ?? "",
    ssn: ssn.number ?? "",
    houseNumber: addr.houseNumber ?? "",
    streetName: addr.streetName ?? "",
    streetType: addr.streetType ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zip ?? "",
  };
}

export default function Home() {
  const defaults = parseConsumerJson();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          MCP Credit Report Demo
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Review the pre-populated consumer data or edit before submitting.
        </p>
        <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6">
          <CreditReportForm defaultValues={defaults} />
        </div>
      </div>
    </div>
  );
}
