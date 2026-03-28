interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  inline?: boolean;
}

export default function Loader({ size = "md", text, className = "", inline = false }: LoaderProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  const spinner = (
    <div
      className={`rounded-full border-gray-300 border-t-[#667eea] animate-spin ${sizeClasses[size]}`}
    />
  );

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {spinner}
        {text && <span className="text-sm text-gray-500">{text}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      {spinner}
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

export function NavbarLoader() {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-gray-200 animate-pulse"
          style={{ width: `${40 + i * 12}px` }}
        />
      ))}
    </div>
  );
}

export function TableLoader({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="neu-raised overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 rounded bg-gray-200 animate-pulse w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-b border-gray-100">
                {Array.from({ length: columns }).map((_, col) => (
                  <td key={col} className="px-4 py-3">
                    <div
                      className="h-4 rounded bg-gray-100 animate-pulse"
                      style={{ width: `${50 + ((row + col) % 3) * 20}%`, maxWidth: "120px" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="neu-raised p-5">
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-200 animate-pulse w-3/4" />
            <div className="h-3 rounded bg-gray-100 animate-pulse w-1/2" />
            <div className="flex justify-between items-center mt-3">
              <div className="h-3 rounded bg-gray-100 animate-pulse w-24" />
              <div className="h-7 rounded-lg bg-gray-100 animate-pulse w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
