import { login, signup } from "./actions";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const message = typeof params.message === "string" ? params.message : null;

  return (
    <main className="authShell">
      <section className="authBrandPanel">
        <div className="authLogo"><span className="authLogoMark">◎</span>SalesRadar <b>AI</b></div>
        <div className="authHeroCopy">
          <span className="authEyebrow">BUYER INTENT FOR LOCAL SERVICE BUSINESSES</span>
          <h1>Be first when a customer starts looking.</h1>
          <p>SalesRadar turns high-intent public signals, inbound leads and market demand into one prioritized sales workflow.</p>
          <div className="authProofGrid">
            <div><strong>0–100</strong><span>Intent scoring</span></div>
            <div><strong>&lt;2 min</strong><span>Response target</span></div>
            <div><strong>24/7</strong><span>Signal monitoring</span></div>
          </div>
        </div>
        <p className="authFinePrint">Built for auto glass, roofing, HVAC, plumbing and other local service teams.</p>
      </section>

      <section className="authFormPanel">
        <div className="authFormWrap">
          <span className="authEyebrow">SECURE WORKSPACE</span>
          <h2>Sign in to SalesRadar</h2>
          <p className="authSubtitle">Use your business account to open the lead command center.</p>

          {error && <div className="authAlert error">{error}</div>}
          {message && <div className="authAlert success">{message}</div>}

          <form className="authForm">
            <label>Full name <input name="fullName" autoComplete="name" placeholder="Angel Saenz" /></label>
            <label>Email <input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
            <label>Password <input name="password" type="password" autoComplete="current-password" placeholder="8+ characters" minLength={8} required /></label>
            <button className="authPrimary" formAction={login}>Sign in</button>
            <button className="authSecondary" formAction={signup}>Create business account</button>
          </form>

          <div className="authSecurity"><span>✓</span><p><b>Protected by Supabase Auth + Row Level Security.</b><br />Each business only sees its own leads, rules and territory.</p></div>
        </div>
      </section>
    </main>
  );
}
