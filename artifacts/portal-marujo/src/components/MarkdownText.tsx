import { Link } from "wouter";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal markdown: paragraphs, **bold**, [label](/path) links.
 * First `# heading` line is returned separately via parseMarkdownTitle.
 */
export function parseMarkdownTitle(md: string): {
  title: string | null;
  body: string;
} {
  const trimmed = md.replace(/^\uFEFF/, "").trim();
  const lines = trimmed.split(/\r?\n/);
  if (lines[0]?.startsWith("# ")) {
    return {
      title: lines[0].slice(2).trim(),
      body: lines.slice(1).join("\n").replace(/^\n+/, ""),
    };
  }
  return { title: null, body: trimmed };
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // **bold** | [label](url)
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) != null) {
    if (m.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${i++}`}>
          {text.slice(last, m.index)}
        </Fragment>,
      );
    }
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const internal = href.startsWith("/") && !href.startsWith("//");
        if (internal) {
          nodes.push(
            <Link
              key={`${keyPrefix}-l-${i++}`}
              href={href}
              className="text-primary hover:underline font-medium"
            >
              {label}
            </Link>,
          );
        } else {
          nodes.push(
            <a
              key={`${keyPrefix}-a-${i++}`}
              href={href}
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>,
          );
        }
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-t-${i++}`}>{text.slice(last)}</Fragment>,
    );
  }
  return nodes;
}

export function MarkdownText({
  content,
  className,
  paragraphClassName,
}: {
  content: string;
  className?: string;
  paragraphClassName?: string;
}) {
  const blocks = content
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((block, idx) => {
        const lines = block.split(/\n/).map((l) => l.trimEnd());
        return (
          <p
            key={idx}
            className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              paragraphClassName,
            )}
          >
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 ? <br /> : null}
                {renderInline(line, `${idx}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
