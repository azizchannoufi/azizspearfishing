import { Fragment } from "react";
import { Preloader } from "@/components/preloader/Preloader";
import { Navigation } from "@/components/navigation/Navigation";
import { Footer } from "@/components/sections/Footer";
import { ContactForm } from "@/components/sections/ContactForm";
import type { HomeCmsData } from "@/lib/content/load-home";
import type { HomepageSectionKey, SocialLinks } from "@/lib/firebase/types";
import Link from "next/link";

const SOCIAL_KEYS = [
  "instagram",
  "youtube",
  "tiktok",
  "facebook",
  "linkedin",
  "x",
  "email",
] as const;

const SOCIAL_STAT_FIELDS: Array<{
  key: keyof SocialLinks;
  network: string;
  label: string;
}> = [
  { key: "instagramFollowers", network: "Instagram", label: "Followers" },
  { key: "instagramViews", network: "Instagram", label: "Views" },
  { key: "youtubeSubscribers", network: "YouTube", label: "Subscribers" },
  { key: "youtubeViews", network: "YouTube", label: "Views" },
  { key: "tiktokFollowers", network: "TikTok", label: "Followers" },
  { key: "tiktokViews", network: "TikTok", label: "Views" },
  { key: "facebookFollowers", network: "Facebook", label: "Followers" },
  { key: "facebookViews", network: "Facebook", label: "Views" },
];

const NETWORK_ORDER = ["Instagram", "YouTube", "TikTok", "Facebook"] as const;

type SocialReachMetric = { id: string; label: string; value: string };
type SocialReachGroup = { network: string; metrics: SocialReachMetric[] };

function enabled(data: HomeCmsData, key: HomepageSectionKey) {
  const section = data.sections.find((s) => s.key === key);
  return section ? section.enabled : true;
}

function socialHref(value: string) {
  if (value.includes("@") && !value.startsWith("http")) return `mailto:${value}`;
  return value;
}

function socialReachGroups(social: SocialLinks | null | undefined): SocialReachGroup[] {
  if (!social) return [];

  const byNetwork = new Map<string, SocialReachMetric[]>();
  for (const field of SOCIAL_STAT_FIELDS) {
    const value = social[field.key];
    if (typeof value !== "string" || !value.trim()) continue;
    const list = byNetwork.get(field.network) || [];
    list.push({ id: field.key, label: field.label, value: value.trim() });
    byNetwork.set(field.network, list);
  }

  return NETWORK_ORDER.filter((network) => byNetwork.has(network)).map((network) => ({
    network,
    metrics: byNetwork.get(network)!,
  }));
}

