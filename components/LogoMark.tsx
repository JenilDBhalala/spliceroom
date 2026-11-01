/** The spliced green dot from the favicon. `id` keeps clip-path ids unique when two marks are on the page. */
export default function LogoMark({ className, id = "logo" }: { className?: string; id?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className={className}>
      <clipPath id={`${id}-a`}>
        <path d="M0 0H64L0 64Z" />
      </clipPath>
      <clipPath id={`${id}-b`}>
        <path d="M64 0V64H0Z" />
      </clipPath>
      <g transform="translate(-3 -3)">
        <circle cx="32" cy="32" r="19" fill="var(--color-accent)" clipPath={`url(#${id}-a)`} />
      </g>
      <g transform="translate(3 3)">
        <circle cx="32" cy="32" r="19" fill="var(--color-accent)" clipPath={`url(#${id}-b)`} />
      </g>
    </svg>
  );
}
