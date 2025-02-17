export default function NavLogo() {
  return (
    <nav className="border-gray-200 bg-white dark:bg-gray-900">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
        <a
          href="https://flowbite.com/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            className="h-8"
            alt="Flowbite Logo"
          />
          <span className="self-center whitespace-nowrap bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-center text-2xl text-transparent">
            QGen
          </span>
        </a>
      </div>
    </nav>
  );
}
