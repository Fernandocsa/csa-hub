import { useGetBiggestVictories, useGetBiggestDefeats } from "@workspace/api-client-react";
import { RecordsLayout } from "./RecordsLayout";
import { RecordMatchTable } from "@/components/RecordMatchTable";

export default function Records() {
  const { data: victories, isLoading: lV } = useGetBiggestVictories({ limit: 10 });
  const { data: defeats, isLoading: lD } = useGetBiggestDefeats({ limit: 10 });

  return (
    <RecordsLayout title="Recordes Históricos" subtitle="Marcos e estatísticas de desempenho do CSA">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            10 Maiores Vitórias
          </h2>
          <RecordMatchTable data={victories} isLoading={lV} colorClass="text-green-600" clickable />
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            10 Maiores Derrotas
          </h2>
          <RecordMatchTable data={defeats} isLoading={lD} colorClass="text-red-600" clickable />
        </section>
      </div>
    </RecordsLayout>
  );
}
