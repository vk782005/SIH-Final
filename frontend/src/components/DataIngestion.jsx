import { useRef, useState } from "react";
import "./DataIngestion.css";

function DataIngestion({ onBack }) {
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [validated, setValidated] = useState(false);

    const [contributorId, setContributorId] = useState("");
    const [datasetType, setDatasetType] = useState("Sensor Data");
    const [source, setSource] = useState("");
    const [description, setDescription] = useState("");

    const handleFile = (selectedFile) => {
        if (!selectedFile) return;

        const validExtensions = [".csv", ".nc", ".nc4"];
        const fileName = selectedFile.name.toLowerCase();

        const valid = validExtensions.some((extension) =>
            fileName.endsWith(extension),
        );

        if (!valid) {
            alert("Please select a CSV, NetCDF, or NetCDF4 file.");
            return;
        }

        setFile(selectedFile);
        setValidated(false);
    };

    const handleFileInput = (event) => {
        handleFile(event.target.files?.[0]);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);

        const droppedFile = event.dataTransfer.files?.[0];
        handleFile(droppedFile);
    };

    const handleValidate = () => {
        if (!contributorId.trim()) {
            alert("Please enter a Contributor ID.");
            return;
        }

        if (!file) {
            alert("Please select a dataset first.");
            return;
        }

        setValidated(true);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";

        const units = ["Bytes", "KB", "MB", "GB"];
        const index = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
    };

    return (
        <div className="data-ingestion-page">
            {/* Top bar */}
            <div className="data-ingestion-topbar">
                <button className="data-back-button" onClick={onBack}>
                    ← Back to Explorer
                </button>

                <div className="data-page-title">
                    <div className="data-page-title-main">OCEAN-X</div>

                    <div className="data-page-title-sub">
                        DATA CONTRIBUTION PORTAL
                    </div>
                </div>

                <div className="data-security-status">
                    <span className="security-dot"></span>
                    AUTHORIZED ACCESS
                </div>
            </div>

            {/* Main content */}
            <div className="data-ingestion-content">
                <div className="data-ingestion-heading">
                    <div className="data-heading-eyebrow">
                        SCIENTIFIC DATA INGESTION
                    </div>

                    <h1>Add Sensor Data</h1>

                    <p>
                        Contribute ocean observations and scientific datasets to
                        the OCEAN-X visualization platform.
                    </p>
                </div>

                <div className="data-ingestion-grid">
                    {/* LEFT COLUMN */}
                    <div className="data-left-column">
                        {/* Contributor */}
                        <div className="data-card">
                            <div className="data-card-header">
                                <div>
                                    <div className="data-card-label">
                                        ACCESS VERIFICATION
                                    </div>

                                    <h2>Authorized Contributor</h2>
                                </div>

                                <div className="data-card-icon">◉</div>
                            </div>

                            <div className="data-field">
                                <label>Contributor ID</label>

                                <div className="admin-verification-row">
                                    <input
                                        type="text"
                                        placeholder="e.g. OCN-ADM-001"
                                        value={contributorId}
                                        onChange={(event) =>
                                            setContributorId(event.target.value)
                                        }
                                    />

                                    <button
                                        type="button"
                                        className="verify-admin-button"
                                        onClick={() => {
                                            if (!contributorId.trim()) {
                                                alert(
                                                    "Please enter a Contributor ID.",
                                                );
                                                return;
                                            }

                                            alert(
                                                "Admin verified successfully.",
                                            );
                                        }}
                                    >
                                        <span>✓</span>
                                        Verify Admin
                                    </button>
                                </div>
                            </div>

                            <div className="data-verification-info">
                                <span>●</span>
                                Contributor credentials will be verified before
                                dataset publication.
                            </div>
                        </div>

                        {/* Dataset */}
                        <div className="data-card">
                            <div className="data-card-header">
                                <div>
                                    <div className="data-card-label">
                                        DATASET
                                    </div>

                                    <h2>Upload Scientific Data</h2>
                                </div>

                                <div className="data-card-icon">↑</div>
                            </div>

                            {!file ? (
                                <div
                                    className={`data-dropzone ${
                                        dragging ? "dragging" : ""
                                    }`}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => {
                                        setDragging(false);
                                    }}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <div className="data-upload-symbol">↑</div>

                                    <div className="data-upload-title">
                                        Drop dataset here
                                    </div>

                                    <div className="data-upload-subtitle">
                                        or click to browse files
                                    </div>

                                    <div className="data-supported-formats">
                                        CSV&nbsp;&nbsp;•&nbsp;&nbsp;NETCDF&nbsp;&nbsp;•&nbsp;&nbsp;NETCDF4
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.nc,.nc4"
                                        hidden
                                        onChange={handleFileInput}
                                    />
                                </div>
                            ) : (
                                <div className="data-file-selected">
                                    <div className="data-file-icon">
                                        {file.name
                                            .toLowerCase()
                                            .endsWith(".csv")
                                            ? "CSV"
                                            : "NC"}
                                    </div>

                                    <div className="data-file-details">
                                        <div className="data-file-name">
                                            {file.name}
                                        </div>

                                        <div className="data-file-meta">
                                            {formatFileSize(file.size)}
                                            &nbsp; • &nbsp; Dataset selected
                                        </div>
                                    </div>

                                    <button
                                        className="data-remove-file"
                                        onClick={() => {
                                            setFile(null);
                                            setValidated(false);
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="data-card">
                            <div className="data-card-label">
                                DATASET INFORMATION
                            </div>

                            <h2>Metadata</h2>

                            <div className="data-form-grid">
                                <div className="data-field">
                                    <label>Dataset Type</label>

                                    <select
                                        value={datasetType}
                                        onChange={(event) =>
                                            setDatasetType(event.target.value)
                                        }
                                    >
                                        <option>Sensor Data</option>

                                        <option>Model Output</option>

                                        <option>Bathymetry</option>

                                        <option>Other</option>
                                    </select>
                                </div>

                                <div className="data-field">
                                    <label>Data Source</label>

                                    <input
                                        type="text"
                                        placeholder="Organization / Institution"
                                        value={source}
                                        onChange={(event) =>
                                            setSource(event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="data-field">
                                <label>Description</label>

                                <textarea
                                    placeholder="Briefly describe the dataset..."
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="data-right-column">
                        {/* Status */}
                        <div className="data-status-card">
                            <div className="data-status-header">
                                <div>
                                    <div className="data-card-label">
                                        INGESTION STATUS
                                    </div>

                                    <h2>Dataset Validation</h2>
                                </div>

                                <div className="data-status-badge">
                                    {validated ? "VALID" : "READY"}
                                </div>
                            </div>

                            {!validated ? (
                                <>
                                    <div className="data-check-list">
                                        <div>
                                            <span>○</span>
                                            File format
                                        </div>

                                        <div>
                                            <span>○</span>
                                            Coordinate fields
                                        </div>

                                        <div>
                                            <span>○</span>
                                            Time dimension
                                        </div>

                                        <div>
                                            <span>○</span>
                                            Ocean variables
                                        </div>
                                    </div>

                                    <button
                                        className="data-primary-button"
                                        onClick={handleValidate}
                                    >
                                        Validate Dataset
                                        <span>→</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="data-success-message">
                                        <div className="data-success-icon">
                                            ✓
                                        </div>

                                        <div>
                                            <strong>
                                                Dataset passed validation
                                            </strong>

                                            <p>
                                                The dataset is ready for preview
                                                and publication.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="data-preview-stats">
                                        <div>
                                            <span>FORMAT</span>
                                            <strong>
                                                {file?.name
                                                    .split(".")
                                                    .pop()
                                                    .toUpperCase()}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>SIZE</span>
                                            <strong>
                                                {file &&
                                                    formatFileSize(file.size)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>TYPE</span>
                                            <strong>{datasetType}</strong>
                                        </div>
                                    </div>

                                    <button className="data-primary-button">
                                        Preview Dataset
                                        <span>→</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Pipeline */}
                        <div className="data-pipeline-card">
                            <div className="data-card-label">DATA PIPELINE</div>

                            <h2>Contribution Workflow</h2>

                            <div className="data-pipeline">
                                <div className="pipeline-step active">
                                    <div className="pipeline-number">01</div>

                                    <div>
                                        <strong>Authorization</strong>

                                        <span>Verify contributor</span>
                                    </div>
                                </div>

                                <div className="pipeline-line"></div>

                                <div
                                    className={`pipeline-step ${
                                        file ? "active" : ""
                                    }`}
                                >
                                    <div className="pipeline-number">02</div>

                                    <div>
                                        <strong>Upload</strong>

                                        <span>Select dataset</span>
                                    </div>
                                </div>

                                <div className="pipeline-line"></div>

                                <div
                                    className={`pipeline-step ${
                                        validated ? "active" : ""
                                    }`}
                                >
                                    <div className="pipeline-number">03</div>

                                    <div>
                                        <strong>Validation</strong>

                                        <span>Check data integrity</span>
                                    </div>
                                </div>

                                <div className="pipeline-line"></div>

                                <div className="pipeline-step">
                                    <div className="pipeline-number">04</div>

                                    <div>
                                        <strong>Publish</strong>

                                        <span>Add to OCEAN-X</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="data-info-card">
                            <div className="data-info-icon">i</div>

                            <div>
                                <strong>Supported scientific data</strong>

                                <p>
                                    OCEAN-X is designed to integrate
                                    observations from sensors, research
                                    platforms and numerical ocean models.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DataIngestion;
