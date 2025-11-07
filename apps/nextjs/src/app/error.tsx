// apps/nextjs/src/app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <h1>500 – Application Error</h1>
      <p>{error.message}</p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          background: "#fff",
          color: "#000",
          border: "none",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}
