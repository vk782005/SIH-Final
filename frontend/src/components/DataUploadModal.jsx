import { useEffect, useRef, useState } from "react";

function DatasetUploadModal({ isOpen, onClose }) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);
    const processingTimerRef = useRef(null);

    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------

    useEffect(() => {
        return () => {
            if (processingTimerRef.current) {
                clearInterval(processingTimerRef.current);
            }
        };
    }, []);

    // ---------------------------------------------------------
    // RESET MODAL
    // ---------------------------------------------------------

    const resetModal = () => {
        if (processingTimerRef.current) {
            clearInterval(processingTimerRef.current);
            processingTimerRef.current = null;
        }

        setFile(null);
        setStatus("idle");
        setProgress(0);
        setError("");
        setIsDragging(false);
    };

    // ---------------------------------------------------------
    // CLOSE
    // ---------------------------------------------------------

    const handleClose = () => {
        if (status === "processing") {
            return;
        }

        resetModal();
        onClose();
    };

    // ---------------------------------------------------------
    // FILE VALIDATION
    // ---------------------------------------------------------

    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            return false;
        }

        const allowedExtensions = [
            ".csv",
            ".nc",
            ".nc4",
            ".grib",
            ".grb",
            ".json",
        ];

        const fileName = selectedFile.name.toLowerCase();

        const isValid = allowedExtensions.some((extension) =>
            fileName.endsWith(extension)
        );

        if (!isValid) {
            setError(
                "Unsupported file type. Please upload CSV, NetCDF, GRIB, or JSON data."
            );

            return false;
        }

        setError("");

        return true;
    };

    // ---------------------------------------------------------
    // SELECT FILE
    // ---------------------------------------------------------

    const handleFile = (selectedFile) => {
        if (!selectedFile) {
            return;
        }

        if (!validateFile(selectedFile)) {
            return;
        }

        setFile(selectedFile);
        setStatus("ready");
        setProgress(0);
        setError("");
    };

    // ---------------------------------------------------------
    // FILE INPUT
    // ---------------------------------------------------------

    const handleFileInput = (event) => {
        const selectedFile = event.target.files?.[0];

        handleFile(selectedFile);

        // Allows selecting the same file again later.
        event.target.value = "";
    };

    // ---------------------------------------------------------
    // DRAG EVENTS
    // ---------------------------------------------------------

    const handleDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (status !== "processing") {
            setIsDragging(true);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (status !== "processing") {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(false);

        if (status === "processing") {
            return;
        }

        const droppedFile = event.dataTransfer.files?.[0];

        handleFile(droppedFile);
    };

    // ---------------------------------------------------------
    // OPEN FILE PICKER
    // ---------------------------------------------------------

    const openFilePicker = () => {
        if (status === "processing") {
            return;
        }

        fileInputRef.current?.click();
    };

    // ---------------------------------------------------------
    // FORMAT FILE SIZE
    // ---------------------------------------------------------

    const formatFileSize = (bytes) => {
        if (bytes === 0) {
            return "0 Bytes";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
        ];

        const index = Math.floor(
            Math.log(bytes) / Math.log(1024)
        );

        return `${(
            bytes / Math.pow(1024, index)
        ).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    };

    // ---------------------------------------------------------
    // START PROCESSING
    // ---------------------------------------------------------

    const startProcessing = () => {
        if (!file || status === "processing") {
            return;
        }

        setStatus("processing");
        setProgress(0);
        setError("");

        let currentProgress = 0;

        processingTimerRef.current = setInterval(() => {
            currentProgress += Math.floor(
                Math.random() * 8
            ) + 3;

            if (currentProgress >= 100) {
                currentProgress = 100;

                clearInterval(processingTimerRef.current);
                processingTimerRef.current = null;

                setProgress(100);

                setTimeout(() => {
                    setStatus("complete");
                }, 500);

                return;
            }

            setProgress(currentProgress);
        }, 180);
    };

    // ---------------------------------------------------------
    // REMOVE FILE
    // ---------------------------------------------------------

    const removeFile = () => {
        if (status === "processing") {
            return;
        }

        setFile(null);
        setStatus("idle");
        setProgress(0);
        setError("");
    };

    // ---------------------------------------------------------
    // MODAL CLOSED
    // ---------------------------------------------------------

    if (!isOpen) {
        return null;
    }

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------

    return (
        <div
            className="dataset-modal-overlay"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    status !== "processing"
                ) {
                    handleClose();
                }
            }}
        >
            <div
                className="dataset-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dataset-modal-title"
            >
                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="dataset-modal-header">
                    <div>
                        <div className="dataset-modal-eyebrow">
                            OCEAN-X DATA MANAGER
                        </div>

                        <h2 id="dataset-modal-title">
                            Add New Data
                        </h2>

                        <p>
                            Import a new ocean dataset into
                            the visualization system.
                        </p>
                    </div>

                    <button
                        className="dataset-modal-close"
                        onClick={handleClose}
                        disabled={status === "processing"}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="dataset-modal-content">

                    {/* -------------------------------------------------
                        IDLE / DROP ZONE
                    ------------------------------------------------- */}

                    {!file && (
                        <>
                            <div
                                className={`dataset-drop-zone ${
                                    isDragging
                                        ? "is-dragging"
                                        : ""
                                }`}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={openFilePicker}
                            >
                                <div className="dataset-upload-icon">
                                    ↑
                                </div>

                                <h3>
                                    {isDragging
                                        ? "Drop your dataset here"
                                        : "Drop your dataset here"}
                                </h3>

                                <p>
                                    or click to browse your
                                    computer
                                </p>

                                <span>
                                    CSV · NetCDF · GRIB · JSON
                                </span>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.nc,.nc4,.grib,.grb,.json"
                                    onChange={handleFileInput}
                                    hidden
                                />
                            </div>

                            {error && (
                                <div className="dataset-error">
                                    <span>!</span>
                                    {error}
                                </div>
                            )}
                        </>
                    )}

                    {/* -------------------------------------------------
                        FILE READY
                    ------------------------------------------------- */}

                    {file && status === "ready" && (
                        <div className="dataset-file-section">

                            <div className="dataset-file-card">
                                <div className="dataset-file-icon">
                                    {file.name
                                        .split(".")
                                        .pop()
                                        .toUpperCase()}
                                </div>

                                <div className="dataset-file-info">
                                    <strong>
                                        {file.name}
                                    </strong>

                                    <span>
                                        {formatFileSize(
                                            file.size
                                        )}
                                    </span>
                                </div>

                                <button
                                    className="dataset-remove-button"
                                    onClick={removeFile}
                                    aria-label="Remove file"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="dataset-ready-message">
                                <span className="dataset-success-dot"></span>

                                Dataset ready for processing
                            </div>

                            <button
                                className="dataset-process-button"
                                onClick={startProcessing}
                            >
                                <span>
                                    Process Dataset
                                </span>

                                <span className="dataset-button-arrow">
                                    →
                                </span>
                            </button>
                        </div>
                    )}

                    {/* -------------------------------------------------
                        PROCESSING
                    ------------------------------------------------- */}

                    {file && status === "processing" && (
                        <div className="dataset-processing">

                            <div className="dataset-processing-orbit">
                                <div className="dataset-processing-ring"></div>

                                <div className="dataset-processing-core">
                                    <span>
                                        {progress}%
                                    </span>
                                </div>
                            </div>

                            <h3>
                                Processing dataset
                            </h3>

                            <p>
                                Preparing your ocean data...
                            </p>

                            <div className="dataset-progress-container">
                                <div className="dataset-progress-track">
                                    <div
                                        className="dataset-progress-bar"
                                        style={{
                                            width: `${progress}%`,
                                        }}
                                    ></div>
                                </div>

                                <span>
                                    {progress}%
                                </span>
                            </div>

                            <div className="dataset-processing-steps">

                                <div
                                    className={
                                        progress >= 20
                                            ? "completed"
                                            : "active"
                                    }
                                >
                                    <span className="step-indicator">
                                        {progress >= 20
                                            ? "✓"
                                            : "1"}
                                    </span>

                                    Reading dataset
                                </div>

                                <div
                                    className={
                                        progress >= 50
                                            ? "completed"
                                            : progress >= 20
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <span className="step-indicator">
                                        {progress >= 50
                                            ? "✓"
                                            : "2"}
                                    </span>

                                    Detecting variables
                                </div>

                                <div
                                    className={
                                        progress >= 80
                                            ? "completed"
                                            : progress >= 50
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <span className="step-indicator">
                                        {progress >= 80
                                            ? "✓"
                                            : "3"}
                                    </span>

                                    Preparing data
                                </div>

                                <div
                                    className={
                                        progress >= 100
                                            ? "completed"
                                            : progress >= 80
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <span className="step-indicator">
                                        {progress >= 100
                                            ? "✓"
                                            : "4"}
                                    </span>

                                    Finalizing
                                </div>

                            </div>
                        </div>
                    )}

                    {/* -------------------------------------------------
                        COMPLETE
                    ------------------------------------------------- */}

                    {file && status === "complete" && (
                        <div className="dataset-complete">

                            <div className="dataset-complete-icon">
                                ✓
                            </div>

                            <h3>
                                Dataset processed
                            </h3>

                            <p>
                                <strong>
                                    {file.name}
                                </strong>
                                {" "}is ready to be added to
                                the ocean visualization.
                            </p>

                            <div className="dataset-complete-info">

                                <div>
                                    <span>
                                        FILE
                                    </span>

                                    <strong>
                                        {file.name}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        SIZE
                                    </span>

                                    <strong>
                                        {formatFileSize(
                                            file.size
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        STATUS
                                    </span>

                                    <strong>
                                        READY
                                    </strong>
                                </div>

                            </div>

                            <button
                                className="dataset-done-button"
                                onClick={handleClose}
                            >
                                Done
                                <span>→</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="dataset-modal-footer">
                    <span>
                        DATA IMPORT
                    </span>

                    <span>
                        LOCAL FILE
                    </span>

                    <span>
                        OCEAN-X
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DatasetUploadModal;