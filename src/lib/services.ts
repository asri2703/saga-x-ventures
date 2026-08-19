/**
 * Service catalogue.
 *
 * Each entry generates its own page at /services/[slug], plus its nav entry,
 * homepage card, and sitemap URL. Add a service here and it appears everywhere.
 *
 * Why separate pages instead of one long "Services" page: you sell SEO, so you
 * need to rank for "google ads agency malaysia", "web developer for small
 * business", etc. One page cannot rank for five different search intents.
 */

export type Service = {
  slug: string;
  name: string;
  /** Short label used in nav and cards */
  short: string;
  /** One-line summary — appears on cards and in the meta description */
  summary: string;
  /** Page headline */
  headline: string;
  /** Opening paragraph on the service page */
  intro: string;
  /** The pain the SME actually feels — written in their words, not ours */
  pain: string[];
  /** What they get. Concrete deliverables beat vague promises. */
  includes: string[];
  /** Honest scope boundary — builds trust, filters bad-fit leads */
  bestFor: string;
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "website-development",
    name: "Website Development",
    short: "Websites",
    summary:
      "Fast, mobile-first websites built to turn visitors into enquiries — not just look pretty.",
    headline: "Websites that bring in enquiries, not just compliments",
    intro:
      "Most SME websites are digital brochures. They look fine, load slowly, and sit there. We build around one question: what do you want the visitor to do next? Then we remove everything standing in the way of it.",
    pain: [
      "Your site looks dated next to your competitors",
      "It loads slowly on mobile — where most of your traffic is",
      "You get visitors, but almost no enquiries",
      "Your previous developer disappeared and you cannot update anything",
    ],
    includes: [
      "Custom design — no recycled templates",
      "Mobile-first build, tested on real devices",
      "Copywriting focused on enquiries, not word count",
      "Technical SEO foundation from day one",
      "WhatsApp and enquiry form integration",
      "Google Analytics 4 and Search Console setup",
      "Speed optimisation — we target 90+ on PageSpeed",
      "Handover training so you are not dependent on us",
    ],
    bestFor:
      "SMEs who need their website to actively generate enquiries — service businesses, clinics, professional firms, and retailers moving online.",
    faqs: [
      {
        q: "How long does a website take?",
        a: "Most SME sites take 3 to 6 weeks from kickoff, depending on how many pages you need and how quickly content and photos come back from your side. We give you a firm timeline before starting, not an estimate that keeps moving.",
      },
      {
        q: "Do I own the website?",
        a: "Yes, completely. You own the domain, the hosting account, and the code. We hand over every login at the end. You are never locked in with us.",
      },
      {
        q: "Can I update it myself afterwards?",
        a: "Yes. We set up an editor for the content you will actually change — text, images, blog posts, promotions — and walk you through it before handover.",
      },
      {
        q: "What about hosting?",
        a: "We deploy to modern hosting that is fast and, for a typical SME site, costs very little — often nothing at all at your traffic levels. We set the account up in your name so it belongs to you, and we tell you the running cost before we build.",
      },
    ],
  },
  {
    slug: "google-ads",
    name: "Google Ads",
    short: "Google Ads",
    summary:
      "Capture people already searching for what you sell — and stop paying for clicks that never convert.",
    headline: "Show up when people are already looking to buy",
    intro:
      "Google Ads is the closest thing to buying intent directly. Someone types “aircond service near me” and you appear. Done badly, it drains a budget fast. Done properly, it is the most predictable lead source an SME can have.",
    pain: [
      "You are spending money but cannot tell what it produced",
      "Clicks come in, enquiries do not",
      "Your cost per lead keeps climbing",
      "An agency runs your account but you have no idea what they changed",
    ],
    includes: [
      "Full account audit before we touch anything",
      "Keyword research based on buying intent, not search volume",
      "Negative keyword lists to stop wasted spend",
      "Conversion tracking so every ringgit is traceable",
      "Landing page review — ads cannot fix a weak page",
      "Ad copy testing, refreshed monthly",
      "Plain-English monthly report: spend, leads, cost per lead",
      "You own the ad account, always",
    ],
    bestFor:
      "Businesses whose customers actively search for their service — home services, clinics, legal and accounting firms, B2B suppliers, and trades.",
    faqs: [
      {
        q: "How much should I budget for ads?",
        a: "It depends entirely on your industry — a click costs very different amounts in legal services and in food delivery. During the free audit we check what your competitors are paying in your area, then recommend a starting budget with the reasoning behind it. If your market needs more than you can commit, we will say so rather than take the work and let it underperform.",
      },
      {
        q: "How fast will I see results?",
        a: "Traffic starts on day one. Meaningful optimisation needs 4 to 6 weeks of conversion data. Anyone promising results in week one is guessing.",
      },
      {
        q: "Who owns the ad account?",
        a: "You do. We work inside your Google Ads account with our own access. If we part ways, you keep the account, the history, and all the learning in it.",
      },
      {
        q: "Do you lock me into a contract?",
        a: "No. We work month to month. If we are not producing, you should be free to leave — that keeps the pressure where it belongs, on us.",
      },
    ],
  },
  {
    slug: "social-media-ads",
    name: "Social Media Ads",
    short: "Social Ads",
    summary:
      "Facebook, Instagram and TikTok campaigns that create demand — with creative built for the feed.",
    headline: "Reach buyers before they start searching",
    intro:
      "Search ads capture existing demand. Social ads create it. The difference is creative: on social, nobody is looking for you, so the first two seconds decide everything. We build campaigns around that reality.",
    pain: [
      "Boosted posts get likes but no sales",
      "Your ads stopped working and you do not know why",
      "You cannot tell whether the problem is targeting or creative",
      "You cannot trace which ad actually produced a customer",
    ],
    includes: [
      "Meta Pixel and TikTok Pixel setup, tested properly",
      "Audience strategy — cold, warm, and retargeting",
      "Ad creative direction and copywriting",
      "Static and short-form video concepts built for the feed",
      "Structured A/B testing, not random guesses",
      "Retargeting to recover visitors who did not enquire",
      "Monthly report tied to leads and sales, not vanity metrics",
      "You own the Business Manager account",
    ],
    bestFor:
      "Businesses with something visual to show or an offer worth interrupting for — F&B, retail, beauty and wellness, property, education, and e-commerce.",
    faqs: [
      {
        q: "Is boosting a post not the same thing?",
        a: "No. Boosting is one button with almost no control over audience, placement, or objective. A properly structured campaign lets us target, test, and retarget — which is where the results come from.",
      },
      {
        q: "Do you produce the video content?",
        a: "We handle concept, script, and direction, and we can produce simple content. For larger shoots we bring in a videographer or work with footage your team films — we will tell you upfront which route your budget suits.",
      },
      {
        q: "Facebook, Instagram or TikTok — which one?",
        a: "It depends on where your customers actually spend time, not on which platform is trending. We recommend after looking at your business, and we would rather run one platform properly than three badly.",
      },
      {
        q: "What budget do I need?",
        a: "Enough for the platform to exit its learning phase — below that you are paying for data you never get to use. What that figure is depends on your audience size and industry, so we work it out during the audit and tell you before you commit anything.",
      },
    ],
  },
  {
    slug: "seo",
    name: "SEO",
    short: "SEO",
    summary:
      "Rank for what your customers actually search — and stop renting every click from Google.",
    headline: "Traffic you do not have to pay for every month",
    intro:
      "Ads stop the day you stop paying. SEO compounds. It is slower and less glamorous, but for an SME it is the difference between renting customers and owning a channel. We focus on the searches that lead to money, not the ones that look good in a report.",
    pain: [
      "You are invisible on Google unless someone types your business name",
      "A competitor with a worse product outranks you",
      "An agency sends ranking reports but your enquiries never move",
      "You do not appear on Google Maps for your own area",
    ],
    includes: [
      "Full technical audit — speed, indexing, mobile, structure",
      "Keyword research mapped to buying intent",
      "On-page optimisation across your key pages",
      "Google Business Profile optimisation for local search",
      "Local SEO and citation cleanup",
      "Content plan targeting real customer questions",
      "Internal linking and site structure fixes",
      "Monthly reporting on rankings, traffic, and enquiries",
    ],
    bestFor:
      "Businesses serving a defined area or niche where customers search before they buy — and who can commit to at least six months, because that is what SEO honestly takes.",
    faqs: [
      {
        q: "How long before SEO works?",
        a: "Expect early movement in 2 to 3 months and meaningful results in 6 to 12. Anyone guaranteeing page one in 30 days is either misleading you or about to get your site penalised.",
      },
      {
        q: "Can you guarantee first place on Google?",
        a: "No, and neither can anyone else — Google does not sell rankings. What we can commit to is the work: the audit, the fixes, the content, and honest reporting on what moved.",
      },
      {
        q: "Should I do SEO or ads first?",
        a: "If you need leads this month, ads. If you want lower costs next year, SEO. Most SMEs we work with run ads for immediate flow while SEO builds underneath. We will tell you which your situation actually calls for.",
      },
      {
        q: "Do you do local SEO and Google Maps?",
        a: "Yes, and for most local SMEs that is where the fastest wins are. Appearing in the map pack for your area often beats ranking nationally.",
      },
    ],
  },
  {
    slug: "system-development",
    name: "System Development",
    short: "Systems",
    summary:
      "Custom CRMs, booking systems and internal tools that replace the spreadsheet holding your business together.",
    headline: "Replace the spreadsheet your business depends on",
    intro:
      "Most growing SMEs run on a spreadsheet, a WhatsApp group, and someone's memory. It works until it does not. We build the internal systems that remove the manual work — quotations, bookings, customer records, reporting — so your team stops re-typing the same information.",
    pain: [
      "The same data gets entered in three different places",
      "Only one person knows how the process actually works",
      "Off-the-shelf software does 60% of what you need",
      "You are paying per-user fees for features you never use",
    ],
    includes: [
      "Process mapping before any code is written",
      "Custom CRM, booking, or quotation systems",
      "Customer and inventory dashboards",
      "Automation between the tools you already use",
      "WhatsApp and payment gateway integration",
      "Role-based access for your team",
      "Training and documentation for your staff",
      "Ongoing support and improvements",
    ],
    bestFor:
      "SMEs whose manual admin has become the bottleneck to growth, and businesses whose workflow does not fit standard software.",
    faqs: [
      {
        q: "Is custom software not expensive?",
        a: "It costs more upfront than a subscription but has no per-user fee, so it often works out cheaper by year two — especially as your team grows. We will be straight with you: if an existing tool fits your needs, we will tell you to use it.",
      },
      {
        q: "How long does a system take to build?",
        a: "A focused tool takes 4 to 8 weeks. Larger systems we build in phases so you get something usable early rather than waiting months for everything at once.",
      },
      {
        q: "What happens if we stop working together?",
        a: "You own the code and the data. We hand over the repository, the hosting, and the documentation. No hostage situations.",
      },
      {
        q: "Can it connect to what we already use?",
        a: "Usually yes — accounting software, payment gateways, WhatsApp, Google Workspace. We check integration options during process mapping, before committing to anything.",
      },
    ],
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
