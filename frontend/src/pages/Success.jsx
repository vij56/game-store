import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Success.css";

const loremDescription = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eu tincidunt nunc. Duis consequat nibh at augue varius, sit amet gravida sem vulputate. Donec ac ligula a odio feugiat molestie. Sed tristique, erat vel volutpat ullamcorper, dolor est fermentum purus, ut posuere lorem velit et sapien.

Mauris in augue eget lectus volutpat tincidunt. Proin elementum ultrices diam, ut egestas nibh suscipit vitae. Vivamus aliquet mauris vel justo luctus, ut faucibus sem pulvinar. Nunc vitae dignissim massa. Morbi vitae vestibulum lacus. Quisque non tristique lorem.

Aliquam erat volutpat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; In sit amet magna at metus feugiat malesuada. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`;

export default function Success() {
  const navigate = useNavigate();

  const instructionText = useMemo(
    () => `
THANK YOU FOR YOUR PURCHASE!

INSTALLATION GUIDE:
1. Open your game library in this account.
2. Download your purchased game files.
3. Extract the archive using WinRAR or 7zip.
4. Run setup.exe as administrator.
5. Follow on-screen instructions to complete installation.

NOTE:
- Keep this file for future reference.
- Contact support if your download link does not work.

Enjoy your game!`,
    [],
  );

  const handleDownload = () => {
    const blob = new Blob([instructionText], { type: "text/plain" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "Purchase_Instructions.txt";
    link.click();

    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="success-page">
      <section className="success-hero">
        <p className="success-kicker">PAYMENT CONFIRMED</p>
        <h1>Purchase successful. You are all set.</h1>
        <p className="success-subtitle">
          Your order is confirmed and ready. Download the instructions file now
          and keep it saved for later.
        </p>

        <div className="success-actions">
          <button className="btn" onClick={handleDownload}>
            Download
          </button>
          <button
            className="btn secondary"
            onClick={() => navigate("/library")}
          >
            Go To Library
          </button>
        </div>
      </section>

      <section className="success-description card">
        <h2>Description</h2>
        <p>{loremDescription}</p>
      </section>
    </div>
  );
}
