import type { Block } from "@/lib/ucat-lessons";

/** A lesson's or a question's text: paragraphs, lists, tips and tables. */
export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3 text-[17px] leading-relaxed text-gray-900">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "p":
            return <p key={i}>{b.text}</p>;
          case "list": {
            const List = b.ordered ? "ol" : "ul";
            return (
              <List key={i} className={`${b.ordered ? "list-decimal" : "list-disc"} pl-6 space-y-1`}>
                {b.items.map((item, j) => <li key={j}>{item}</li>)}
              </List>
            );
          }
          case "tip":
            return (
              <aside key={i} className="border-l-2 border-gray-900 pl-4 py-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">Tip</span>
                <span className="block">{b.text}</span>
              </aside>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full text-[15px] border-t border-gray-900">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      {b.head.map((h) => <th key={h} className="py-2 pr-4 text-xs font-bold uppercase tracking-wide text-gray-600">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {b.rows.map((row, j) => (
                      <tr key={j}>{row.map((cell, k) => <td key={k} className="py-2 pr-4 align-top">{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
