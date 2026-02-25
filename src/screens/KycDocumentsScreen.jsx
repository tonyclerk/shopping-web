import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OnboardingFlow.css";

const INITIAL_DOCUMENTS = {
  "PAN Card": null,
  "GST Certificate": null,
  "ID Proof": null,
  "Cancelled Cheque": null,
};

function KycDocumentsScreen() {
  const navigate = useNavigate();
  const [uploadedDocuments, setUploadedDocuments] = useState(INITIAL_DOCUMENTS);
  const progress = useMemo(() => 100, []);

  const uploadDocument = (documentName) => {
    setUploadedDocuments((prev) => ({ ...prev, [documentName]: "uploaded_file.pdf" }));
    window.alert(`${documentName} uploaded (Demo Mode)`);
  };

  return (
    <main className="flow-page">
      <section className="flow-wrap">
        <header className="flow-header">
          <div className="flow-header-icon">
            <img src="/icons/store.svg" alt="" />
          </div>
          <div>
            <h1>Vendor Onboarding</h1>
            <p>Complete your profile to start selling</p>
          </div>
        </header>

        <div className="flow-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="flow-steps">
          <span className="active">Business Info</span>
          <span className="active">Categories</span>
          <span className="active">KYC Documents</span>
        </div>

        <section className="flow-card">
          <div className="flow-card-head">
            <h2>KYC Documents</h2>
            <p>Upload required documents for verification</p>
          </div>

          <div className="flow-card-body">
            {Object.keys(uploadedDocuments).map((documentName) => (
              <article key={documentName} className="doc-row">
                <div>
                  <h3>{documentName}</h3>
                  <p>PDF, JPG, or PNG (Max 5MB)</p>
                </div>
                <button type="button" onClick={() => uploadDocument(documentName)}>
                  {uploadedDocuments[documentName] ? "Uploaded" : "Upload"}
                </button>
              </article>
            ))}

            <div className="flow-info">
              <strong>Demo Mode:</strong> Document upload is simulated. Click Submit to complete onboarding.
            </div>

            <button type="button" className="flow-submit" onClick={() => navigate("/approval-pending", { replace: true })}>
              Submit for Approval
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default KycDocumentsScreen;
