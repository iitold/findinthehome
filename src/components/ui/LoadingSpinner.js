'use client';

export default function LoadingSpinner({ size = 24 }) {
  return (
    <div className="spinner-wrapper">
      <div
        className="spinner"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
