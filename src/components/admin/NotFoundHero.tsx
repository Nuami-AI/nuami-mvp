export function NotFoundHero() {
  return (
    <div className="flex h-40 items-center justify-center select-none sm:h-52" aria-hidden>
      <span className="flex h-full items-center text-[10rem] font-bold leading-none tracking-tight text-gray-200 sm:text-[13rem]">
        4
      </span>
      <svg
        viewBox="0 0 200 210"
        className="-mx-2 h-full w-auto sm:-mx-1"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="not-found-torso">
            <rect x="0" y="156" width="200" height="54" />
          </clipPath>
        </defs>
        <ellipse cx="100" cy="102" rx="48" ry="54" fill="#FFF6F5" stroke="#242422" strokeWidth="2.6" />
        <path
          clipPath="url(#not-found-torso)"
          d="M72 158c-16 22-10 44 14 48h32c24-4 28-26 12-48-12 12-34 14-58 0Z"
          fill="#F97E6D"
          stroke="#242422"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M54 96c4-44 34-70 66-66 30 4 50 32 48 68-16-14-38-20-62-16-18 4-36 10-52 14Z"
          fill="#6B5344"
          stroke="#242422"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M48 108c-10 12-8 28 4 30"
          fill="#6B5344"
          stroke="#242422"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M152 106c10 10 8 26-4 30"
          fill="#6B5344"
          stroke="#242422"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <ellipse cx="74" cy="128" rx="10" ry="7" fill="#F97E6D" opacity="0.4" />
        <ellipse cx="126" cy="128" rx="10" ry="7" fill="#F97E6D" opacity="0.4" />
        <ellipse cx="78" cy="108" rx="11" ry="13" stroke="#242422" strokeWidth="2.3" />
        <ellipse cx="122" cy="106" rx="11" ry="13" stroke="#242422" strokeWidth="2.3" />
        <circle cx="82" cy="106" r="4.2" fill="#242422" />
        <circle cx="126" cy="104" r="4.2" fill="#242422" />
        <circle cx="83.4" cy="104.6" r="1.3" fill="#fff" />
        <circle cx="127.4" cy="102.6" r="1.3" fill="#fff" />
        <ellipse cx="100" cy="140" rx="6" ry="7.5" stroke="#242422" strokeWidth="2.4" />
        <path
          d="M46 146c-7 10-4 18 6 16"
          stroke="#242422"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="44" cy="164" r="3.4" fill="#C39EFF" stroke="#242422" strokeWidth="1.6" />
        <path
          d="M128 22h48c7 0 12 5 12 12v22c0 7-5 12-12 12h-10l-10 10v-10h-28c-7 0-12-5-12-12V34c0-7 5-12 12-12Z"
          fill="#fff"
          stroke="#242422"
          strokeWidth="2.3"
        />
        <text
          x="152"
          y="52"
          textAnchor="middle"
          fill="#242422"
          fontSize="14"
          fontWeight="700"
          fontFamily="var(--font-geist-sans), Pretendard, sans-serif"
        >
          Oops...
        </text>
      </svg>
      <span className="flex h-full items-center text-[10rem] font-bold leading-none tracking-tight text-gray-200 sm:text-[13rem]">
        4
      </span>
    </div>
  );
}
