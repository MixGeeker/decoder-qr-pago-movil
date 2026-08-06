import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { decodeQr } from "decoder-qr-pago-movil";
import GenerateQrTab from "./GenerateQrTab";
import "./App.css";

type Status = "idle" | "scanning" | "success" | "error";
type Tab = "decode" | "generate";

function App() {
  const [tab, setTab] = useState<Tab>("decode");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [payloadText, setPayloadText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredPrompt = useRef<any>(null);
  const [installable, setInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === "accepted") {
        setInstallable(false);
      }
      deferredPrompt.current = null;
    } else {
      alert(
        "Para instalar la app:\n\n" +
          "• Chrome/Edge: menú ⋮ > Instalar aplicación\n" +
          "• Safari/iOS: menú Compartir > Añadir a pantalla de inicio\n" +
          "• Firefox: barra de dirección > icono de instalar",
      );
    }
  };

  const decodePayload = useCallback((text: string) => {
    setRaw(text);
    setStatus("scanning");
    setResult(null);
    setError(null);
    try {
      const decoded = decodeQr(text.trim());
      setResult(decoded);
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setError(`Error al decodificar: ${e.message}`);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setError("El archivo seleccionado no es una imagen.");
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStatus("scanning");
    setResult(null);
    setError(null);
    setRaw(null);

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h);

      if (!code) {
        setStatus("error");
        setError(
          "No se detectó ningún código QR en la imagen. Asegúrate de que el QR sea visible y tenga buena iluminación.",
        );
        return;
      }

      setRaw(code.data);
      try {
        const decoded = decodeQr(code.data);
        setResult(decoded);
        setStatus("success");
      } catch (e: any) {
        setStatus("error");
        setError(`Error al decodificar: ${e.message}`);
      }

      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setStatus("error");
      setError("No se pudo cargar la imagen.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const processClipboardBlob = useCallback(
    (blob: Blob) => {
      const file = new File([blob], "clipboard.png", { type: blob.type });
      processFile(file);
    },
    [processFile],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (tab !== "decode" || status !== "idle") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          processClipboardBlob(item.getAsFile()!);
          return;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [tab, status, processClipboardBlob]);

  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((t: string) =>
          t.startsWith("image/"),
        );
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          processClipboardBlob(blob);
          return;
        }
      }
      setStatus("error");
      setError("No se encontró ninguna imagen en el portapapeles.");
    } catch {
      setStatus("error");
      setError(
        "No se pudo acceder al portapapeles. Asegúrate de haber copiado una imagen y permite el acceso.",
      );
    }
  };

  const handleClick = () => inputRef.current?.click();

  const handleReset = () => {
    setImageUrl(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    setRaw(null);
    setPayloadText("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const cleanDni = (v: string) => v?.replace(/^V/i, "");
  const cleanPhone = (v: string) => v?.replace(/^58/, "0");

  const fields = result
    ? [
        { label: "DNI", value: cleanDni(result.dni) },
        { label: "Teléfono", value: cleanPhone(result.phone) },
        { label: "Banco", value: result.bank },
        { label: "Titular", value: result.name },
      ]
    : [];

  return (
    <div className="app">
      <header className="header">
        <h1>QR Pago Móvil</h1>
        <p>Decodifica y genera códigos QR de pago móvil venezolano</p>
        {!isInstalled && (
          <button className="install-btn" onClick={handleInstall} type="button">
            ⬇ Instalar app
          </button>
        )}
      </header>

      <div className="tabs">
        <button
          className={`tab${tab === "decode" ? " active" : ""}`}
          onClick={() => setTab("decode")}
        >
          Decodificar
        </button>
        <button
          className={`tab${tab === "generate" ? " active" : ""}`}
          onClick={() => setTab("generate")}
        >
          Generar QR
        </button>
      </div>

      {tab === "decode" && (
        <>
          {status === "idle" && (
            <>
              <div
                className={`dropzone${dragging ? " dragging" : ""}`}
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="dropzone-icon">⬡</div>
                <div className="dropzone-text">
                  {dragging
                    ? "Suelta la imagen aquí"
                    : "Toca para seleccionar o arrastra una imagen"}
                </div>
                <div className="dropzone-hint">
                  PNG, JPG, WebP — hasta 10 MB
                </div>
                <button
                  className="paste-clipboard-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteButton();
                  }}
                  type="button"
                >
                  📋 Pegar del portapapeles
                </button>
                <div className="dropzone-hint">También puedes presionar Ctrl+V para pegar una imagen</div>
                <input
                  ref={inputRef}
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>

              <div className="divider">O pega el payload manualmente</div>

              <div className="paste-area">
                <div className="paste-label">Payload del QR</div>
                <textarea
                  className="paste-input"
                  placeholder="Pega aquí el contenido del código QR…"
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                />
                <button
                  className="paste-button"
                  disabled={!payloadText.trim()}
                  onClick={() => decodePayload(payloadText)}
                >
                  Decodificar payload
                </button>
              </div>

              <div className="result-card" style={{ opacity: 0.5 }}>
                <div className="result-header">
                  <div className="result-header-icon">?</div>
                  <div className="result-header-title">Esperando imagen</div>
                </div>
                {["DNI", "Teléfono", "Banco", "Titular"].map((label) => (
                  <div className="result-field" key={label}>
                    <span className="result-field-label">{label}</span>
                    <span
                      className="result-field-value"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      —
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {imageUrl && status === "scanning" && (
            <div className="preview-section">
              <img src={imageUrl} alt="Preview" className="preview-image" />
              <div className="spinner">Escaneando código QR…</div>
            </div>
          )}

          {status === "error" && (
            <>
              {imageUrl && (
                <div className="preview-section">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="preview-image"
                  />
                </div>
              )}
              <div className="error-card">{error}</div>
              <button
                onClick={handleReset}
                className="dropzone"
                style={{
                  padding: "16px 24px",
                  borderStyle: "solid",
                  cursor: "pointer",
                }}
              >
                <div className="dropzone-text">Intentar de nuevo</div>
              </button>
            </>
          )}

          {status === "success" && result && (
            <>
              {imageUrl && (
                <div className="preview-section">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="preview-image"
                  />
                </div>
              )}
              <div className="result-card">
                <div className="result-header">
                  <div className="result-header-icon">✓</div>
                  <div className="result-header-title">
                    Decodificado correctamente
                  </div>
                  <button
                    className="result-header-copy"
                    onClick={() => {
                      const text = [
                        cleanDni(result.dni),
                        cleanPhone(result.phone),
                        result.bank,
                      ].join("\n");
                      navigator.clipboard.writeText(text);
                    }}
                    title="Copiar datos"
                  >
                    📋
                  </button>
                </div>
                {fields.map((f) => (
                  <div className="result-field" key={f.label}>
                    <span className="result-field-label">{f.label}</span>
                    <span className="result-field-value">{f.value}</span>
                  </div>
                ))}
              </div>
              {raw && (
                <div className="raw-section">
                  <div className="raw-header">Contenido crudo del QR</div>
                  <div className="raw-text">{raw}</div>
                </div>
              )}
              <button
                onClick={handleReset}
                className="dropzone"
                style={{
                  marginTop: 24,
                  padding: "16px 24px",
                  borderStyle: "solid",
                  cursor: "pointer",
                }}
              >
                <div className="dropzone-text">Escanear otro QR</div>
              </button>
            </>
          )}
        </>
      )}

      {tab === "generate" && <GenerateQrTab />}

      <div className="footer">
        <a
          href="https://github.com/asmel2020/decoder-qr-pago-movil"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          BNC QR Pago Móvil Decoder — Open Source
        </a>
      </div>
    </div>
  );
}

export default App;
