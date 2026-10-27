import { useState } from "react";
import Head from "next/head";
import UploadForm from "../components/UploadForm";
import ShareBox from "../components/ShareBox";

export default function Home() {
  const [fileId, setFileId] = useState(null);

  return (
    <div className="page">
      <Head>
        <title>Quick Share</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Share a file with a link that expires" />
      </Head>
      <h1>{fileId ? "Ready to send" : "Send a file"}</h1>
      <p className="sub">
        {fileId
          ? "Copy the link and send it. It stops working when the timer runs out."
          : "Drop a file, pick how long the link should live, then share it."}
      </p>

      {fileId ? (
        <ShareBox id={fileId} onReset={() => setFileId(null)} />
      ) : (
        <UploadForm onDone={setFileId} />
      )}
    </div>
  );
}
