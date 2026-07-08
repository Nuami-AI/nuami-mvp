import { notFound } from "next/navigation";
import { getContentById } from "@/lib/content/queries";
import PageShell from "@/components/PageShell";
import BackButton from "@/components/BackButton";
import ContentBadges from "@/components/ContentBadges";
import { PageHeader } from "@/components/ui/page-header";

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ country?: string; category?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  let post;
  try {
    post = await getContentById(id);
  } catch {
    post = null;
  }

  if (!post) notFound();

  const backParams = new URLSearchParams();
  if (sp.country) backParams.set("country", sp.country);
  else backParams.set("country", post.country);
  if (sp.category) backParams.set("category", sp.category);
  const backHref = `/content${backParams.size > 0 ? `?${backParams.toString()}` : ""}`;

  const bodyParagraphs = post.body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <PageShell topNav="culture" bottomNav="culture">
      <PageHeader
        leading={<BackButton href={backHref} />}
        trailing={<ContentBadges category={post.category} country={post.country} />}
      />

      {/* Desktop: inline back + badges */}
      <div className="hidden md:flex items-center gap-3 px-6 pt-6 pb-2">
        <BackButton href={backHref} />
        <ContentBadges category={post.category} country={post.country} />
      </div>

      <article className="px-4 md:px-6 pb-8">
          <h1 className="text-[20px] md:text-[24px] font-bold text-text-primary leading-snug mb-2">
            {post.title}
          </h1>
          <p className="text-[14px] text-text-secondary mb-6">{post.summary}</p>

          <div className="space-y-3">
            {bodyParagraphs.map((para, i) => {
              if (para.startsWith("# ")) {
                return (
                  <h2 key={i} className="text-[16px] font-bold text-text-primary mt-5">
                    {para.replace(/^#+\s/, "")}
                  </h2>
                );
              }
              if (para.startsWith("## ") || para.startsWith("### ")) {
                return (
                  <h3 key={i} className="text-[14px] font-semibold text-text-primary mt-4">
                    {para.replace(/^#+\s/, "")}
                  </h3>
                );
              }
              if (para.startsWith("- ") || para.startsWith("* ")) {
                return (
                  <li key={i} className="text-[14px] text-text-primary leading-relaxed list-disc ml-4">
                    {para.replace(/^[-*]\s/, "")}
                  </li>
                );
              }
              return (
                <p key={i} className="text-[14px] text-text-primary leading-relaxed">
                  {para}
                </p>
              );
            })}
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[12px] text-text-secondary bg-infoBox rounded-full px-2.5 py-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
    </PageShell>
  );
}
