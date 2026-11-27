export default function ProjectBackground({
  image,
  opacity,
}: {
  image: string | null;
  opacity: number;
}) {
  if (!image || opacity <= 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${image}")`, opacity: opacity / 100 }}
    />
  );
}
