import ReportsClient from '../ReportsClient';

export default function PendingReportsPage() {
  return <ReportsClient initialStatus="pending" initialType="all" />;
}
