import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleCheck,
  FileText,
  Layers3,
  MessageSquareText,
  MoveRight,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import styles from "./landing.module.css";

export const metadata = {
  title: "COCREATE — Brands and creators, in sync",
  description:
    "A collaborative workspace for creator campaigns. Discover opportunities, manage briefs, review content and track rewards in one place.",
};

const workflow = [
  {
    number: "01",
    title: "Publish the opportunity",
    description:
      "Brands turn an idea into a clear campaign brief with deliverables, rewards and timelines creators can actually understand.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Find the right fit",
    description:
      "Creators discover relevant campaigns, send a pitch and move into a shared workflow once selected.",
    icon: Users,
  },
  {
    number: "03",
    title: "Create without chaos",
    description:
      "Submissions, feedback and revisions stay connected to the campaign instead of disappearing across chats and spreadsheets.",
    icon: Layers3,
  },
  {
    number: "04",
    title: "Approve. Reward. Move.",
    description:
      "Once the work is approved, creators can track earnings and brands can see exactly where every collaboration stands.",
    icon: Wallet,
  },
];

const creatorPoints = [
  "Discover campaigns worth applying to",
  "Know deliverables before you create",
  "Keep feedback attached to your work",
  "Track approvals, earnings and withdrawals",
];

const brandPoints = [
  "Launch structured campaign briefs",
  "Review creator applications in one place",
  "Manage submissions and revisions clearly",
  "See campaign progress without spreadsheets",
];

function Logo({ inverted = false }) {
  return (
    <Link href="/" className={styles.logo}>
      <BrandLogo variant={inverted ? "inverted" : "standard"} />
    </Link>
  );
}

