export function KASCHeader() {
  return (
    <div className="flex w-full items-center justify-between gap-1 border-b bg-white p-2 md:gap-4 md:px-6 md:py-4">
      {/* Left Logo */}
      <div className="flex shrink-0 items-center justify-start">
        <img
          src="https://kongunaducollege.ac.in/sites/kongunaducollege.ac.in/files/colege_logo.webp"
          alt="KASC Logo"
          className="h-12 w-12 object-contain sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24"
        />
      </div>

      {/* Center Text Block */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-[11px] font-bold leading-tight text-[#000080] sm:text-[14px] md:text-2xl lg:text-3xl">
          KONGUNADU ARTS AND SCIENCE COLLEGE
        </h1>
        <h2 className="text-[9px] font-semibold text-[#000080] sm:text-[12px] md:text-lg">
          (AUTONOMOUS)
        </h2>
        <p className="mx-auto mt-0.5 max-w-[280px] text-[8px] font-medium leading-tight text-black sm:text-[10px] md:max-w-none md:text-sm md:leading-normal">
          Re-accredited by NAAC with A<sup className="text-[6px] md:text-[10px]">+</sup> Grade - 4<sup className="text-[6px] md:text-[10px]">th</sup> cycle,<br className="md:hidden" /> College of Excellence - UGC
        </p>
        <p className="text-[8px] text-black sm:text-[10px] md:text-sm">
          Coimbatore - 641 029, Tamil Nadu, India
        </p>
      </div>

      {/* Right Logo */}
      <div className="flex shrink-0 items-center justify-end">
        <img
          src="https://kongunaducollege.ac.in/sites/kongunaducollege.ac.in/files/53years.webp"
          alt="53 Years of Excellence"
          className="h-10 w-10 object-contain sm:h-14 sm:w-14 md:h-20 md:w-20 lg:h-24 lg:w-24"
        />
      </div>
    </div>
  );
}