function SocialReachSection({ groups }: { groups: SocialReachGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <section id="social" className="section-pad border-b border-foam/10 py-16 md:py-20">
      <p className="text-center text-[11px] tracking-[0.35em] text-foam-muted">SOCIAL REACH</p>
      <div
        className={`mx-auto mt-12 grid max-w-6xl gap-10 sm:gap-8 ${
          groups.length === 1
            ? "sm:grid-cols-1"
            : groups.length === 2
              ? "sm:grid-cols-2"
              : groups.length === 3
                ? "sm:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {groups.map((group) => (
          <div
            key={group.network}
            className="border-t border-foam/15 pt-6 text-center sm:border-t-0 sm:border-l sm:border-foam/15 sm:pt-0 sm:pl-8 first:sm:border-l-0 first:sm:pl-0"
          >
            <p className="text-[11px] tracking-[0.35em] text-accent-teal">{group.network.toUpperCase()}</p>
            <div className="mt-6 flex flex-row justify-center gap-10 sm:flex-col sm:gap-8">
              {group.metrics.map((metric) => (
                <div key={metric.id}>
                  <p className="font-display text-4xl text-foam md:text-5xl">{metric.value}</p>
                  <p className="mt-2 text-[11px] tracking-[0.28em] text-foam-muted">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CmsHome({ data }: { data: HomeCmsData }) {
  const brand = data.settings?.athleteName || data.athlete?.name || data.hero?.title || "AZIZ";
  const socialEntries = SOCIAL_KEYS.map((key) => {
    const value = data.social?.[key];
    return typeof value === "string" && value.trim() ? ([key, value.trim()] as const) : null;
  }).filter((entry): entry is readonly [typeof SOCIAL_KEYS[number], string] => entry !== null);
  const socialReach = socialReachGroups(data.social);

  const blocks = data.sections
    .filter((s) => s.enabled)
    .map((s) => s.key)
    .filter(Boolean);

  const order =
    blocks.length > 0
      ? blocks
      : ([
          "hero",
          "athlete",
          "statistics",
          "career",
          "ocean",
          "gallery",
          "videos",
          "sponsors",
          "journal",
          "contact",
        ] as HomepageSectionKey[]);

  const profileFacts = data.athlete
    ? [
        { label: "Nationality", value: data.athlete.nationality },
        { label: "Years active", value: data.athlete.yearsActive },
        { label: "Max depth", value: data.athlete.maximumDepth ? `${data.athlete.maximumDepth}m` : "" },
        { label: "Competitions", value: data.athlete.competitionsCount },
        { label: "Podiums", value: data.athlete.podiumsCount },
        { label: "Countries", value: data.athlete.countriesVisited },
      ].filter((f) => Boolean(f.value))
    : [];

  return (
    <main className="relative">
      <Preloader />
      <Navigation />

      {order.map((key) => {
        if (key === "hero" && enabled(data, "hero") && data.hero) {
          return (
            <Fragment key="hero">
              <section
                id="hero"
                className="relative flex min-h-[100svh] items-end overflow-hidden bg-ocean-deep pb-16 pt-28 md:items-center md:pb-0"
              >
                {data.hero.image?.secureUrl && (
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.hero.image.secureUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/55 via-ocean-deep/35 to-ocean-deep" />
                  </div>
                )}
                <div className="section-pad relative z-10 w-full max-w-6xl">
                  <h1 className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-[0.9] text-foam">
                    {data.hero.title || brand}
                  </h1>
                  {data.hero.subtitle && (
                    <p className="mt-4 font-display text-[clamp(1.4rem,4vw,2.6rem)] text-foam/90">
                      {data.hero.subtitle}
                    </p>
                  )}
                  {data.hero.description && (
                    <p className="mt-6 max-w-xl whitespace-pre-line text-foam-muted">
                      {data.hero.description}
                    </p>
                  )}
                  {(data.hero.primaryButtonText || data.hero.secondaryButtonText) && (
                    <div className="mt-10 flex flex-wrap gap-4">
                      {data.hero.primaryButtonText && (
                        <a
                          href={data.hero.primaryButtonLink || "#about"}
                          className="border border-foam/40 px-5 py-3 text-xs tracking-[0.2em] text-foam"
                        >
                          {data.hero.primaryButtonText}
                        </a>
                      )}
                      {data.hero.secondaryButtonText && (
                        <a
                          href={data.hero.secondaryButtonLink || "#contact"}
                          className="px-5 py-3 text-xs tracking-[0.2em] text-foam-muted"
                        >
                          {data.hero.secondaryButtonText}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </section>
              <SocialReachSection groups={socialReach} />
            </Fragment>
          );
        }

        if (key === "athlete" && enabled(data, "athlete") && data.athlete) {
          return (
            <section key="athlete" id="about" className="section-pad bg-ocean-deep py-24">
              <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
                <div>
                  <p className="text-[11px] tracking-[0.35em] text-accent-teal">ABOUT</p>
                  <h2 className="font-display mt-3 text-5xl text-foam md:text-7xl">
                    {data.athlete.professionalTitle || data.athlete.name || "About"}
                  </h2>
                  {data.athlete.shortBiography && (
                    <p className="mt-6 text-foam-muted">{data.athlete.shortBiography}</p>
                  )}
                  {data.athlete.fullBiography && (
                    <div
                      className="prose prose-invert mt-6 max-w-none text-foam-muted"
                      dangerouslySetInnerHTML={{ __html: data.athlete.fullBiography }}
                    />
                  )}
                  {profileFacts.length > 0 && (
                    <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {profileFacts.map((fact) => (
                        <div key={fact.label} className="border-t border-foam/15 pt-3">
                          <dt className="text-[10px] uppercase tracking-[0.2em] text-foam-muted">
                            {fact.label}
                          </dt>
                          <dd className="mt-1 font-display text-xl text-foam">{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                {data.athlete.profileImage?.secureUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.athlete.profileImage.secureUrl}
                    alt={data.athlete.name}
                    className="h-full max-h-[560px] w-full object-cover"
                  />
                )}
              </div>
            </section>
          );
        }

        if (key === "statistics" && enabled(data, "statistics") && data.stats.length > 0) {
          return (
            <section key="statistics" className="section-pad border-y border-foam/10 py-20">
              <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {data.stats.map((s) => (
                  <div key={s.id}>
                    <p className="font-display text-5xl text-foam">{s.number}</p>
                    <p className="mt-2 text-sm tracking-wide text-foam-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === "career" && enabled(data, "career") && data.competitions.length > 0) {
          return (
            <section key="career" id="career" className="section-pad py-24">
              <h2 className="font-display text-5xl text-foam md:text-7xl">Career</h2>
              <ul className="mt-10 space-y-8">
                {data.competitions.map((c) => (
                  <li
                    key={c.id}
                    className="grid gap-6 border-b border-foam/10 pb-8 md:grid-cols-[220px_1fr]"
                  >
                    {c.image?.secureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image.secureUrl}
                        alt={c.name}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full bg-foam/5" />
                    )}
                    <div>
                      <p className="font-display text-2xl text-foam md:text-3xl">{c.name}</p>
                      <p className="mt-2 text-foam-muted">
                        {[c.date, c.location, c.country].filter(Boolean).join(" · ")}
                        {c.position ? ` — ${c.position}` : ""}
                      </p>
                      {c.score && (
                        <p className="mt-1 text-sm text-accent-teal">Score: {c.score}</p>
                      )}
                      {c.description && (
                        <p className="mt-3 text-sm text-foam-muted">{c.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        }

        if (key === "ocean" && enabled(data, "ocean") && data.achievements.length > 0) {
          return (
            <section key="ocean" id="achievements" className="section-pad py-24">
              <h2 className="font-display text-5xl text-foam md:text-7xl">Achievements</h2>
              <ul className="mt-10 grid gap-8 sm:grid-cols-2">
                {data.achievements.map((a) => (
                  <li key={a.id} className="overflow-hidden border border-foam/10">
                    {a.image?.secureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image.secureUrl}
                        alt={a.competitionName}
                        className="aspect-[16/10] w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <p className="font-display text-2xl text-foam">{a.competitionName}</p>
                      <p className="mt-2 text-foam-muted">
                        {[a.year, a.location, a.country].filter(Boolean).join(" · ")}
                        {a.position ? ` — ${a.position}` : ""}
                      </p>
                      {a.score && (
                        <p className="mt-1 text-sm text-accent-teal">Score: {a.score}</p>
                      )}
                      {a.description && (
                        <p className="mt-3 text-sm text-foam-muted">{a.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        }

        if (key === "gallery" && enabled(data, "gallery") && data.gallery.length > 0) {
          return (
            <section key="gallery" id="gallery" className="section-pad py-24">
              <h2 className="font-display text-5xl text-foam md:text-7xl">Gallery</h2>
              <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
                {data.gallery.map((img) => (
                  <figure key={img.id} className="mb-4 break-inside-avoid">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.secureUrl} alt={img.title || "Gallery"} className="w-full object-cover" />
                    {(img.title || img.category) && (
                      <figcaption className="mt-2 text-xs tracking-wide text-foam-muted">
                        {[img.title, img.category].filter(Boolean).join(" · ")}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          );
        }

        if (key === "videos" && enabled(data, "videos") && data.videos.length > 0) {
          return (
            <section key="videos" id="videos" className="section-pad py-24">
              <h2 className="font-display text-5xl text-foam md:text-7xl">Videos</h2>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {data.videos.map((v) => {
                  if (v.videoUrl) {
                    return (
                      <article
                        key={v.id}
                        className="overflow-hidden border border-foam/15"
                      >
                        <video
                          src={v.videoUrl}
                          controls
                          playsInline
                          poster={v.thumbnail?.secureUrl}
                          className="aspect-video w-full bg-black object-contain"
                        />
                        <div className="p-4">
                          <p className="font-display text-2xl text-foam">{v.title}</p>
                          {v.description && (
                            <p className="mt-2 text-sm text-foam-muted">{v.description}</p>
                          )}
                        </div>
                      </article>
                    );
                  }

                  return (
                    <a
                      key={v.id}
                      href={v.youtubeUrl || "#"}
                      target={v.youtubeUrl ? "_blank" : undefined}
                      rel="noreferrer"
                      className="block border border-foam/15 p-4 transition hover:border-accent-teal"
                    >
                      {v.thumbnail?.secureUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnail.secureUrl}
                          alt=""
                          className="mb-4 aspect-video w-full object-cover"
                        />
                      )}
                      <p className="font-display text-2xl text-foam">{v.title}</p>
                      {v.description && (
                        <p className="mt-2 text-sm text-foam-muted">{v.description}</p>
                      )}
                    </a>
                  );
                })}
              </div>
            </section>
          );
        }

        if (key === "sponsors" && enabled(data, "sponsors") && data.sponsors.length > 0) {
          return (
            <section key="sponsors" id="sponsors" className="section-pad py-24">
              <h2 className="font-display text-5xl text-foam md:text-7xl">Sponsors</h2>
              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {data.sponsors.map((s) => (
                  <a
                    key={s.id}
                    href={s.website || "#"}
                    target={s.website ? "_blank" : undefined}
                    rel="noreferrer"
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    {s.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.name} className="h-16 w-auto object-contain" />
                    )}
                    <span className="text-sm text-foam">{s.name}</span>
                    {s.tier && <span className="text-xs text-foam-muted">{s.tier}</span>}
                  </a>
                ))}
              </div>
            </section>
          );
        }

        if (key === "journal" && enabled(data, "journal") && data.articles.length > 0) {
          return (
            <section key="journal" id="journal" className="section-pad py-24">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="font-display text-5xl text-foam md:text-7xl">Journal</h2>
                <Link href="/news" className="text-xs tracking-[0.2em] text-foam-muted hover:text-accent-teal">
                  View all
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {data.articles.map((a) => (
                  <Link key={a.id} href={`/news/${a.slug}`} className="block border border-foam/10 p-4">
                    {a.coverImage?.secureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.coverImage.secureUrl}
                        alt=""
                        className="mb-4 aspect-[16/10] w-full object-cover"
                      />
                    )}
                    <p className="font-display text-2xl text-foam">{a.title}</p>
                    {a.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-foam-muted">{a.excerpt}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        }

        if (key === "contact" && enabled(data, "contact")) {
          return (
            <section key="contact" id="contact" className="section-pad py-24">
              <h2 className="font-display text-5xl text-foam md:text-7xl">
                {data.settings?.athleteName ? `Contact ${data.settings.athleteName}` : "Contact"}
              </h2>
              <ContactForm emailFallback={data.settings?.email || data.social?.email} />
              {socialEntries.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-6">
                  {socialEntries.map(([label, href]) => (
                    <a
                      key={label}
                      href={socialHref(href)}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="text-[11px] uppercase tracking-[0.28em] text-foam-muted hover:text-accent-teal"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </section>
          );
        }

        return null;
      })}

      {/* If hero is missing, still show social reach near the top */}
      {socialReach.length > 0 && !(enabled(data, "hero") && data.hero) && (
        <SocialReachSection groups={socialReach} />
      )}

      {!data.hero && !data.athlete && data.gallery.length === 0 && (
        <section className="flex min-h-[70svh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-display text-6xl text-foam md:text-8xl">{brand}</h1>
            <p className="mt-4 text-foam-muted">
              Content is managed from the admin CMS. Publish sections to appear here.
            </p>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
