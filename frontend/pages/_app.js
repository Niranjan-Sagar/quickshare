import "../styles/styles.css";

export default function App({ Component, pageProps }) {
  return (
    <div className="shell">
      <header className="top">
        <a className="logo" href="/">Quick Share</a>
        <span className="tag">Expires after 1 hour or 1 day</span>
      </header>
      <Component {...pageProps} />
    </div>
  );
}
