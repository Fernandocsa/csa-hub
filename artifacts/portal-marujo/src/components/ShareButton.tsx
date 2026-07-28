import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ShareButtonProps = {
  /** Title / text included in the share payload. */
  title: string;
  /** Optional longer description (used by Web Share when supported). */
  text?: string;
  /** Override URL; defaults to current page URL. */
  url?: string;
  className?: string;
  size?: "sm" | "md";
};

function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to legacy
  }
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Discrete share control: Web Share API on mobile / supported browsers,
 * clipboard fallback otherwise.
 */
export function ShareButton({
  title,
  text,
  url,
  className,
  size = "sm",
}: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const native = canNativeShare();

  async function handleShare() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const shareText = text ?? title;

    if (native) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        // User cancelled — do nothing
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Other errors → fallback
      }
    }

    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      toast({ title: "Link copiado", description: "Cole onde quiser compartilhar." });
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Não foi possível copiar",
        description: shareUrl,
        variant: "destructive",
      });
    }
  }

  const iconCls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Compartilhar"
      aria-label="Compartilhar página"
      data-testid="button-share"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-muted-foreground",
        "hover:text-foreground hover:bg-muted/60 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "md" ? "h-8 w-8" : "h-7 w-7",
        className,
      )}
    >
      {copied ? (
        <Check className={cn(iconCls, "text-green-600")} aria-hidden />
      ) : native ? (
        <Share2 className={iconCls} aria-hidden />
      ) : (
        <Link2 className={iconCls} aria-hidden />
      )}
    </button>
  );
}
