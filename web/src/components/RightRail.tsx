import PageOutline from "./PageOutline";

export default function RightRail() {
  return (
    <>
      {/* xl:pt-[88.75px] clears the real brand header now painted over this
          same sticky column, plus header-spacing-and-icon-alignment's
          explicit 15px margin to "On this page" — see the matching note in
          DrawerNav.tsx. */}
      <div className="hidden xl:sticky xl:top-0 xl:z-auto xl:flex xl:h-screen xl:w-64 xl:shrink-0 xl:flex-col xl:gap-6 xl:border-l xl:border-foreground/20 xl:bg-background xl:px-5 xl:pb-6 xl:pt-[88.75px]">
        <PageOutline />
      </div>
    </>
  );
}
