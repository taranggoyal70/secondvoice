import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  MessageSquare,
  MoveUpRight,
  Square,
  Volume2,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { RecordedDemo } from "@/components/recorded-demo";

export default function Home() {
  return (
    <main className="landing">
      <a href="#experience" className="skip-link">
        Skip to the recorded experience
      </a>
      <header className="site-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#experience">The experience</a>
          <a href="#how-it-works">How it works</a>
          <a href="https://github.com/taranggoyal70/secondvoice">
            GitHub <ArrowUpRight size={13} />
          </a>
        </nav>
        <Link className="button primary small" href="/speak">
          Open SecondVoice <ArrowUpRight size={15} />
        </Link>
      </header>
      <section className="hero" id="experience">
        <div className="hero-copy">
          <div className="award-note">
            <span className="award-star">✳</span> Winner · AssemblyAI Hack into
            Speech
          </div>
          <h1>
            A pause.
            <br />
            <em>Still your turn.</em>
          </h1>
          <p className="hero-description">
            When speaking takes more, your words deserve the same space. Type a
            thought. Speak it aloud. Change your mind.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/speak">
              Say it your way <ArrowRight size={18} />
            </Link>
            <a className="quiet-link" href="#how-it-works">
              Take a closer look <span>↓</span>
            </a>
          </div>
          <p className="hero-footnote">
            No account. No microphone. You choose every word.
          </p>
        </div>
        <div className="hero-demo">
          <div className="margin-note">a little room to be heard ↘</div>
          <RecordedDemo />
        </div>
      </section>
      <div className="principle-strip">
        <span>YOUR WORDS</span>
        <i />
        <span>YOUR PACE</span>
        <i />
        <span>YOUR NEXT THOUGHT</span>
        <span className="strip-credit">Speech by AssemblyAI</span>
      </div>
      <section className="editorial-section" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">01 / A CONVERSATION, NOT A SCRIPT</span>
          <h2>
            You don’t have to
            <br />
            get it right <em>the first time.</em>
          </h2>
          <p>
            A pause isn’t the end of a thought. SecondVoice makes space for the
            person behind the words.
          </p>
        </div>
        <div className="feature-rows">
          <article>
            <span className="feature-number">01</span>
            <div className="feature-icon">
              <Volume2 size={24} />
            </div>
            <div>
              <h3>Find the words. Then press speak.</h3>
              <p>
                Write freely, use a starter phrase, or bring back one you saved.
                Nothing is spoken until you choose.
              </p>
            </div>
            <ArrowUpRight className="feature-arrow" size={20} />
          </article>
          <article>
            <span className="feature-number">02</span>
            <div className="feature-icon">
              <Square size={18} />
            </div>
            <div>
              <h3>Stop means stop.</h3>
              <p>
                Cut playback with one button or Escape. Your draft stays right
                where you left it, ready for a second thought.
              </p>
            </div>
            <ArrowUpRight className="feature-arrow" size={20} />
          </article>
          <article>
            <span className="feature-number">03</span>
            <div className="feature-icon">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3>There’s more than one way to be heard.</h3>
              <p>
                Open a large, readable message for the person beside you.
                Showing text doesn’t need a voice connection.
              </p>
            </div>
            <ArrowUpRight className="feature-arrow" size={20} />
          </article>
        </div>
      </section>
      <section className="everyday-section">
        <div className="everyday-copy">
          <span className="eyebrow">02 / LESS SETUP. MORE CONVERSATION.</span>
          <h2>
            For the things
            <br />
            you say <em>every day.</em>
          </h2>
          <p>
            Keep useful phrases close. Prepare your next message while the
            current one plays. Use a larger type size or stronger contrast when
            that feels better.
          </p>
          <Link className="quiet-link" href="/speak">
            Make some space for your words <ArrowRight size={17} />
          </Link>
        </div>
        <div className="phrase-preview">
          <div>
            <Bookmark size={18} />
            <span>YOUR WORDS, CLOSE BY</span>
            <span>↗</span>
          </div>
          <Link href="/speak?starter=more-time">
            I need a little more time.
            <ArrowUpRight size={18} />
          </Link>
          <Link href="/speak?starter=ask-me">
            Please ask me directly.
            <ArrowUpRight size={18} />
          </Link>
          <Link href="/speak?starter=try-again">
            That isn’t what I meant.
            <ArrowUpRight size={18} />
          </Link>
          <p>
            Save the phrases you choose on this browser.
            <br />
            Your conversation isn’t saved after a reload.
          </p>
        </div>
      </section>
      <section className="trust-section">
        <span className="eyebrow">03 / BUILT AROUND YOUR CONTROL</span>
        <div>
          <h3>Your words stay yours.</h3>
          <p>
            Live speech sends only the message you choose to AssemblyAI for
            synthesis. No microphone, voice cloning, or automatic rewriting.
            Saved phrases stay on your browser; you can remove them any time.
          </p>
          <p className="small-print">
            SecondVoice is an assistive communication prototype, not a
            clinically validated communication aid. Live speech requires
            internet and has a shared demo allowance. The text-only view works
            without synthesis.
          </p>
        </div>
      </section>
      <section className="closing-section">
        <span className="eyebrow">
          A LITTLE MORE TIME. A VOICE OF YOUR OWN.
        </span>
        <h2>
          What would you
          <br />
          like to <em>say?</em>
        </h2>
        <Link
          className="round-link"
          href="/speak"
          aria-label="Open SecondVoice speaking workspace"
        >
          <MoveUpRight size={38} />
        </Link>
      </section>
      <footer className="site-footer">
        <Brand />
        <span>
          Built solo by{" "}
          <a href="https://github.com/taranggoyal70">Tarang Goyal</a>.
        </span>
        <a href="https://github.com/taranggoyal70/secondvoice">
          Explore the code <ArrowUpRight size={14} />
        </a>
      </footer>
    </main>
  );
}
