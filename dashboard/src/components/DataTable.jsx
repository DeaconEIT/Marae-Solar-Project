import { useState } from 'react';
import { color, font } from '../theme/tokens';
import { formatDate } from '../lib/metrics';

// A dense, sortable table for the raw daily rows. Columns are defined by the
// caller; sorting is client-side since the whole dataset (a few dozen rows
// at most, from Excel exports) fits in memory.
export default function DataTable({ columns, rows }) {
  const [sort, setSort] = useState({ key: 'date', dir: 'asc' });

  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${color.panelBorder}`, borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font.ui, fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{
                  textAlign: col.key === 'date' ? 'left' : 'right',
                  padding: '11px 14px',
                  borderBottom: `2px solid ${color.panelBorderStrong}`,
                  color: color.cream,
                  fontWeight: 700,
                  fontSize: 12.5,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
                {sort.key === col.key && (sort.dir === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.date} style={{ background: i % 2 === 1 ? color.panelAlt : 'transparent' }}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.key === 'date' ? 'left' : 'right',
                    padding: '10px 14px',
                    color: color.cream,
                    fontFamily: col.key === 'date' ? font.ui : font.number,
                    fontWeight: col.key === 'date' ? 400 : 600,
                    ...font.tabularNums,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.key === 'date' ? formatDate(row.date) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
