import React from 'react';
import { DecisionLogEntry } from '../types/strategy';
import { History, Download, Trash2, FileSpreadsheet } from 'lucide-react';

interface DecisionLogProps {
  logEntries: DecisionLogEntry[];
  onClearLog: () => void;
}

export const DecisionLog: React.FC<DecisionLogProps> = ({ logEntries, onClearLog }) => {
  const handleExportCSV = () => {
    if (logEntries.length === 0) return;

    const headers = [
      'Timestamp',
      'Circuit',
      'Current Lap',
      'Weather State',
      'Safety Car State',
      'Recommended Strategy',
      'Compound',
      'Pit Lap',
      'Projected Position',
      'Advantage Over Stay Out (s)',
      'Confidence (%)',
      'Decisive Reason'
    ];

    const rows = logEntries.map((e) => [
      `"${e.timestamp}"`,
      `"${e.circuitName}"`,
      e.currentLap,
      `"${e.weatherState}"`,
      `"${e.safetyCarState}"`,
      `"${e.recommendedStrategy.replace(/"/g, '""')}"`,
      `"${e.recommendedCompound}"`,
      `"${e.pitLap}"`,
      `"P${e.projectedPosition}"`,
      e.advantageOverStayOutSec.toFixed(2),
      e.confidenceScore,
      `"${e.decisiveReason.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `apex_pitwall_decision_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Strategy Run Decision Log ({logEntries.length} Records)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={logEntries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 transition-colors shadow-sm"
            title="Download Decision Log as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT CSV
          </button>

          <button
            onClick={onClearLog}
            disabled={logEntries.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:pointer-events-none text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
            title="Clear all log history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            CLEAR
          </button>
        </div>
      </div>

      {logEntries.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-slate-500">
          No strategy evaluation runs recorded yet. Adjust scenario parameters to generate log entries.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Circuit</th>
                <th className="py-2 px-3">Lap</th>
                <th className="py-2 px-3">Conditions</th>
                <th className="py-2 px-3">Recommendation</th>
                <th className="py-2 px-3">Compound</th>
                <th className="py-2 px-3">Projected</th>
                <th className="py-2 px-3">Advantage vs Stay</th>
                <th className="py-2 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {logEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-1.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">{e.timestamp}</td>
                  <td className="py-1.5 px-3 font-semibold text-white whitespace-nowrap">{e.circuitName}</td>
                  <td className="py-1.5 px-3 whitespace-nowrap">L{e.currentLap}</td>
                  <td className="py-1.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                    {e.weatherState} • {e.safetyCarState}
                  </td>
                  <td className="py-1.5 px-3 font-bold text-cyan-300 whitespace-nowrap">{e.recommendedStrategy}</td>
                  <td className="py-1.5 px-3 whitespace-nowrap">{e.recommendedCompound}</td>
                  <td className="py-1.5 px-3 font-bold text-emerald-400 whitespace-nowrap">P{e.projectedPosition}</td>
                  <td className="py-1.5 px-3 whitespace-nowrap">
                    {e.advantageOverStayOutSec > 0 ? (
                      <span className="text-emerald-400 font-bold">+{e.advantageOverStayOutSec.toFixed(1)}s</span>
                    ) : (
                      <span className="text-slate-400">{e.advantageOverStayOutSec.toFixed(1)}s</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 whitespace-nowrap text-white">{e.confidenceScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