function ArrowLink({ href, children, light = false }) {
  return (
    <Link
      href={href}
      className={`${styles.arrowLink} ${light ? styles.arrowLinkLight : ""}`}
    >
      {children}

      <span>
        <ArrowUpRight size={16} />
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <Logo />

          <nav className={styles.desktopNav}>
            <a href="#platform">Platform</a>
            <a href="#workflow">How it works</a>
            <a href="#creators">Creators</a>
            <a href="#brands">Brands</a>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginLink}>
              Log in
            </Link>

            <Link href="/register" className={styles.navCta}>
              Get started
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}

        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroLabel}>
                <span className={styles.liveDot} />
                BUILT FOR CREATOR COLLABORATION
              </div>

              <h1>
                Better work
                <br />
                happens when
                <br />
                <span>everyone is in sync.</span>
              </h1>

              <div className={styles.heroBottom}>
                <p>
                  COCREATE gives brands and creators one shared place to
                  discover, collaborate, review and move great work forward.
                </p>

                <div className={styles.heroActions}>
                  <Link href="/register" className={styles.primaryButton}>
                    Start creating
                    <ArrowUpRight size={18} />
                  </Link>

                  <a href="#workflow" className={styles.textButton}>
                    See how it works
                    <MoveRight size={18} />
                  </a>
                </div>
              </div>
            </div>

            <div
              className={styles.heroVisual}
              aria-label="COCREATE campaign workspace preview"
            >
              <div className={styles.visualGrid} />

              <div className={styles.visualTop}>
                <span>COCREATE / LIVE WORKSPACE</span>
                <span>24 — 10 — 27</span>
              </div>

              <div className={styles.campaignWindow}>
                <div className={styles.windowHeader}>
                  <div>
                    <p>CAMPAIGN / 0042</p>
                    <h2>Make everyday sound better.</h2>
                  </div>

                  <span className={styles.livePill}>
                    <span />
                    LIVE
                  </span>
                </div>

                <div className={styles.windowMeta}>
                  <div>
                    <span>BRAND</span>
                    <strong>Auralab</strong>
                  </div>

                  <div>
                    <span>FORMAT</span>
                    <strong>Reel + Stories</strong>
                  </div>

                  <div>
                    <span>REWARD</span>
                    <strong>₹4,500</strong>
                  </div>
                </div>

                <div className={styles.creativePanel}>
                  <div className={styles.creativeCopy}>
                    <span>CREATIVE DIRECTION</span>

                    <h3>
                      Less noise.
                      <br />
                      More life.
                    </h3>

                    <p>
                      Show how better sound fits naturally into a creator&apos;s
                      everyday rhythm.
                    </p>
                  </div>

                  <div className={styles.orbit}>
                    <div className={styles.orbitOuter}>
                      <div className={styles.orbitInner}>
                        <Zap size={31} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.timeline}>
                  <div className={styles.timelineItem}>
                    <span className={styles.timelineDone}>
                      <Check size={13} />
                    </span>

                    <div>
                      <small>01</small>
                      <strong>Brief</strong>
                    </div>
                  </div>

                  <div className={styles.timelineLine} />

                  <div className={styles.timelineItem}>
                    <span className={styles.timelineActive}>02</span>

                    <div>
                      <small>NOW</small>
                      <strong>Create</strong>
                    </div>
                  </div>

                  <div className={styles.timelineLine} />

                  <div className={styles.timelineItem}>
                    <span>03</span>

                    <div>
                      <small>NEXT</small>
                      <strong>Review</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.floatingApproval}>
                <span className={styles.approvalIcon}>
                  <CircleCheck size={18} />
                </span>

                <div>
                  <small>SUBMISSION STATUS</small>
                  <strong>Approved for reward</strong>
                </div>

                <ArrowUpRight size={17} />
              </div>

              <div className={styles.floatingPeople}>
                <div className={styles.people}>
                  <span>A</span>
                  <span>M</span>
                  <span>J</span>
                </div>

                <div>
                  <small>CREATORS</small>
                  <strong>3 selected</strong>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.heroTicker}>
            <span>DISCOVER</span>
            <i />
            <span>CONNECT</span>
            <i />
            <span>CREATE</span>
            <i />
            <span>REVIEW</span>
            <i />
            <span>REWARD</span>
            <i />
            <span>REPEAT</span>
          </div>
        </section>

        {/* PLATFORM STATEMENT */}

        <section id="platform" className={styles.statement}>
          <div className={styles.statementIndex}>
            <span>01</span>
            <span>WHY COCREATE</span>
          </div>

          <div className={styles.statementContent}>
            <p className={styles.statementSmall}>THE OLD WAY</p>

            <h2>
              Creator campaigns shouldn&apos;t live across
              <span> 12 tabs, 4 chats and a spreadsheet.</span>
            </h2>

            <div className={styles.statementFooter}>
              <p>
                COCREATE brings the operational side of collaboration into one
                clear workflow — without getting in the way of the creative work
                itself.
              </p>

              <ArrowLink href="/register">Enter the workspace</ArrowLink>
            </div>
          </div>
        </section>

        {/* BENTO */}

        <section className={styles.bentoSection}>
          <div className={styles.bentoGrid}>
            <article className={styles.bentoLarge}>
              <span className={styles.cardNumber}>A / DISCOVER</span>

              <div className={styles.discoveryVisual}>
                <div className={styles.discoveryCard}>
                  <div className={styles.discoveryTop}>
                    <span>NEW OPPORTUNITY</span>

                    <Sparkles size={16} />
                  </div>

                  <h3>
                    Streetwear launch
                    <br />
                    for a new generation.
                  </h3>

                  <div className={styles.discoveryTags}>
                    <span>INSTAGRAM</span>
                    <span>REEL</span>
                    <span>₹3,000</span>
                  </div>
                </div>

                <div className={styles.discoveryShadow}>
                  <span>Beauty / Short-form</span>
                </div>

                <div className={styles.discoveryShadowTwo}>
                  <span>Tech / Lifestyle</span>
                </div>
              </div>

              <div className={styles.bentoText}>
                <h3>
                  Opportunities,
                  <br />
                  not noise.
                </h3>

                <p>
                  Creators browse active campaigns with the brief, reward and
                  deliverables visible from the beginning.
                </p>
              </div>
            </article>

            <article className={styles.bentoDark}>
              <span className={styles.cardNumber}>B / WORKFLOW</span>

              <div className={styles.workflowMini}>
                <div>
                  <span>01</span>
                  <strong>Application</strong>
                  <CircleCheck size={16} />
                </div>

                <div>
                  <span>02</span>
                  <strong>Accepted</strong>
                  <CircleCheck size={16} />
                </div>

                <div className={styles.workflowMiniActive}>
                  <span>03</span>
                  <strong>Submission</strong>
                  <Sparkles size={16} />
                </div>

                <div>
                  <span>04</span>
                  <strong>Reward</strong>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className={styles.bentoText}>
                <h3>
                  One campaign.
                  <br />
                  One source of truth.
                </h3>

                <p>
                  Every important stage stays connected instead of being buried
                  inside messages.
                </p>
              </div>
            </article>

            <article className={styles.bentoAccent}>
              <span className={styles.cardNumber}>C / FEEDBACK</span>

              <MessageSquareText className={styles.bigIcon} strokeWidth={1.2} />

              <div className={styles.commentBubble}>
                <small>BRAND FEEDBACK</small>
                <p>
                  Great direction — can we make the opening three seconds feel
                  more energetic?
                </p>
              </div>

              <div className={styles.bentoText}>
                <h3>Feedback with context.</h3>

                <p>
                  Revision requests stay attached to the exact submission they
                  belong to.
                </p>
              </div>
            </article>

            <article className={styles.bentoReward}>
              <span className={styles.cardNumber}>D / REWARDS</span>

              <div className={styles.rewardFigure}>
                <span>AVAILABLE</span>
                <strong>₹12,450</strong>

                <div className={styles.rewardLine}>
                  <span />
                </div>

                <small>CAMPAIGN REWARDS / TRACKED</small>
              </div>

              <div className={styles.bentoText}>
                <h3>
                  Work approved.
                  <br />
                  Progress visible.
                </h3>

                <p>
                  Creators can follow approved rewards and withdrawals from one
                  wallet view.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* WORKFLOW */}

        <section id="workflow" className={styles.workflowSection}>
          <div className={styles.sectionTop}>
            <div>
              <span>02 / THE FLOW</span>
            </div>

            <h2>
              From idea
              <br />
              to approved.
            </h2>

            <p>
              Four stages. One shared workflow. Everyone knows what&apos;s
              happening, what&apos;s next and what needs attention.
            </p>
          </div>

          <div className={styles.workflowRows}>
            {workflow.map(({ number, title, description, icon: Icon }) => (
              <article key={number}>
                <span className={styles.workflowNumber}>{number}</span>

                <div className={styles.workflowIcon}>
                  <Icon size={22} />
                </div>

                <h3>{title}</h3>

                <p>{description}</p>

                <ArrowUpRight size={19} className={styles.workflowArrow} />
              </article>
            ))}
          </div>
        </section>

        {/* CREATOR / BRAND */}

        <section className={styles.splitSection}>
          <article id="creators" className={styles.creatorSide}>
            <div className={styles.roleHead}>
              <span>03A</span>
              <span>FOR CREATORS</span>
            </div>

            <h2>
              Your ideas deserve
              <br />
              better opportunities.
            </h2>

            <p className={styles.roleIntro}>
              Spend less time chasing unclear collaborations and more time
              making work you&apos;re proud of.
            </p>

            <div className={styles.roleList}>
              {creatorPoints.map((point) => (
                <div key={point}>
                  <span>
                    <Check size={14} />
                  </span>

                  {point}
                </div>
              ))}
            </div>

            <ArrowLink href="/register">Join as a creator</ArrowLink>

            <div className={styles.creatorGraphic}>
              <span className={styles.creatorGraphicOne}>FIND</span>

              <span className={styles.creatorGraphicTwo}>YOUR</span>

              <span className={styles.creatorGraphicThree}>NEXT</span>

              <Sparkles size={46} />
            </div>
          </article>

          <article id="brands" className={styles.brandSide}>
            <div className={styles.roleHead}>
              <span>03B</span>
              <span>FOR BRANDS</span>
            </div>

            <h2>
              Better creators.
              <br />
              Less campaign chaos.
            </h2>

            <p className={styles.roleIntro}>
              Give your team a clearer way to discover creators, review work and
              manage campaign progress.
            </p>

            <div className={styles.roleList}>
              {brandPoints.map((point) => (
                <div key={point}>
                  <span>
                    <Check size={14} />
                  </span>

                  {point}
                </div>
              ))}
            </div>

            <ArrowLink href="/register" light>
              Join as a brand
            </ArrowLink>

            <div className={styles.brandGraphic}>
              <div>
                <small>ACTIVE CAMPAIGN</small>
                <strong>Autumn / 27</strong>
                <span>12 creators</span>
              </div>

              <div>
                <small>REVIEW QUEUE</small>
                <strong>04</strong>
              </div>

              <div>
                <small>APPROVED</small>
                <strong>08</strong>
              </div>
            </div>
          </article>
        </section>

        {/* PRINCIPLE */}

        <section className={styles.principle}>
          <div className={styles.principleWord}>CO</div>

          <div className={styles.principleMiddle}>
            <span>THE IDEA BEHIND THE NAME</span>

            <h2>
              Not creator.
              <br />
              Not brand.
              <br />
              <em>Co-create.</em>
            </h2>
          </div>

          <div className={styles.principleCopy}>
            <p>
              The strongest campaigns happen when creators aren&apos;t treated
              like a distribution channel and brands aren&apos;t treated like a
              brief.
            </p>

            <p>
              COCREATE is designed around the space in between — where
              direction, creativity and trust meet.
            </p>
          </div>
        </section>

        {/* CTA */}

        <section className={styles.finalCta}>
          <div className={styles.finalNoise} />

          <div className={styles.finalTop}>
            <span>READY WHEN YOU ARE</span>

            <Sparkles size={17} />
          </div>

          <div className={styles.finalContent}>
            <h2>
              Make something
              <br />
              worth sharing.
            </h2>

            <div>
              <p>Your next collaboration might be closer than you think.</p>

              <Link href="/register" className={styles.finalButton}>
                Start with COCREATE
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <Logo inverted />

          <p>
            Better campaigns happen
            <br />
            when people work together.
          </p>

          <div className={styles.footerLinks}>
            <div>
              <span>PLATFORM</span>
              <a href="#workflow">How it works</a>
              <a href="#creators">For creators</a>
              <a href="#brands">For brands</a>
            </div>

            <div>
              <span>ACCOUNT</span>
              <Link href="/login">Log in</Link>
              <Link href="/register">Register</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} COCREATE</span>

          <span>BUILT FOR BETTER COLLABORATION</span>
        </div>
      </footer>
    </div>
  );
}
