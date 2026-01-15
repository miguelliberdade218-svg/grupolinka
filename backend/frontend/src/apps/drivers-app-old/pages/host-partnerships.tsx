import HostPartnershipSetup from "@/shared/components/HostPartnershipSetup";
import PageHeader from "@/shared/components/PageHeader";

export default function HostPartnerships() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Parcerias para Alojamentos" />
      <HostPartnershipSetup />
    </div>
  );
}