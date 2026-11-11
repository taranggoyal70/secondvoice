import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Eye,
  Pause,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { RecordedDemo } from "@/components/recorded-demo";
import { Reveal } from "@/components/reveal";

export default function Home() {
  return (
    <main className="landing">
      <a href="#experience" className="skip-link">
        Skip to the recorded experience
      </a>
      <header className="site-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#experience">Experience</a>
          <a href="#how-it-works">Made for you</a>
          <a href="https://github.com/taranggoyal70/secondvoice">
            Source code <ArrowUpRight size={14} />
          </a>
        </nav>
        <Link className="button primary" href="/speak">
          Start speaking <ArrowUpRight size={17} />
        </Link>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="award-note">
            <Sparkles size={15} /> AssemblyAI Hack into Speech winner
          </div>
          <h1>
            A voice for
            <br />
            <span>what you mean.</span>
          </h1>
        </div>
        <div className="hero-aside">
          <p>
            Find the words. Speak them aloud.
            <br />
            Change your mind whenever you need.
          </p>
          <Link className="button primary hero-cta" href="/speak">
            Make yourself heard <ArrowRight size={20} />
          </Link>
          <span className="hero-footnote">
            <Check size={14} /> No account or microphone needed
          </span>
        </div>
      </section>
      <section
        className="experience-stage"
        id="experience"
        aria-label="Interactive recorded speech experience"
      >
        <RecordedDemo />
      </section>
      <div className="principle-strip">
        <p>
          Speech that follows <strong>your lead.</strong>
        </p>
        <span>
          <Volume2 size={18} /> Powered by AssemblyAI
        </span>
        <span>
          Built solo by Tarang Goyal <ArrowUpRight size={15} />
        </span>
      </div>
      <Reveal className="editorial-section">
        <section id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">THERE’S A PERSON BEHIND EVERY WORD</span>
            <h2>
              Conversations aren’t scripts.
              <br />
              <span>You can change yours.</span>
            </h2>
            <p>
              For moments when speaking takes more, SecondVoice gives you the
              time and control to say things your way.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card compose-feature">
              <div className="feature-top">
                <span className="feature-icon">
                  <Volume2 size={23} />
                </span>
                <span>01 / COMPOSE</span>
              </div>
              <h3>
                Say exactly
                <br />
                what you mean.
              </h3>
              <p>
                Write a thought or start with a familiar phrase. Nothing is
                spoken until you choose.
              </p>
              <div className="mini-composer" aria-hidden="true">
                <span>
                  I’d like a little more time
                  <span className="static-caret" />.
                </span>
                <div>
                  <span>Your words. Unchanged.</span>
                  <Volume2 size={17} />
                </div>
              </div>
            </article>
            <article className="feature-card pause-feature">
              <div className="feature-top">
                <span className="feature-icon">
                  <Pause size={23} />
                </span>
                <span>02 / TAKE CONTROL</span>
              </div>
              <h3>
                A second thought?
                <br />
                There’s room for it.
              </h3>
              <p>
                Stop playback instantly. Revise your message. Your next draft is
                always yours to edit.
              </p>
              <div className="mini-revision" aria-hidden="true">
                <span className="revision-old">
                  Let me finish that thought.
                </span>
                <ArrowRight size={16} />
                <strong>Actually, let me start again.</strong>
              </div>
            </article>
            <article className="feature-card show-feature">
              <div className="feature-top">
                <span className="feature-icon">
                  <Eye size={23} />
                </span>
                <span>03 / SHOW YOUR WORDS</span>
              </div>
              <h3>
                Sometimes,
                <br />a screen says it.
              </h3>
              <p>
                Let someone read your message in a large, focused view. No
                speech connection required.
              </p>
              <div className="mini-listener" aria-hidden="true">
                <span>A MESSAGE FOR YOU</span>
                <strong>
                  Please ask
                  <br />
                  me directly.
                </strong>
                <span>SecondVoice.</span>
              </div>
            </article>
          </div>
        </section>
      </Reveal>
      <Reveal className="everyday-section">
        <div className="everyday-copy">
          <span className="eyebrow">LESS SETUP. MORE CONVERSATION.</span>
          <h2>
            Keep your everyday
            <br />
            <span>words close.</span>
          </h2>
          <p>
            Some things shouldn’t need typing twice. Save the phrases you
            choose, make them your own, and bring them back with a tap.
          </p>
          <Link className="quiet-link" href="/speak">
            Build your phrase library <ArrowRight size={18} />
          </Link>
          <div className="everyday-checks">
            <span>
              <Check size={16} /> Larger text & high contrast
            </span>
            <span>
              <Check size={16} /> English & Spanish speech
            </span>
            <span>
              <Check size={16} /> A new draft while you speak
            </span>
          </div>
        </div>
        <div className="phrase-preview">
          <div className="phrase-preview-heading">
            <span className="feature-icon">
              <Bookmark size={21} />
            </span>
            <div>
              <strong>Your phrase library</strong>
              <span>Familiar words. Ready when you are.</span>
            </div>
          </div>
          <Link href="/speak?starter=more-time">
            <span className="phrase-letter lavender">Aa</span>
            <span>I need a little more time.</span>
            <ArrowUpRight size={20} />
          </Link>
          <Link href="/speak?starter=ask-me">
            <span className="phrase-letter peach">Aa</span>
            <span>Please ask me directly.</span>
            <ArrowUpRight size={20} />
          </Link>
          <Link href="/speak?starter=try-again">
            <span className="phrase-letter green">Aa</span>
            <span>That isn’t what I meant.</span>
            <ArrowUpRight size={20} />
          </Link>
          <p>
            <ShieldCheck size={15} /> Saved on your browser, only when you ask.
          </p>
        </div>
      </Reveal>
      <Reveal className="trust-section">
        <div className="trust-heading">
          <ShieldCheck size={28} />
          <h2>
            Your voice.
            <br />
            <span>Your call.</span>
          </h2>
        </div>
        <div>
          <p>
            Live speech sends only the message you choose to AssemblyAI. No
            microphone. No voice cloning. No automatic rewriting.
          </p>
          <p className="small-print">
            Saved phrases stay on your browser; drafts and conversation history
            disappear when you leave. SecondVoice is an assistive communication
            prototype. Live voice requires internet and has a shared demo
            allowance.
          </p>
        </div>
      </Reveal>
      <section className="closing-section">
        <span className="eyebrow">A PAUSE. STILL YOUR TURN.</span>
        <h2>
          There’s something
          <br />
          <span>only you can say.</span>
        </h2>
        <Link className="button primary" href="/speak">
          Find your words <ArrowRight size={20} />
        </Link>
        <div className="closing-wave" aria-hidden="true">
          {Array.from({ length: 19 }, (_, i) => (
            <i
              key={i}
              style={{
                height: `${Math.round(25 + Math.sin(i / 2) ** 2 * 95)}px`,
              }}
            />
          ))}
        </div>
      </section>
      <footer className="site-footer">
        <Brand />
        <span>
          Built by <a href="https://github.com/taranggoyal70">Tarang Goyal</a> ·
          Made for the person speaking.
        </span>
        <a href="https://github.com/taranggoyal70/secondvoice">
          Explore the code <ArrowUpRight size={16} />
        </a>
      </footer>
    </main>
  );
}
